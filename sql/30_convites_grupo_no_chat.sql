-- VIVECI — BLOCO 30: convite de guilda acionável no chat individual.
-- Seguro para executar novamente. Aplicar depois dos blocos 22 e 29.

begin;

create or replace function public.detalhar_convites_mensagens(p_convite_ids uuid[])
returns table(convite_id uuid,grupo_id uuid,grupo_nome text,grupo_foto text,ativo boolean)
language sql stable security definer set search_path=public as $$
  select gc.id,gc.grupo_id,g.nome,g.foto_url,
    gc.usado_em is null and gc.expira_em>now()
      and not exists(select 1 from public.grupo_membros gm where gm.grupo_id=gc.grupo_id and gm.user_id=gc.convidado_id)
  from public.grupo_convites gc
  join public.grupos_sociais g on g.id=gc.grupo_id
  where auth.uid() is not null
    and gc.id=any(coalesce(p_convite_ids,'{}'::uuid[]))
    and auth.uid() in(gc.convidado_id,gc.criado_por);
$$;

create or replace function public.entrar_grupo(p_grupo_id uuid,p_senha text default null)
returns text language plpgsql security definer set search_path=public,extensions as $$
declare grupo public.grupos_sociais; convite_id uuid; tentativa public.grupo_tentativas_acesso;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  select * into grupo from public.grupos_sociais where id=p_grupo_id;
  if grupo.id is null then raise exception 'Grupo não encontrado.' using errcode='22023'; end if;
  if exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then return 'entrou'; end if;

  select id into convite_id
  from public.grupo_convites
  where grupo_id=p_grupo_id and convidado_id=auth.uid() and usado_em is null and expira_em>now()
  order by expira_em desc limit 1 for update;
  if grupo.visibilidade='privado' and convite_id is null then
    select * into tentativa from public.grupo_tentativas_acesso where grupo_id=p_grupo_id and user_id=auth.uid();
    if tentativa.bloqueado_ate>now() then return 'bloqueado'; end if;
    if p_senha is null or crypt(p_senha,grupo.senha_hash)<>grupo.senha_hash then
      insert into public.grupo_tentativas_acesso(grupo_id,user_id,tentativas,bloqueado_ate,atualizado_em)
      values(p_grupo_id,auth.uid(),1,null,now())
      on conflict(grupo_id,user_id) do update set
        tentativas=case when grupo_tentativas_acesso.bloqueado_ate<=now() then 1 else grupo_tentativas_acesso.tentativas+1 end,
        bloqueado_ate=case when (case when grupo_tentativas_acesso.bloqueado_ate<=now() then 1 else grupo_tentativas_acesso.tentativas+1 end)>=5 then now()+interval '15 minutes' else null end,
        atualizado_em=now();
      return 'senha_incorreta';
    end if;
  end if;

  delete from public.grupo_tentativas_acesso where grupo_id=p_grupo_id and user_id=auth.uid();
  insert into public.grupo_membros(grupo_id,user_id,papel)
  values(p_grupo_id,auth.uid(),'membro') on conflict do nothing;
  update public.grupo_convites set usado_em=now() where id=convite_id;
  return 'entrou';
end;
$$;

revoke all on function public.detalhar_convites_mensagens(uuid[]),public.entrar_grupo(uuid,text) from public,anon;
grant execute on function public.detalhar_convites_mensagens(uuid[]),public.entrar_grupo(uuid,text) to authenticated;

commit;
