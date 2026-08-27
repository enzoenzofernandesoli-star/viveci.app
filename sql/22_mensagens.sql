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

create table if not exists public.mensagens_leituras (
  user_id uuid not null references auth.users(id) on delete cascade,
  destino_tipo text not null check (destino_tipo in ('conversa','grupo')),
  destino_id uuid not null,
  ultima_mensagem_id bigint not null default 0,
  atualizada_em timestamptz not null default now(),
  primary key (user_id, destino_tipo, destino_id)
);

alter table public.mensagens add column if not exists convite_grupo_id uuid references public.grupo_convites(id) on delete set null;

create table if not exists public.grupo_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos_sociais(id) on delete cascade,
  solicitante_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','aceita','recusada')),
  criada_em timestamptz not null default now(),
  respondida_em timestamptz,
  respondida_por uuid references auth.users(id) on delete set null,
  unique (grupo_id, solicitante_id)
);

alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.mensagens_leituras enable row level security;
alter table public.grupo_solicitacoes enable row level security;
revoke all on public.conversas, public.mensagens, public.mensagens_leituras, public.grupo_solicitacoes from public, anon, authenticated;

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
end;
$$;

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
end;
$$;

grant select on public.conversas, public.mensagens to authenticated;
grant execute on function public.abrir_conversa(uuid), public.enviar_mensagem(uuid,uuid,text,uuid) to authenticated;

