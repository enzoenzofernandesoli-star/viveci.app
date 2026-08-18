-- VIVECI — BLOCO 13: privilégios mínimos do frontend
-- Aplicar depois de 12_privacidade_metricas_social.sql.

-- Visitantes não autenticados usam apenas o Supabase Auth. Nenhuma tela pública
-- do VIVECI consulta ou altera relações do schema public.
revoke all privileges on all tables in schema public from anon;

-- Usuários autenticados continuam com o DML necessário, sempre limitado pelas
-- policies RLS. Estes privilégios administrativos não são usados pelo app e não
-- devem estar disponíveis ao papel da API.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Novas tabelas/views criadas pelo owner postgres também devem nascer com o
-- mesmo padrão. DML necessário deve ser concedido explicitamente pela migration
-- que criar cada nova relação.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;

