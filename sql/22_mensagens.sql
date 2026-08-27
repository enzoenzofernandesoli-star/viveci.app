-- VIVECI — BLOCO 22: mensagens privadas e chat dos grupos
-- Aplicar depois de 21_grupos_sociais.sql.

create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  usuario_a uuid not null references auth.users(id) on delete cascade,
  usuario_b uuid not null references auth.users(id) on delete cascade,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  check (usuario_a < usuario_b), unique (usuario_a, usuario_b)
);

create table if not exists public.mensagens (
  id bigint generated always as identity primary key,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  conversa_id uuid references public.conversas(id) on delete cascade,
  grupo_id uuid references public.grupos_sociais(id) on delete cascade,
  texto text check (texto is null or char_length(texto) between 1 and 1000),
  treino_id uuid references public.sessoes_concluidas(id) on delete set null,
  criada_em timestamptz not null default now(),
  check ((conversa_id is not null)::integer + (grupo_id is not null)::integer = 1),
  check (texto is not null or treino_id is not null)
);

create index if not exists mensagens_conversa_cursor_idx on public.mensagens (conversa_id, id desc) where conversa_id is not null;
create index if not exists mensagens_grupo_cursor_idx on public.mensagens (grupo_id, id desc) where grupo_id is not null;
create index if not exists conversas_a_atualizada_idx on public.conversas (usuario_a, atualizada_em desc);
create index if not exists conversas_b_atualizada_idx on public.conversas (usuario_b, atualizada_em desc);

alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
revoke all on public.conversas, public.mensagens from public, anon, authenticated;

drop policy if exists "participantes leem conversa" on public.conversas;
create policy "participantes leem conversa" on public.conversas for select to authenticated using (auth.uid() in (usuario_a, usuario_b));
drop policy if exists "participantes leem mensagens privadas" on public.mensagens;
create policy "participantes leem mensagens privadas" on public.mensagens for select to authenticated using (
  conversa_id is not null and exists(select 1 from public.conversas c where c.id=conversa_id and auth.uid() in (c.usuario_a,c.usuario_b))
);
drop policy if exists "membros leem mensagens do grupo" on public.mensagens;
create policy "membros leem mensagens do grupo" on public.mensagens for select to authenticated using (
  grupo_id is not null and exists(select 1 from public.grupo_membros gm where gm.grupo_id=mensagens.grupo_id and gm.user_id=auth.uid())
);

create or replace function public.abrir_conversa(p_usuario_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare a uuid := least(auth.uid(), p_usuario_id); b uuid := greatest(auth.uid(), p_usuario_id); resultado uuid;
begin
  if auth.uid() is null or p_usuario_id is null or p_usuario_id=auth.uid() then raise exception 'Conversa inválida.' using errcode='22023'; end if;
  insert into public.conversas(usuario_a,usuario_b) values(a,b) on conflict(usuario_a,usuario_b) do update set atualizada_em=conversas.atualizada_em returning id into resultado;
  return resultado;
end $$;

create or replace function public.enviar_mensagem(p_conversa_id uuid, p_grupo_id uuid, p_texto text default null, p_treino_id uuid default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare texto_limpo text := nullif(trim(p_texto),''); nova_id bigint;
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if texto_limpo is null and p_treino_id is null then raise exception 'Mensagem vazia.' using errcode='22023'; end if;
  if char_length(texto_limpo)>1000 then raise exception 'Mensagem muito longa.' using errcode='22023'; end if;
  if (select count(*) from public.mensagens where remetente_id=auth.uid() and criada_em>now()-interval '1 minute')>=30 then raise exception 'Aguarde antes de enviar mais mensagens.' using errcode='42900'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas where id=p_conversa_id and auth.uid() in(usuario_a,usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_treino_id is not null and not exists(select 1 from public.sessoes_concluidas where id=p_treino_id and user_id=auth.uid() and finalizada_em is not null) then raise exception 'Treino inválido.' using errcode='42501'; end if;
  insert into public.mensagens(remetente_id,conversa_id,grupo_id,texto,treino_id) values(auth.uid(),p_conversa_id,p_grupo_id,texto_limpo,p_treino_id) returning id into nova_id;
  if p_conversa_id is not null then update public.conversas set atualizada_em=now() where id=p_conversa_id; end if;
  return nova_id;
end $$;

grant select on public.conversas, public.mensagens to authenticated;
grant execute on function public.abrir_conversa(uuid), public.enviar_mensagem(uuid,uuid,text,uuid) to authenticated;

create or replace function public.listar_convites_grupo()
returns table (convite_id uuid, grupo_id uuid, nome text, foto_url text, convidado_por text, expira_em timestamptz)
language sql stable security definer set search_path=public as $$
  select gc.id, g.id, g.nome, g.foto_url, coalesce(p.nome,'Administrador'), gc.expira_em
  from public.grupo_convites gc
  join public.grupos_sociais g on g.id=gc.grupo_id
  left join public.perfis p on p.id=gc.criado_por
  where gc.convidado_id=auth.uid() and gc.usado_em is null and gc.expira_em>now()
    and not exists(select 1 from public.grupo_membros gm where gm.grupo_id=gc.grupo_id and gm.user_id=auth.uid())
  order by gc.expira_em asc limit 30;
$$;

create or replace function public.recusar_convite_grupo(p_convite_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  delete from public.grupo_convites where id=p_convite_id and convidado_id=auth.uid() and usado_em is null;
end $$;

grant execute on function public.listar_convites_grupo(), public.recusar_convite_grupo(uuid) to authenticated;

create or replace function public.listar_mensagens(
  p_conversa_id uuid default null,
  p_grupo_id uuid default null,
  p_antes bigint default null
)
returns table (
  id bigint, remetente_id uuid, texto text, treino_id uuid,
  criada_em timestamptz, nome text, foto_url text
)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then
    raise exception 'Destino inválido.' using errcode='22023';
  end if;
  if p_conversa_id is not null and not exists(
    select 1 from public.conversas c where c.id=p_conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)
  ) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(
    select 1 from public.grupo_membros gm where gm.grupo_id=p_grupo_id and gm.user_id=auth.uid()
  ) then raise exception 'Sem acesso.' using errcode='42501'; end if;

  return query
  select m.id, m.remetente_id, m.texto, m.treino_id, m.criada_em,
    coalesce(p.nome,'Atleta VIVECI'), p.foto_url
  from public.mensagens m
  left join public.perfis p on p.id=m.remetente_id
  where (p_conversa_id is null or m.conversa_id=p_conversa_id)
    and (p_grupo_id is null or m.grupo_id=p_grupo_id)
    and (p_antes is null or m.id<p_antes)
  order by m.id desc limit 40;
end $$;

revoke all on function public.listar_mensagens(uuid,uuid,bigint) from public, anon;
grant execute on function public.listar_mensagens(uuid,uuid,bigint) to authenticated;

create or replace function public.excluir_mensagem(p_mensagem_id bigint)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  delete from public.mensagens where id=p_mensagem_id and remetente_id=auth.uid();
  if not found then raise exception 'Mensagem não encontrada ou sem permissão.' using errcode='42501'; end if;
end $$;

revoke all on function public.excluir_mensagem(bigint) from public, anon;
grant execute on function public.excluir_mensagem(bigint) to authenticated;
