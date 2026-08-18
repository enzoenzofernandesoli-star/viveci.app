# VIVECI — checklist final do beta fechado

Atualizado em 18 de agosto de 2026 após as Etapas 23–28. Itens locais concluídos não permanecem como pendência. Nenhum item remoto abaixo foi marcado como feito sem comprovação no ambiente de homologação.

## P0 — bloqueia beta com usuários reais

- [ ] Rotacionar no Supabase toda chave secreta já compartilhada e confirmar que somente a URL e a chave publicável ficam no frontend.
- [ ] Confirmar no Supabase remoto a aplicação, em ordem, das migrations 09, 10 e 11 e validar RLS com duas contas comuns.
- [ ] Confirmar os buckets `midia-publica` (público) e `progresso-privado` (privado), suas policies e a impossibilidade de uma segunda conta acessar um Body Scan.
- [ ] Migrar os arquivos corporais legados conforme `sql/MIGRACAO_FOTOS_BETA.md` e confirmar que nenhuma URL pública antiga expõe fotos corporais.
- [ ] Definir e disponibilizar um fluxo seguro de exclusão de conta, dados e arquivos. A Edge Function `excluir-conta` e seu acionamento estão removidos no estado local auditado; não anunciar exclusão automática enquanto isso não for resolvido e testado ponta a ponta.
- [ ] Concluir Política de Privacidade e Termos de Uso com responsável, contato, retenção, idade mínima, jurisdição e revisão profissional antes de convidar usuários reais.

## P1 — importante para o beta controlado

- [ ] Configurar no Auth as URLs reais de confirmação, produção e `/redefinir-senha`; testar links válidos, expirados e inválidos.
- [ ] Executar com duas contas de homologação: cadastro, confirmação, onboarding, login, recuperação, criação de rotina, limite Free pela API, treino completo, Corpo, Social, bloqueio e denúncia.
- [ ] Testar upload e exclusão de avatar, post e Body Scan no Storage remoto, incluindo falha de rede e arquivos inválidos.
- [ ] Confirmar que treino concluído reaparece após novo login em histórico, Corpo, evolução, PR, DNA e recomendação com dados reais do Supabase.
- [ ] Validar a decisão operacional para sessões abandonadas: elas ficam com `finalizada_em = NULL`, não aparecem no histórico e não são retomadas.
- [ ] Definir quem revisa denúncias sociais; hoje elas são persistidas, mas não há painel de moderação.
- [ ] Configurar monitoramento de erros e alertas mínimos antes de ampliar o grupo.
- [ ] Fazer uma rodada em aparelhos reais nos tamanhos equivalentes a 375, 390 e 430 px, inclusive com teclado virtual, câmera e instalação PWA.

## P2 — pós-beta

- [ ] Criar ambiente Supabase isolado para E2E autenticado automatizado e testes cruzados de RLS/Storage.
- [ ] Avaliar retomada explícita ou limpeza programada de sessões abandonadas.
- [ ] Criar thumbnails/processamento de mídia se o volume real do Social ou do Body Scan justificar.
- [ ] Avaliar monitoramento de performance em dispositivos reais e rede lenta.

## Validações locais concluídas

- [x] 130 testes unitários passando.
- [x] 7 testes E2E passando no Chromium local: login, recuperação, proteção de rota, persistência do onboarding, criação de rotina, sessão e cardio.
- [x] TypeScript e build de produção passando.
- [x] Lint de `src` passando.
- [x] `git diff --check` sem erro.
- [x] Manifest, metadata e service worker revisados; não há promessa de plano automático de 12 semanas nem de funcionamento offline completo.
- [x] Food Scanner, Label Scanner, análise de movimento e análise de físico identificados como `DEMONSTRAÇÃO`/experimental na interface.
- [x] Viewports automatizados 375×667, 390×844, 430×932, 1024, 1280 e 1440 sem overflow horizontal no fluxo público auditado.

## Limite da evidência

Os E2E autenticados usam um backend Supabase simulado e seguro; eles validam a jornada da interface e a prevenção de duplicatas, não comprovam Auth, RLS, Storage, email ou persistência do projeto Supabase remoto. Esses pontos só podem ser marcados após homologação real.
