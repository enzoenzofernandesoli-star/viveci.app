# VIVECI — checklist final do beta fechado

Release gate atualizado em 18 de agosto de 2026 após as Etapas 29–31.

## P0 — BLOQUEIA BETA

- [ ] Confirmar no painel que a chave secreta anteriormente compartilhada foi revogada/rotacionada. Não enviar o valor da chave.
- [ ] Confirmar no remoto as migrations 09–11 e executar a matriz RLS com duas contas descartáveis de homologação.
- [ ] Provar que o perfil completo, rotinas, registros, nutrição, medidas e preferências de A não são legíveis por B.
- [ ] Provar que `progresso-privado` é privado, que B não acessa Body Scan de A e que URLs assinadas expiram.
- [ ] Migrar e validar fotos corporais legadas antes de remover qualquer origem.
- [ ] Impedir no contrato do banco/API que métricas de treino desmarcadas pelo autor sejam lidas no snapshot bruto de posts.
- [ ] Provar pelo backend que um usuário comum não altera Free para Pro e que a quinta rotina Free falha.
- [ ] Publicar `excluir-conta`, configurar segredos somente na Edge Function e executar a jornada criar dados → exportar → excluir → confirmar Auth, banco e arquivos removidos.
- [ ] Definir política de idade mínima antes de incluir pessoas reais no beta.

## P1 — PODE ENTRAR NO BETA COM ACOMPANHAMENTO

- [ ] Definir responsável, contato, retenção, backups, fornecedores/regiões e procedimento de incidente nos documentos de privacidade.
- [ ] Submeter Política de Privacidade e Termos a revisão jurídica profissional antes de lançamento público.
- [ ] Definir responsável e processo operacional para denúncias sociais.
- [ ] Configurar error tracking, logs e alertas mínimos.
- [ ] Testar confirmação e recuperação de email, câmera, teclado virtual e instalação PWA em aparelhos reais.
- [ ] Acompanhar sessões abandonadas (`finalizada_em = NULL`), que não são retomadas.

## P2 — PÓS-BETA

- [ ] Criar Supabase isolado para automatizar E2E de Auth, RLS, Storage e duas contas.
- [ ] Unificar criação de rotina e itens em uma única transação ou criar compensação explícita.
- [ ] Tratar arquivos órfãos quando upload conclui e insert falha ou quando remoção de post falha.
- [ ] Avaliar retomada/limpeza programada de sessões abandonadas.
- [ ] Adicionar thumbnails/processamento de mídia somente quando o uso real justificar.

## Concluído localmente

- [x] 131/131 testes unitários.
- [x] 10/10 E2E no Chromium local, incluindo confirmação/falha da exclusão e smoke das áreas principais.
- [x] TypeScript/build, lint e `git diff --check` aprovados.
- [x] Smoke test em 375, 390, 430 e 1280 px: Home, Treino, Corpo, Nutrição, Social, Perfil e Configurações.
- [x] Upload local valida MIME, extensão e tamanho.
- [x] Exportação JSON ampliada, versionada, com referências de mídia e remoção defensiva de segredos/tokens.
- [x] Edge Function local deriva o usuário do JWT, impede clique duplicado e não declara sucesso em falha.
- [x] Política de Privacidade, Termos e ciclo de dados alinhados tecnicamente ao produto, ainda como rascunhos.
- [x] Recursos simulados continuam identificados como demonstração/experimental.

## Limite da evidência

Os E2E autenticados usam backend Supabase simulado. Eles validam interface e comportamento local, não comprovam configuração remota, RLS, Storage, email nem exclusão real. Consulte `SUPABASE_SECURITY_VALIDATION.md`.
