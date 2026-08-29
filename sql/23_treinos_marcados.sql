-- VIVECI — BLOCO 23: treinos marcados nas conversas e guildas
-- Aplicar depois de 22_mensagens.sql. Seguro para executar novamente.

create table if not exists public.treinos_marcados (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users(id) on delete cascade,
  conversa_id uuid references public.conversas(id) on delete cascade,
  grupo_id uuid references public.grupos_sociais(id) on delete cascade,
  local text not null check (char_length(local) between 2 and 120),
  data_hora timestamptz not null,
  criada_em timestamptz not null default now(),
  check ((conversa_id is not null)::integer + (grupo_id is not null)::integer = 1)
);

create table if not exists public.treino_marcado_participantes (
  treino_marcado_id uuid not null references public.treinos_marcados(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  primary key (treino_marcado_id, user_id)
);

alter table public.mensagens add column if not exists treino_marcado_id uuid references public.treinos_marcados(id) on delete set null;
create index if not exists treinos_marcados_grupo_idx on public.treinos_marcados(grupo_id, data_hora);
create index if not exists treinos_marcados_conversa_idx on public.treinos_marcados(conversa_id, data_hora);

alter table public.treinos_marcados enable row level security;
alter table public.treino_marcado_participantes enable row level security;
revoke all on public.treinos_marcados, public.treino_marcado_participantes from public, anon, authenticated;

drop policy if exists "participantes veem treinos marcados" on public.treinos_marcados;
create policy "participantes veem treinos marcados" on public.treinos_marcados for select to authenticated using (
  (conversa_id is not null and exists(select 1 from public.conversas c where c.id=conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)))
  or (grupo_id is not null and exists(select 1 from public.grupo_membros gm where gm.grupo_id=treinos_marcados.grupo_id and gm.user_id=auth.uid()))
);

drop policy if exists "participantes veem confirmacoes" on public.treino_marcado_participantes;
create policy "participantes veem confirmacoes" on public.treino_marcado_participantes for select to authenticated using (
  exists(
    select 1 from public.treinos_marcados tm
    where tm.id=treino_marcado_id and (
      (tm.conversa_id is not null and exists(select 1 from public.conversas c where c.id=tm.conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)))
      or (tm.grupo_id is not null and exists(select 1 from public.grupo_membros gm where gm.grupo_id=tm.grupo_id and gm.user_id=auth.uid()))
    )
  )
);

create or replace function public.marcar_treino(p_conversa_id uuid, p_grupo_id uuid, p_local text, p_data_hora timestamptz)
returns bigint language plpgsql security definer set search_path=public as $$
declare local_limpo text := trim(p_local); treino uuid; mensagem bigint;
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if char_length(local_limpo) not between 2 and 120 then raise exception 'Local inválido.' using errcode='22023'; end if;
  if p_data_hora<=now() or p_data_hora>now()+interval '366 days' then raise exception 'Data e horário inválidos.' using errcode='22023'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas where id=p_conversa_id and auth.uid() in(usuario_a,usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if (select count(*) from public.treinos_marcados where criador_id=auth.uid() and criada_em>now()-interval '1 minute')>=5 then raise exception 'Aguarde antes de marcar outro treino.' using errcode='42900'; end if;

  insert into public.treinos_marcados(criador_id,conversa_id,grupo_id,local,data_hora)
  values(auth.uid(),p_conversa_id,p_grupo_id,local_limpo,p_data_hora) returning id into treino;
  insert into public.treino_marcado_participantes(treino_marcado_id,user_id) values(treino,auth.uid());
  insert into public.mensagens(remetente_id,conversa_id,grupo_id,texto,treino_marcado_id)
  values(auth.uid(),p_conversa_id,p_grupo_id,'Treino marcado',treino) returning id into mensagem;
  if p_conversa_id is not null then update public.conversas set atualizada_em=now() where id=p_conversa_id; end if;
  return mensagem;
end;
$$;

create or replace function public.participar_treino_marcado(p_treino_marcado_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare treino public.treinos_marcados;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  select * into treino from public.treinos_marcados where id=p_treino_marcado_id;
  if treino.id is null or treino.data_hora<=now() then raise exception 'Treino indisponível.' using errcode='22023'; end if;
  if treino.conversa_id is not null and not exists(select 1 from public.conversas where id=treino.conversa_id and auth.uid() in(usuario_a,usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if treino.grupo_id is not null and not exists(select 1 from public.grupo_membros where grupo_id=treino.grupo_id and user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  insert into public.treino_marcado_participantes(treino_marcado_id,user_id) values(treino.id,auth.uid()) on conflict do nothing;
end;
$$;

drop function if exists public.listar_mensagens(uuid,uuid,bigint);
create function public.listar_mensagens(p_conversa_id uuid default null,p_grupo_id uuid default null,p_antes bigint default null)
returns table (
  id bigint, remetente_id uuid, texto text, treino_id uuid, criada_em timestamptz, nome text, foto_url text,
  convite_id uuid, convite_grupo_id uuid, convite_grupo_nome text, convite_grupo_foto text, convite_ativo boolean,
  treino_marcado_id uuid, treino_marcado_local text, treino_marcado_em timestamptz, treino_marcado_participantes bigint, participando_treino boolean
)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas c where c.id=p_conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros gm where gm.grupo_id=p_grupo_id and gm.user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  return query
  select m.id,m.remetente_id,m.texto,m.treino_id,m.criada_em,coalesce(p.nome,'Atleta VIVECI'),p.foto_url,
    gc.id,gc.grupo_id,g.nome,g.foto_url,(gc.usado_em is null and gc.expira_em>now()),
    tm.id,tm.local,tm.data_hora,count(tp.user_id)::bigint,bool_or(tp.user_id=auth.uid())
  from public.mensagens m
  left join public.perfis p on p.id=m.remetente_id
  left join public.grupo_convites gc on gc.id=m.convite_grupo_id
  left join public.grupos_sociais g on g.id=gc.grupo_id
  left join public.treinos_marcados tm on tm.id=m.treino_marcado_id
  left join public.treino_marcado_participantes tp on tp.treino_marcado_id=tm.id
  where (p_conversa_id is null or m.conversa_id=p_conversa_id) and (p_grupo_id is null or m.grupo_id=p_grupo_id) and (p_antes is null or m.id<p_antes)
  group by m.id,m.remetente_id,m.texto,m.treino_id,m.criada_em,p.nome,p.foto_url,gc.id,gc.grupo_id,g.nome,g.foto_url,gc.usado_em,gc.expira_em,tm.id,tm.local,tm.data_hora
  order by m.id desc limit 40;
end;
$$;

create or replace function public.excluir_mensagem(p_mensagem_id bigint)
returns void language plpgsql security definer set search_path=public as $$
declare treino uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  select treino_marcado_id into treino from public.mensagens where id=p_mensagem_id and remetente_id=auth.uid();
  delete from public.mensagens where id=p_mensagem_id and remetente_id=auth.uid();
  if not found then raise exception 'Mensagem não encontrada ou sem permissão.' using errcode='42501'; end if;
  if treino is not null then delete from public.treinos_marcados where id=treino and criador_id=auth.uid(); end if;
end;
$$;

revoke all on function public.marcar_treino(uuid,uuid,text,timestamptz), public.participar_treino_marcado(uuid), public.listar_mensagens(uuid,uuid,bigint), public.excluir_mensagem(bigint) from public, anon;
grant execute on function public.marcar_treino(uuid,uuid,text,timestamptz), public.participar_treino_marcado(uuid), public.listar_mensagens(uuid,uuid,bigint), public.excluir_mensagem(bigint) to authenticated;
