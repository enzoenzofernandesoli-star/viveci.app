-- VIVECI — BLOCO 21: grupos sociais, cargos, acesso e rank coletivo
-- Aplicar depois de 20_promover_novo_host.sql.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.grupos_sociais (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete restrict,
  nome text not null check (char_length(nome) between 3 and 60),
  descricao text check (descricao is null or char_length(descricao) <= 280),
  foto_url text,
  foto_path text,
  visibilidade text not null check (visibilidade in ('aberto', 'privado')),
  senha_hash text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (visibilidade = 'aberto' or senha_hash is not null)
);

create table if not exists public.grupo_membros (
  grupo_id uuid not null references public.grupos_sociais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('dono', 'admin', 'membro')),
  entrou_em timestamptz not null default now(),
  primary key (grupo_id, user_id)
);

create table if not exists public.grupo_convites (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos_sociais(id) on delete cascade,
  convidado_id uuid not null references auth.users(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete cascade,
  expira_em timestamptz not null default (now() + interval '7 days'),
  usado_em timestamptz,
  unique (grupo_id, convidado_id)
);

create table if not exists public.grupo_tentativas_acesso (
  grupo_id uuid not null references public.grupos_sociais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tentativas integer not null default 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (grupo_id, user_id)
);

create index if not exists grupos_sociais_nome_idx on public.grupos_sociais using gin (nome extensions.gin_trgm_ops);
create index if not exists grupo_membros_user_idx on public.grupo_membros (user_id, entrou_em desc);
create index if not exists grupo_convites_convidado_idx on public.grupo_convites (convidado_id, expira_em desc);

alter table public.grupos_sociais enable row level security;
alter table public.grupo_membros enable row level security;
alter table public.grupo_convites enable row level security;
alter table public.grupo_tentativas_acesso enable row level security;
revoke all on public.grupos_sociais, public.grupo_membros, public.grupo_convites, public.grupo_tentativas_acesso from public, anon, authenticated;

create or replace function public.papel_no_grupo(p_grupo_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select papel from public.grupo_membros where grupo_id = p_grupo_id and user_id = auth.uid();
$$;

create or replace function public.criar_grupo(p_nome text, p_descricao text, p_visibilidade text, p_senha text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare novo_id uuid; nome_limpo text := trim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode = '42501'; end if;
  if char_length(nome_limpo) not between 3 and 60 then raise exception 'Nome inválido.' using errcode = '22023'; end if;
  if p_visibilidade not in ('aberto', 'privado') then raise exception 'Visibilidade inválida.' using errcode = '22023'; end if;
  if p_visibilidade = 'privado' and char_length(coalesce(p_senha, '')) not between 6 and 72 then raise exception 'Senha inválida.' using errcode = '22023'; end if;

  insert into public.grupos_sociais (dono_id, nome, descricao, visibilidade, senha_hash)
  values (auth.uid(), nome_limpo, left(nullif(trim(p_descricao), ''), 280), p_visibilidade,
    case when p_visibilidade = 'privado' then crypt(p_senha, gen_salt('bf', 12)) else null end)
  returning id into novo_id;
  insert into public.grupo_membros (grupo_id, user_id, papel) values (novo_id, auth.uid(), 'dono');
  return novo_id;
end; $$;

create or replace function public.pesquisar_grupos(p_busca text default '')
returns table (id uuid, nome text, descricao text, foto_url text, visibilidade text, total_membros bigint, sou_membro boolean, meu_papel text)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome, g.descricao, g.foto_url, g.visibilidade,
    count(gm.user_id), bool_or(gm.user_id = auth.uid()),
    max(gm.papel) filter (where gm.user_id = auth.uid())
  from public.grupos_sociais g
  left join public.grupo_membros gm on gm.grupo_id = g.id
  where auth.uid() is not null
    and (trim(coalesce(p_busca, '')) = '' or g.nome ilike '%' || replace(replace(left(trim(p_busca), 60), '%', ''), '_', '') || '%')
  group by g.id
  order by bool_or(gm.user_id = auth.uid()) desc, count(gm.user_id) desc, g.nome
  limit 50;
$$;

create or replace function public.obter_grupo(p_grupo_id uuid)
returns table (id uuid, nome text, descricao text, foto_url text, visibilidade text, total_membros bigint, sou_membro boolean, meu_papel text)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome, g.descricao, g.foto_url, g.visibilidade,
    count(gm.user_id), bool_or(gm.user_id = auth.uid()),
    max(gm.papel) filter (where gm.user_id = auth.uid())
  from public.grupos_sociais g left join public.grupo_membros gm on gm.grupo_id = g.id
  where auth.uid() is not null and g.id = p_grupo_id group by g.id;
$$;

create or replace function public.entrar_grupo(p_grupo_id uuid, p_senha text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare grupo public.grupos_sociais; convite_valido boolean; tentativa public.grupo_tentativas_acesso;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode = '42501'; end if;
  select * into grupo from public.grupos_sociais where id = p_grupo_id;
  if grupo.id is null then raise exception 'Grupo não encontrado.' using errcode = '22023'; end if;
  if exists (select 1 from public.grupo_membros where grupo_id = p_grupo_id and user_id = auth.uid()) then return 'entrou'; end if;
  select exists(select 1 from public.grupo_convites where grupo_id = p_grupo_id and convidado_id = auth.uid() and usado_em is null and expira_em > now()) into convite_valido;
  if grupo.visibilidade = 'privado' and not convite_valido then
    select * into tentativa from public.grupo_tentativas_acesso where grupo_id = p_grupo_id and user_id = auth.uid();
    if tentativa.bloqueado_ate > now() then return 'bloqueado'; end if;
    if p_senha is null or crypt(p_senha, grupo.senha_hash) <> grupo.senha_hash then
      insert into public.grupo_tentativas_acesso (grupo_id, user_id, tentativas, bloqueado_ate, atualizado_em)
      values (p_grupo_id, auth.uid(), 1, null, now())
      on conflict (grupo_id, user_id) do update set
        tentativas = case when grupo_tentativas_acesso.bloqueado_ate <= now() then 1 else grupo_tentativas_acesso.tentativas + 1 end,
        bloqueado_ate = case when (case when grupo_tentativas_acesso.bloqueado_ate <= now() then 1 else grupo_tentativas_acesso.tentativas + 1 end) >= 5 then now() + interval '15 minutes' else null end,
        atualizado_em = now();
      return 'senha_incorreta';
    end if;
  end if;
  delete from public.grupo_tentativas_acesso where grupo_id = p_grupo_id and user_id = auth.uid();
  insert into public.grupo_membros (grupo_id, user_id, papel) values (p_grupo_id, auth.uid(), 'membro');
  update public.grupo_convites set usado_em = now() where grupo_id = p_grupo_id and convidado_id = auth.uid() and usado_em is null;
  return 'entrou';
end; $$;

create or replace function public.editar_grupo(p_grupo_id uuid, p_nome text, p_descricao text, p_visibilidade text, p_nova_senha text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare papel_atual text := public.papel_no_grupo(p_grupo_id); nome_limpo text := trim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
begin
  if papel_atual not in ('dono', 'admin') then raise exception 'Apenas administradores podem editar o grupo.' using errcode = '42501'; end if;
  if char_length(nome_limpo) not between 3 and 60 or p_visibilidade not in ('aberto', 'privado') then raise exception 'Dados inválidos.' using errcode = '22023'; end if;
  if p_nova_senha is not null and char_length(p_nova_senha) not between 6 and 72 then raise exception 'Senha inválida.' using errcode = '22023'; end if;
  if p_visibilidade = 'privado' and p_nova_senha is null and not exists(select 1 from public.grupos_sociais where id = p_grupo_id and senha_hash is not null) then raise exception 'Defina uma senha.' using errcode = '22023'; end if;
  update public.grupos_sociais set nome = nome_limpo, descricao = left(nullif(trim(p_descricao), ''), 280), visibilidade = p_visibilidade,
    senha_hash = case when p_visibilidade = 'aberto' then null when p_nova_senha is not null then crypt(p_nova_senha, gen_salt('bf', 12)) else senha_hash end,
    atualizado_em = now() where id = p_grupo_id;
end; $$;

create or replace function public.atualizar_foto_grupo(p_grupo_id uuid, p_foto_url text, p_foto_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_no_grupo(p_grupo_id) not in ('dono', 'admin') then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_foto_path not like auth.uid()::text || '/grupos/' || p_grupo_id::text || '.%' then raise exception 'Caminho inválido.' using errcode = '22023'; end if;
  update public.grupos_sociais set foto_url = left(p_foto_url, 1000), foto_path = left(p_foto_path, 500), atualizado_em = now() where id = p_grupo_id;
end; $$;

create or replace function public.membros_e_rank_grupo(p_grupo_id uuid)
returns table (user_id uuid, nome text, foto_url text, papel text, media_semanal integer)
language sql stable security definer set search_path = public as $$
  with membros as (
    select gm.user_id, gm.papel from public.grupo_membros gm
    where gm.grupo_id = p_grupo_id and public.papel_no_grupo(p_grupo_id) is not null
  ), volumes as (
    select r.user_id, e.grupo_muscular as grupo, sum((r.peso_kg * r.reps) * case when e.is_composto and cardinality(e.grupos_secundarios) > 0 then .7 else 1 end) as volume
    from public.registros r join public.exercicios e on e.id = r.exercicio_id join membros m on m.user_id = r.user_id
    where r.data >= current_date - 6 group by r.user_id, e.grupo_muscular
    union all
    select r.user_id, secundario, sum((r.peso_kg * r.reps) * .3 / cardinality(e.grupos_secundarios))
    from public.registros r join public.exercicios e on e.id = r.exercicio_id join membros m on m.user_id = r.user_id
    cross join lateral unnest(e.grupos_secundarios) secundario
    where r.data >= current_date - 6 and e.is_composto and cardinality(e.grupos_secundarios) > 0 group by r.user_id, secundario
  ), somados as (select user_id, grupo, sum(volume) volume from volumes group by user_id, grupo),
  maximos as (select user_id, max(volume) maior from somados group by user_id),
  medias as (select m.user_id, coalesce(round(sum(round(100 * s.volume / nullif(mx.maior, 0))) / 10.0), 0)::integer media from membros m left join somados s on s.user_id=m.user_id left join maximos mx on mx.user_id=m.user_id group by m.user_id)
  select m.user_id, p.nome, p.foto_url, m.papel, md.media from membros m join public.perfis p on p.id=m.user_id join medias md on md.user_id=m.user_id
  order by case m.papel when 'dono' then 0 when 'admin' then 1 else 2 end, md.media desc, p.nome;
$$;

create or replace function public.alterar_papel_grupo(p_grupo_id uuid, p_user_id uuid, p_papel text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_no_grupo(p_grupo_id) <> 'dono' then raise exception 'Apenas o dono pode alterar administradores.' using errcode='42501'; end if;
  if p_papel not in ('admin','membro') or p_user_id = auth.uid() then raise exception 'Alteração inválida.' using errcode='22023'; end if;
  update public.grupo_membros set papel=p_papel where grupo_id=p_grupo_id and user_id=p_user_id and papel <> 'dono';
end; $$;

create or replace function public.remover_membro_grupo(p_grupo_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare meu_papel text:=public.papel_no_grupo(p_grupo_id); papel_alvo text;
begin
  select papel into papel_alvo from public.grupo_membros where grupo_id=p_grupo_id and user_id=p_user_id;
  if p_user_id=auth.uid() and papel_alvo <> 'dono' then delete from public.grupo_membros where grupo_id=p_grupo_id and user_id=p_user_id; return; end if;
  if meu_papel not in ('dono','admin') or papel_alvo='dono' or (meu_papel='admin' and papel_alvo='admin') then raise exception 'Sem permissão.' using errcode='42501'; end if;
  delete from public.grupo_membros where grupo_id=p_grupo_id and user_id=p_user_id;
end; $$;

create or replace function public.convidar_para_grupo(p_grupo_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_no_grupo(p_grupo_id) not in ('dono','admin') then raise exception 'Apenas administradores podem convidar.' using errcode='42501'; end if;
  if p_user_id=auth.uid() or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'Usuário inválido.' using errcode='22023'; end if;
  if exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=p_user_id) then raise exception 'Essa pessoa já participa do grupo.' using errcode='23505'; end if;
  insert into public.grupo_convites(grupo_id, convidado_id, criado_por) values(p_grupo_id,p_user_id,auth.uid())
  on conflict(grupo_id,convidado_id) do update set criado_por=excluded.criado_por, expira_em=now()+interval '7 days', usado_em=null;
end; $$;

revoke all on function public.papel_no_grupo(uuid), public.criar_grupo(text,text,text,text), public.pesquisar_grupos(text), public.obter_grupo(uuid), public.entrar_grupo(uuid,text), public.editar_grupo(uuid,text,text,text,text), public.atualizar_foto_grupo(uuid,text,text), public.membros_e_rank_grupo(uuid), public.alterar_papel_grupo(uuid,uuid,text), public.remover_membro_grupo(uuid,uuid), public.convidar_para_grupo(uuid,uuid) from public, anon;
grant execute on function public.papel_no_grupo(uuid), public.criar_grupo(text,text,text,text), public.pesquisar_grupos(text), public.obter_grupo(uuid), public.entrar_grupo(uuid,text), public.editar_grupo(uuid,text,text,text,text), public.atualizar_foto_grupo(uuid,text,text), public.membros_e_rank_grupo(uuid), public.alterar_papel_grupo(uuid,uuid,text), public.remover_membro_grupo(uuid,uuid), public.convidar_para_grupo(uuid,uuid) to authenticated;

drop policy if exists "grupo envia foto" on storage.objects;
create policy "grupo envia foto" on storage.objects for insert to authenticated with check (bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2]='grupos');
drop policy if exists "grupo atualiza foto" on storage.objects;
create policy "grupo atualiza foto" on storage.objects for update to authenticated using (bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2]='grupos');
