-- VIVECI — BLOCO 20: promover conta adicional a host
-- Aplicar depois de 18_host_moderacao.sql.
--
-- O papel é associado ao UUID atual da conta. Alterações futuras no e-mail
-- não transferem os privilégios para outra pessoa.

do $$
declare
  host_id uuid;
begin
  select id into host_id
  from auth.users
  where lower(email) = lower('enzo.enzofernandezoli@gmail.com');

  if host_id is null then
    raise exception 'Conta host não encontrada. Crie e confirme enzo.enzofernandezoli@gmail.com antes de aplicar esta migration.';
  end if;

  insert into public.papeis_aplicativo (user_id, papel)
  values (host_id, 'host')
  on conflict (user_id) do update set papel = excluded.papel;
end;
$$;

