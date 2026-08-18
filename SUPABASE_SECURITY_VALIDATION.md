# VIVECI — validação de segurança do Supabase

Data: 18 de agosto de 2026.

## Resultado atualizado da Etapa 29

**PASS parcial com pendências específicas**

O repositório foi auditado localmente e a configuração remota foi validada pelo
proprietário no painel oficial, com duas contas descartáveis. Nenhuma credencial,
senha, token ou URL assinada foi copiada para este documento.

## Chave anteriormente compartilhada

O repositório auditado não contém um valor `sb_secret_`. Isso não prova revogação.

Em 18 de agosto de 2026, o proprietário confirmou por mensagem que a chave
anterior foi rotacionada. Nenhum valor foi solicitado, recebido ou registrado.

Status: **confirmado pelo proprietário; não verificado programaticamente**.

## Migrations 09–13

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

### 12 — métricas sociais compartilhadas

Estado local esperado: `posts_publicos` mascara duração, séries e volume não
autorizados; `posts_proprios` restringe a exportação ao titular; leitura bruta
sensível de `posts` é revogada; exclusão usa RPC autorizada. O estado remoto e o
teste A/B ainda não foram comprovados.

### 13 — privilégios mínimos

O inventário remoto mostrou `TRUNCATE`, `TRIGGER` e `REFERENCES` concedidos por
padrão a `anon` e `authenticated` em todas as relações públicas. A migration 13
remove todo acesso de `anon`, retira os três privilégios administrativos de
`authenticated` e ajusta os privilégios padrão para relações futuras. O DML
autenticado necessário continua sujeito às policies RLS.

Status remoto: estruturas das migrations 09–11 confirmadas; migration 12 aplicada
e validada; migration 13 aplicada e consulta de privilégios excessivos retornou
zero linhas.

## Matriz de acesso esperada

| Recurso | Próprio usuário | Outro autenticado | Evidência remota |
|---|---|---|---|
| Perfil completo (`perfis`) | leitura/escrita própria | não | PASS A/B para leitura |
| Perfil público mínimo | sim | `id`, nome, avatar e bio | PASS A/B |
| Rotinas, sessões e itens | sim | não | PASS A/B para rotina/sessão |
| Registros e sessões concluídas | sim | não | PASS A/B |
| Cardio, medidas, nutrição, metas e preferências | sim | não | nutrição PASS; demais pendentes |
| Body Scan e metadados | sim | não | PASS A/B com 3 registros reais |
| Posts | sim | leitura social limitada | PASS A/B para flags de métricas |
| Comentários, likes e seguidores | conforme autoria/interação | leitura social | interação normal PASS; abuso pendente |
| Avatar e foto social | pública | pública | PASS pela interface |
| Foto corporal nova | URL assinada para o dono | não | RLS PASS; expiração prática pendente |
| Bloqueios e denúncias | somente autor/denunciante | não | não testada |

## Teste A/B

Executado remotamente com duas contas descartáveis. B recebeu zero linhas do
perfil completo, rotinas, sessões, registros, diário e Body Scan de A, mas recebeu
o perfil público. No sentido inverso, A recebeu zero linhas dos 3 registros e 3
objetos privados de Body Scan de B. O post de A com somente duração autorizada
retornou duração presente, séries `NULL` e volume `NULL` para B.

Conta B Free criou quatro rotinas. A quinta foi bloqueada na interface e pelo RPC
`criar_rotina` com `23514`; a contagem continuou em quatro. A tentativa de mudar
`perfis.plano` para Pro falhou com `42501` e o plano permaneceu `free`.

## Etapa 33 — validação remota

**Resultado atualizado: PASS parcial com pendências específicas.**

O inventário somente leitura foi executado. Migrations 09–13, views, funções,
triggers, índices, buckets e policies foram verificados; duas contas descartáveis
foram usadas nos testes descritos acima. Permanecem pendentes apenas os itens
marcados como tal na matriz, sem extrapolar a evidência coletada.

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

Status local e remoto: **corrigido e testado A/B**.

## Storage

Uso local encontrado:

- `midia-publica/<user_id>/avatar/...`: avatar público;
- `midia-publica/<user_id>/social/...`: foto social pública;
- `progresso-privado/<user_id>/body/...`: Body Scan privado;
- `Fotos/<user_id>/...`: bucket legado.

Novos Body Scans guardam bucket/path, geram URL assinada por uma hora e não
persistem a signed URL. A geração passa pela RLS esperada do proprietário.
Buckets, flags e policies remotos: **confirmados**. A privacidade do Body Scan foi
testada A/B; a expiração prática da signed URL permanece pendente.

## Fotos legadas

O inventário remoto encontrou zero registros/fotos corporais legados. O bucket
`Fotos` é privado e contém 6 objetos de paths de avatar/social, sendo 1 avatar
referenciado e 5 sem referência inequívoca; todos foram preservados.

A ordem segura permanece:

1. inventariar e classificar o arquivo;
2. copiar Body Scan para o bucket privado;
3. atualizar `storage_bucket`/`storage_path`;
4. validar acesso A/B e expiração;
5. só então remover a origem pública.

Não houve cópia, exclusão ou alteração automática de arquivos.

O relatório `STORAGE_MIGRATION_REPORT.md` contém as contagens reais. Foram
adicionadas compensações locais para reduzir órfãos quando upload conclui e a
persistência posterior falha.

Na revisão remota posterior, o proprietário decidiu que o aplicativo não deve
oferecer exclusão de conta. A opção, a chamada e a Edge Function local foram
removidas; deploy e teste destrutivo deixaram de fazer parte do escopo do produto.

## Release gate da Etapa 37

O proprietário confirmou a rotação da chave antiga sem fornecer o novo valor.
Migrations 09–13, matriz A/B principal, buckets, Body Scan, limite Free, plano e
privacidade social foram comprovados remotamente. As pendências restantes estão
registradas de forma específica, sem manter bloqueios já resolvidos.

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

## Pendências remotas restantes

1. comprovar na prática a expiração de uma URL assinada;
2. testar tentativa explícita de sobrescrever path de outro usuário;
3. completar a matriz A/B de medidas, preferências, cardio, bloqueios e denúncias;
4. decidir a retenção dos cinco objetos legados sem referência inequívoca;
5. continuar registrando evidências sem tokens, senhas, URLs assinadas ou dados pessoais.