create or replace function public.recusar_convite_grupo(p_convite_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  delete from public.grupo_convites where id=p_convite_id and convidado_id=auth.uid() and usado_em is null;
end;
$$;

grant execute on function public.recusar_convite_grupo(uuid) to authenticated;

drop function if exists public.listar_mensagens(uuid,uuid,bigint);
create function public.listar_mensagens(
  p_conversa_id uuid default null,
  p_grupo_id uuid default null,
  p_antes bigint default null
)
returns table (
  id bigint, remetente_id uuid, texto text, treino_id uuid,
  criada_em timestamptz, nome text, foto_url text,
  convite_id uuid, convite_grupo_id uuid, convite_grupo_nome text, convite_grupo_foto text, convite_ativo boolean
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
    coalesce(p.nome,'Atleta VIVECI'), p.foto_url, gc.id, gc.grupo_id, g.nome, g.foto_url,
    (gc.usado_em is null and gc.expira_em>now())
  from public.mensagens m
  left join public.perfis p on p.id=m.remetente_id
  left join public.grupo_convites gc on gc.id=m.convite_grupo_id
  left join public.grupos_sociais g on g.id=gc.grupo_id
  where (p_conversa_id is null or m.conversa_id=p_conversa_id)
    and (p_grupo_id is null or m.grupo_id=p_grupo_id)
    and (p_antes is null or m.id<p_antes)
  order by m.id desc limit 40;
end;
$$;

revoke all on function public.listar_mensagens(uuid,uuid,bigint) from public, anon;
grant execute on function public.listar_mensagens(uuid,uuid,bigint) to authenticated;

create or replace function public.excluir_mensagem(p_mensagem_id bigint)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  delete from public.mensagens where id=p_mensagem_id and remetente_id=auth.uid();
  if not found then raise exception 'Mensagem não encontrada ou sem permissão.' using errcode='42501'; end if;
end;
$$;

revoke all on function public.excluir_mensagem(bigint) from public, anon;
grant execute on function public.excluir_mensagem(bigint) to authenticated;

create or replace function public.marcar_mensagens_lidas(p_conversa_id uuid default null, p_grupo_id uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare tipo text; destino uuid; ultima bigint;
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

  tipo := case when p_conversa_id is not null then 'conversa' else 'grupo' end;
  destino := coalesce(p_conversa_id,p_grupo_id);
  select coalesce(max(m.id),0) into ultima from public.mensagens m
  where m.conversa_id=p_conversa_id or m.grupo_id=p_grupo_id;
  insert into public.mensagens_leituras(user_id,destino_tipo,destino_id,ultima_mensagem_id)
  values(auth.uid(),tipo,destino,ultima)
  on conflict(user_id,destino_tipo,destino_id) do update
    set ultima_mensagem_id=greatest(mensagens_leituras.ultima_mensagem_id,excluded.ultima_mensagem_id), atualizada_em=now();
end;
$$;

create or replace function public.listar_mensagens_nao_lidas()
returns table (destino_tipo text, destino_id uuid, quantidade bigint)
language sql stable security definer set search_path=public as $$
  with destinos as (
    select 'conversa'::text tipo, c.id destino
    from public.conversas c where auth.uid() in(c.usuario_a,c.usuario_b)
    union all
    select 'grupo'::text, gm.grupo_id
    from public.grupo_membros gm where gm.user_id=auth.uid()
  )
  select d.tipo, d.destino, count(m.id)::bigint
  from destinos d
  join public.mensagens m on
    (d.tipo='conversa' and m.conversa_id=d.destino) or
    (d.tipo='grupo' and m.grupo_id=d.destino)
  left join public.mensagens_leituras l on l.user_id=auth.uid() and l.destino_tipo=d.tipo and l.destino_id=d.destino
  where m.remetente_id<>auth.uid() and m.id>coalesce(l.ultima_mensagem_id,0)
  group by d.tipo,d.destino;
$$;

revoke all on function public.marcar_mensagens_lidas(uuid,uuid), public.listar_mensagens_nao_lidas() from public, anon;
grant execute on function public.marcar_mensagens_lidas(uuid,uuid), public.listar_mensagens_nao_lidas() to authenticated;

create or replace function public.convidar_para_grupo(p_grupo_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare convite uuid; conversa uuid; a uuid; b uuid; nome_grupo text;
begin
  if public.papel_no_grupo(p_grupo_id) not in ('dono','admin') then raise exception 'Apenas administradores podem convidar.' using errcode='42501'; end if;
  if p_user_id=auth.uid() or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'Usuário inválido.' using errcode='22023'; end if;
  if exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=p_user_id) then raise exception 'Essa pessoa já participa do grupo.' using errcode='23505'; end if;
  select nome into nome_grupo from public.grupos_sociais where id=p_grupo_id;
  insert into public.grupo_convites(grupo_id,convidado_id,criado_por) values(p_grupo_id,p_user_id,auth.uid())
  on conflict(grupo_id,convidado_id) do update set criado_por=excluded.criado_por,expira_em=now()+interval '7 days',usado_em=null
  returning id into convite;
  a:=least(auth.uid(),p_user_id); b:=greatest(auth.uid(),p_user_id);
  insert into public.conversas(usuario_a,usuario_b) values(a,b)
  on conflict(usuario_a,usuario_b) do update set atualizada_em=now() returning id into conversa;
  insert into public.mensagens(remetente_id,conversa_id,texto,convite_grupo_id)
  values(auth.uid(),conversa,'Convite para a guilda '||nome_grupo,convite);
end;
$$;

create or replace function public.solicitar_entrada_grupo(p_grupo_id uuid,p_senha text default null)
returns text language plpgsql security definer set search_path=public,extensions as $$
declare grupo public.grupos_sociais;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  select * into grupo from public.grupos_sociais where id=p_grupo_id;
  if grupo.id is null then raise exception 'Grupo não encontrado.' using errcode='22023'; end if;
  if exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then return 'membro'; end if;
  if grupo.visibilidade='privado' and (p_senha is null or crypt(p_senha,grupo.senha_hash)<>grupo.senha_hash) then return 'senha_incorreta'; end if;
  insert into public.grupo_solicitacoes(grupo_id,solicitante_id,status,criada_em,respondida_em,respondida_por)
  values(p_grupo_id,auth.uid(),'pendente',now(),null,null)
  on conflict(grupo_id,solicitante_id) do update set status='pendente',criada_em=now(),respondida_em=null,respondida_por=null;
  return 'pendente';
end;
$$;

create or replace function public.listar_solicitacoes_grupo(p_grupo_id uuid)
returns table(id uuid,user_id uuid,nome text,foto_url text,criada_em timestamptz)
language sql stable security definer set search_path=public as $$
  select s.id,s.solicitante_id,coalesce(p.nome,'Atleta VIVECI'),p.foto_url,s.criada_em
  from public.grupo_solicitacoes s left join public.perfis p on p.id=s.solicitante_id
  where s.grupo_id=p_grupo_id and s.status='pendente' and public.papel_no_grupo(p_grupo_id) in('dono','admin')
  order by s.criada_em;
$$;

create or replace function public.responder_solicitacao_grupo(p_solicitacao_id uuid,p_aceitar boolean)
returns void language plpgsql security definer set search_path=public as $$
declare solicitacao public.grupo_solicitacoes;
begin
  select * into solicitacao from public.grupo_solicitacoes where id=p_solicitacao_id and status='pendente' for update;
  if solicitacao.id is null or public.papel_no_grupo(solicitacao.grupo_id) not in('dono','admin') then raise exception 'Sem permissão.' using errcode='42501'; end if;
  if p_aceitar then insert into public.grupo_membros(grupo_id,user_id,papel) values(solicitacao.grupo_id,solicitacao.solicitante_id,'membro') on conflict do nothing; end if;
  update public.grupo_solicitacoes set status=case when p_aceitar then 'aceita' else 'recusada' end,respondida_em=now(),respondida_por=auth.uid() where id=p_solicitacao_id;
end;
$$;

create or replace function public.entrar_grupo(p_grupo_id uuid,p_senha text default null)
returns text language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  if exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then return 'entrou'; end if;
  if not exists(select 1 from public.grupo_convites where grupo_id=p_grupo_id and convidado_id=auth.uid() and usado_em is null and expira_em>now()) then return 'aprovacao_necessaria'; end if;
  insert into public.grupo_membros(grupo_id,user_id,papel) values(p_grupo_id,auth.uid(),'membro');
  update public.grupo_convites set usado_em=now() where grupo_id=p_grupo_id and convidado_id=auth.uid() and usado_em is null;
  return 'entrou';
end;
$$;

revoke all on function public.convidar_para_grupo(uuid,uuid), public.solicitar_entrada_grupo(uuid,text), public.listar_solicitacoes_grupo(uuid), public.responder_solicitacao_grupo(uuid,boolean), public.entrar_grupo(uuid,text) from public,anon;
grant execute on function public.convidar_para_grupo(uuid,uuid), public.solicitar_entrada_grupo(uuid,text), public.listar_solicitacoes_grupo(uuid), public.responder_solicitacao_grupo(uuid,boolean), public.entrar_grupo(uuid,text) to authenticated;
