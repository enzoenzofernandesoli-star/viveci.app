# VIVECI — validação de segurança do Supabase

Data: 18 de agosto de 2026.

## Resultado da Etapa 29

**BLOCKED**

Ambiente auditado: repositório local e configuração pública do frontend. O
workspace possui somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; não há
Supabase CLI vinculado, credencial administrativa segura nem duas contas de
homologação disponíveis. Nenhuma credencial pessoal ou de produção foi usada.

Este documento separa configuração local esperada de configuração remota
comprovada. Nada listado como esperado foi marcado como ativo no projeto remoto.

## Chave anteriormente compartilhada

O repositório auditado não contém um valor `sb_secret_`. Isso não prova revogação.

Em 18 de agosto de 2026, o proprietário confirmou por mensagem que a chave
anterior foi rotacionada. Nenhum valor foi solicitado, recebido ou registrado.

Status: **confirmado pelo proprietário; não verificado programaticamente**.

## Migrations 09–11

### 09 — segurança, privacidade e autorização

Estado local esperado:

- cria/normaliza `midia-publica` (público) e `progresso-privado` (privado), com
  limite de 10 MB e MIME JPEG/PNG/WebP;
- restringe escrita/leitura privada ao primeiro segmento `<auth.uid()>` do path;
- adiciona paths de Storage e snapshots sociais;
- limita bio, legenda e comentário;
- substitui leitura da tabela completa `perfis` pela view mínima
  `perfis_publicos` (`id`, `nome`, `foto_url`, `bio`);
- impede promoção de plano pelo cliente e a quinta rotina Free;
- deriva o snapshot social de uma sessão pertencente ao autor;
- cria bloqueios, denúncias e filtros sociais.

### 10 — integridade das rotinas

Estado local esperado:

- RPC `criar_rotina(text)` e `salvar_itens_rotina(uuid,jsonb)` somente para
  autenticados;
- valida nome, duplicidade/ordem dos exercícios, séries, repetições e descanso;
- cria FKs de registros/sessões e define `finalizada_em = NULL` como abandonada.

Observação: criar a rotina e salvar seus itens são duas RPCs distintas. Cada RPC
é atômica, mas o fluxo completo não é uma única transação; se a segunda falhar,
a rotina base já pode existir. Portanto “criação integralmente atômica” ainda não
está comprovada pelo desenho atual.

### 11 — performance

Estado local esperado: índices para posts, comentários, likes, seguidores,
registros, sessões finalizadas, diário e fotos de progresso.

Status remoto das três migrations: **não comprovado**. Elas não foram reaplicadas.

## Matriz de acesso esperada

| Recurso | Próprio usuário | Outro autenticado | Evidência remota |
|---|---|---|---|
| Perfil completo (`perfis`) | leitura/escrita própria | não | não testada |
| Perfil público mínimo | sim | `id`, nome, avatar e bio | não testada |
| Rotinas, sessões e itens | sim | não | não testada |
| Registros e sessões concluídas | sim | não | não testada |
| Cardio, medidas, nutrição, metas e preferências | sim | não | não testada |
| Body Scan e metadados | sim | não | não testada |
| Posts | sim | leitura social | não testada |
| Comentários, likes e seguidores | conforme autoria/interação | leitura social | não testada |
| Avatar e foto social | pública | pública | não testada |
| Foto corporal nova | URL assinada para o dono | não | não testada |
| Bloqueios e denúncias | somente autor/denunciante | não | não testada |

## Teste A/B

Não executado. Não existem duas contas de teste nem ambiente Supabase isolado
configurado. Testes locais com backend simulado não foram usados como evidência
de RLS.

Precisam ser validados remotamente:

1. B não lê perfil completo, rotinas, registros, diário, medidas, preferências ou
   Body Scan de A;
2. B lê somente o perfil público e conteúdo social de A;
3. A não altera `plano` para Pro e a quinta rotina Free falha pela API;
4. bloqueios e autoria impedem interações indevidas.

## Etapa 33 — validação remota

**Resultado: BLOCKED.**

Foi criado `sql/VALIDAR_SEGURANCA_REMOTA.sql`, somente leitura, para inventariar
funções, triggers, views, índices, buckets e policies. O proprietário optou por
adiar sua execução. Portanto:

- migrations 09–12 não foram confirmadas nem reaplicadas;
- nenhuma conta descartável A/B foi criada;
- perfil privado, plano, limite Free, rotina e Social não foram testados no remoto;
- a matriz de acesso continua sendo expectativa local, não evidência operacional.

Não existe commit, teste mockado ou inspeção de SQL local que substitua essa
validação.

## Social e treino associado — correção local da Etapa 32

Fluxo anterior: `CriarPost` enviava o id da sessão e flags; o trigger validava a
autoria, materializava nome/duração/séries/volume em `posts`; o feed fazia
`posts.select('*')`; `PostCard` escondia métricas conforme os flags. Portanto o
payload bruto ainda continha dados que o autor havia desmarcado.

A migration `12_privacidade_metricas_social.sql` cria:

- `posts_publicos`, contrato do feed que substitui o id da sessão por
  `tem_treino` e devolve `NULL` para cada métrica não autorizada;
- `posts_proprios`, visão completa limitada por `auth.uid()` para exportação;
- revogação do SELECT geral de `posts`, mantendo apenas colunas não sensíveis;
- RPC `excluir_post`, que valida o JWT e devolve `foto_path` somente ao autor.

O feed passou a consultar `posts_publicos` e ainda filtra as métricas no cliente
como defesa adicional. Posts antigos permanecem compatíveis porque o contrato é
calculado sobre as linhas existentes; nenhuma cópia de treino foi criada.

Status local: **corrigido e testado**. Status remoto: **não comprovado até aplicar
a migration 12 e executar o teste A/B inspecionando o payload**.

## Storage

Uso local encontrado:

- `midia-publica/<user_id>/avatar/...`: avatar público;
- `midia-publica/<user_id>/social/...`: foto social pública;
- `progresso-privado/<user_id>/body/...`: Body Scan privado;
- `Fotos/<user_id>/...`: bucket legado.

Novos Body Scans guardam bucket/path, geram URL assinada por uma hora e não
persistem a signed URL. A geração passa pela RLS esperada do proprietário.
Buckets, flags e policies remotos: **não comprovados**.

## Fotos legadas

`fotos_progresso` originalmente guardava uma URL. Registros sem `storage_path`
continuam exibindo essa URL como fallback. Portanto fotos antigas podem continuar
públicas até a migração real.

A ordem segura permanece:

1. inventariar e classificar o arquivo;
2. copiar Body Scan para o bucket privado;
3. atualizar `storage_bucket`/`storage_path`;
4. validar acesso A/B e expiração;
5. só então remover a origem pública.

Não houve cópia, exclusão ou alteração automática de arquivos.

Na Etapa 34, o proprietário optou por adiar o inventário remoto. O relatório
`STORAGE_MIGRATION_REPORT.md` permanece com contagens “não medido” e zero ações.
Foram adicionadas compensações locais para reduzir órfãos quando upload conclui e
a persistência posterior falha; isso não substitui a validação dos buckets.

## Uploads e órfãos

- frontend valida MIME, extensão coerente e tamanho (5 MB avatar; 10 MB post e
  Body Scan);
- migration 09 espera validar MIME e 10 MB no Storage;
- paths começam pelo usuário autenticado e as policies locais esperadas conferem
  esse segmento;
- trocar avatar tenta remover versões anteriores;
- excluir Body Scan remove o arquivo antes da linha;
- excluir post remove a linha e depois tenta remover a foto, mas ignora falha na
  remoção do arquivo, podendo deixar órfão;
- se o insert do post ou da foto de progresso falhar após o upload, o arquivo
  recém-enviado pode ficar órfão.

Não foi implementado garbage collector nesta etapa.

## Ações manuais para desbloquear

1. confirmar rotação/revogação da chave antiga;
2. inspecionar migrations 09–11 no remoto sem reaplicação cega;
3. confirmar/aplicar a migration 12 e validar métricas ocultas no payload A/B;
4. criar duas contas descartáveis em homologação e executar a matriz A/B;
5. confirmar buckets/policies e migrar fotos legadas com cópia antes da remoção;
6. registrar evidências sem tokens, senhas, URLs assinadas ou dados pessoais.

Até essas ações terminarem, a Etapa 29 não pode receber `PASS`.
