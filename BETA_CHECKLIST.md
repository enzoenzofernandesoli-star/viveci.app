# VIVECI — checklist final do beta fechado

Release gate atualizado em 18 de agosto de 2026 após as Etapas 32–37.

## P0 — BLOQUEIA BETA

- [x] Proprietário confirmou que a chave secreta antiga foi rotacionada, sem compartilhar o novo valor.
- [x] Migrations 09–13 confirmadas remotamente; migration 12 e privilégios mínimos aplicados.
- [x] Perfil completo, rotinas, sessões, registros e nutrição de A ficaram invisíveis para B; perfil público mínimo permaneceu visível.
- [x] `progresso-privado` validado com 3 registros/arquivos reais de B: B acessa e A recebe zero.
- [x] Inventário confirmou zero Body Scans legados; nenhum arquivo corporal precisava ser migrado.
- [x] Teste A/B comprovou que duração compartilhada chega ao feed e séries/volume desmarcados retornam `NULL`.
- [x] Conta Free permaneceu com quatro rotinas; quinta falhou na interface e no RPC; promoção direta para Pro falhou com `42501`.
- [x] Matriz A/B complementar aprovada para medidas, preferências, cardio, bloqueios e denúncias.
- [x] Sobrescrita de path privado alheio bloqueada remotamente por RLS com `42501`.
- [ ] Confirmar expiração prática da URL assinada.
- [x] Beta 18+ aplicado no app e no Supabase; idade 17 rejeitada remotamente com `23514`.

## P1 — PODE ENTRAR NO BETA COM ACOMPANHAMENTO

- [ ] Definir responsável, contato, retenção, backups e fornecedores/regiões. O procedimento mínimo de incidente já está documentado.
- [ ] Submeter Política de Privacidade e Termos a revisão jurídica profissional antes de lançamento público.
- [ ] Definir responsável e processo operacional para denúncias sociais.
- [ ] Configurar error tracking, logs e alertas mínimos.
- [ ] Testar confirmação e recuperação de email, câmera, teclado virtual e instalação PWA em aparelhos reais.
- [ ] Acompanhar sessões abandonadas (`finalizada_em = NULL`), que não são retomadas.

## P2 — PÓS-BETA

- [ ] Criar Supabase isolado para automatizar E2E de Auth, RLS, Storage e duas contas.
- [ ] Unificar criação de rotina e itens em uma única transação ou criar compensação explícita.
- [x] Adicionar compensação local quando upload conclui e a persistência seguinte falha. Cinco objetos legados sem referência continuam preservados para avaliação.
- [ ] Avaliar retomada/limpeza programada de sessões abandonadas.
- [ ] Adicionar thumbnails/processamento de mídia somente quando o uso real justificar.

## Concluído localmente

- [x] 138/138 testes unitários.
- [x] 10/10 E2E no Chromium local contra o build de produção, incluindo idade mínima de 18 anos, ausência da opção de excluir conta e smoke das áreas principais.
- [x] Runner validado no Windows com o servidor de preview controlado externamente; isso evita o travamento de encerramento observado com o servidor de desenvolvimento interno do Playwright.
- [x] TypeScript/build, lint e `git diff --check` aprovados.
- [x] Smoke test em 375, 390, 430 e 1280 px: Home, Treino, Corpo, Nutrição, Social, Perfil e Configurações.
- [x] Upload local valida MIME, extensão e tamanho.
- [x] Exportação JSON ampliada, versionada, com referências de mídia e remoção defensiva de segredos/tokens.
- [x] Opção de exclusão de conta removida por decisão do produto; nenhum endpoint administrativo é exposto pelo app.
- [x] Política de Privacidade, Termos e ciclo de dados alinhados tecnicamente ao produto, ainda como rascunhos.
- [x] Recursos simulados continuam identificados como demonstração/experimental.
- [x] Payload social é mascarado na view/RPC local e filtrado novamente no cliente; 3 testes cobrem combinações das flags.
- [x] Documentos `BETA_PRODUCT_DECISIONS.md` e `BETA_OPERATIONS.md` registram idade pendente, placeholders e resposta mínima a incidente.

## Limite da evidência

Os E2E autenticados usam backend Supabase simulado. Eles validam interface e comportamento local, não comprovam configuração remota, RLS, Storage nem email. Consulte `SUPABASE_SECURITY_VALIDATION.md`.
