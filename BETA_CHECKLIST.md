# VIVECI — checklist do beta interno

## Preparação externa

- Rotacionar no painel do Supabase toda chave secreta já compartilhada. O frontend deve manter somente URL e chave publicável.
- Aplicar as migrations da pasta `sql/` em ordem, incluindo `09_seguranca_beta.sql` e `10_integridade_rotinas.sql`.
- Confirmar os buckets `midia-publica` (público) e `progresso-privado` (privado) e suas policies.
- Executar a migração dos arquivos antigos descrita em `sql/MIGRACAO_FOTOS_BETA.md`.
- Publicar a Edge Function `excluir-conta` com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente da função.
- Configurar no Auth as URLs de redirecionamento da produção e `/redefinir-senha`.
- Criar duas contas de teste comuns, sem conceder plano Pro pelo cliente.

## Verificação manual

- Cadastro, confirmação de email, login, logout, recuperação e redefinição de senha.
- Onboarding e edição de perfil.
- Criar quatro rotinas no Free; confirmar bloqueio da quinta pela interface e pela API.
- Criar, editar e excluir uma rotina; simular falha e confirmar que não fica parcialmente salva.
- Iniciar e abandonar uma sessão; confirmar que ela não aparece no histórico. Finalizar outra com séries, carga, descanso e PR.
- Compartilhar a sessão finalizada e um Treino Rápido; revisar as métricas antes de publicar.
- Publicar e excluir foto, comentário e post. Bloquear outro usuário e denunciar um conteúdo.
- Enviar avatar e Body Scan. Confirmar com a segunda conta que o Body Scan não possui URL pública acessível.
- Registrar alimentação, alterar meta, registrar cardio e exportar os dados.
- Excluir uma conta teste e confirmar remoção de dados e arquivos.
- Confirmar que scanners e análises exibem `DEMONSTRAÇÃO`.

## Validação local

```text
npm test
npm run lint
npm run build
npm run test:e2e
```

## Rollback básico

- Fazer backup do banco e do Storage antes das migrations.
- Preservar os buckets e URLs legados até validar a migração de todas as fotos.
- Em regressão de frontend, voltar ao commit anterior da etapa; migrations aplicadas exigem rollback SQL revisado, nunca exclusão manual improvisada.

## Sessões abandonadas

Uma sessão começa com `finalizada_em = NULL`. Histórico, Intelligence Engine e Social consideram somente sessões com `finalizada_em` preenchido. O beta não retoma sessões interrompidas; elas permanecem como registro técnico incompleto e não contam como treino.
