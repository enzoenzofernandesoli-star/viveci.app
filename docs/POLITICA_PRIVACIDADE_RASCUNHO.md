# Política de Privacidade do VIVECI — rascunho

> Rascunho para revisão jurídica profissional antes de lançamento público. Não é aconselhamento jurídico nem documento pronto para aceite.

Última atualização do rascunho: 18 de agosto de 2026.

## 1. Responsável e contato

Responsável: **[NOME/ENTIDADE RESPONSÁVEL]**

Contato sobre privacidade: **[EMAIL DE CONTATO]**

País/jurisdição principal: **[DECISÃO NECESSÁRIA]**

## 2. Dados tratados

O VIVECI pode armazenar:

- cadastro e conta: identificador, email e autenticação administrada pelo Supabase;
- perfil: nome, bio, avatar, sexo, idade, altura, peso, objetivo e nível;
- treinamento: rotinas, séries, cargas, repetições, descanso, sessões, cardio, PRs e indicadores calculados;
- nutrição: metas, refeições, alimentos, quantidades e macros;
- evolução: medidas, histórico e fotografias corporais enviadas pelo usuário;
- Social: posts, fotos, legendas, treino compartilhado, curtidas, comentários, seguidores, bloqueios e denúncias;
- preferências e dados técnicos locais necessários ao funcionamento, como rascunho do onboarding, sessão e cache PWA.

O VIVECI não deve armazenar senha em texto simples nem chaves secretas no frontend.

## 3. Dados públicos e privados

Nome, bio, avatar e publicações sociais destinam-se à visualização por outros usuários autenticados. Fotos sociais ficam em mídia pública.

Rotinas, registros, alimentação, medidas, preferências, perfil completo e Body Scan destinam-se somente ao titular. Body Scan novo usa bucket privado e URL assinada temporária. Fotografias corporais nunca devem ser publicadas automaticamente.

O isolamento remoto e a migração de fotos legadas precisam ser validados antes do beta.

## 4. Finalidades

Os dados são usados para autenticar a conta, registrar treino e alimentação,
calcular evolução, personalizar recomendações determinísticas, operar o Social,
permitir exportação e manter segurança e integridade do serviço.

As bases legais aplicáveis devem ser definidas por revisão jurídica conforme o responsável, o público e os países atendidos. Este rascunho não escolhe bases legais sem essa decisão.

## 5. Demonstrações experimentais

Food Scanner, Label Scanner, análise de movimento e análise de físico não possuem IA/OCR real no beta auditado. Seus resultados são exemplos fixos identificados como `DEMONSTRAÇÃO` e não devem ser interpretados como diagnóstico, prescrição ou medição clínica.

## 6. Armazenamento e fornecedores

O Supabase é usado para autenticação, banco Postgres e Storage. Hospedagem, analytics, monitoramento, regiões de processamento e demais fornecedores efetivos devem ser inventariados: **[LISTA/REGIÕES PENDENTES]**.

O navegador pode usar local/session storage para sessão gerenciada pelo Supabase, progresso temporário do onboarding e preferências operacionais. O service worker mantém cache básico de arquivos do app; não existe sincronização offline completa.

## 7. Compartilhamento e segurança

Dados podem ser processados pelos fornecedores necessários à operação. Conteúdo social escolhido pelo usuário é compartilhado com outros usuários autenticados. Dados privados não devem compor perfis públicos.

O desenho utiliza autenticação, RLS, separação de buckets, URLs assinadas, validação de upload e privilégio administrativo isolado em Edge Function. O procedimento mínimo de incidente e pausa do beta está em `BETA_OPERATIONS.md`; responsáveis e canais formais continuam pendentes.

## 8. Exportação, correção e exclusão

O usuário pode editar dados do perfil e exportar um JSON com seus dados e referências de mídia. Os binários das fotos não são incorporados.

A exclusão pretende remover arquivos, conta Auth e dados relacionados por cascata. Como Storage, Auth e Postgres não formam uma transação única, falhas são reportadas sem declarar sucesso. O fluxo depende de deploy e teste remoto antes de ser prometido como operacional.

Canal alternativo para solicitações: **[EMAIL DE CONTATO]**.

## 9. Retenção e backups

Prazos de retenção, tratamento de backups, logs, denúncias e descarte após exclusão ainda precisam de decisão operacional e jurídica: **[POLÍTICA DE RETENÇÃO PENDENTE]**.

## 10. Menores de idade

O VIVECI é destinado exclusivamente a pessoas com 18 anos ou mais nesta versão
beta. O cadastro de menores é bloqueado no aplicativo e no banco de dados.

## 11. Direitos e alterações

Os direitos aplicáveis, autoridade competente, forma de atendimento, prazos e comunicação de mudanças dependem da jurisdição e devem ser completados por revisão profissional.
