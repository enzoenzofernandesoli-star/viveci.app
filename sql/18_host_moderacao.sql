-- VIVECI — BLOCO 18: host e moderação segura
-- Aplicar depois de 17_social_treino_compartilhado.sql.

create table if not exists public.papeis_aplicativo (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('host')),
  criado_em timestamptz not null default now()
);

create table if not exists public.usuarios_banidos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  motivo text not null,
  banido_por uuid not null references auth.users(id),
  banido_em timestamptz not null default now()
);

create table if not exists public.auditoria_moderacao (
  id bigint generated always as identity primary key,
  host_id uuid not null references auth.users(id),
  acao text not null check (acao in ('excluir_post', 'banir_usuario')),
  alvo_usuario_id uuid references auth.users(id),
  alvo_post_id uuid,
  motivo text,
  criado_em timestamptz not null default now()
);

alter table public.papeis_aplicativo enable row level security;
alter table public.usuarios_banidos enable row level security;
alter table public.auditoria_moderacao enable row level security;

revoke all on public.papeis_aplicativo, public.usuarios_banidos, public.auditoria_moderacao from public, anon, authenticated;

-- Vincula o papel ao UUID atual da conta. Trocar o e-mail depois não transfere
-- o poder de host para outra conta.
do $$
declare host_id uuid;
begin
  select id into host_id
  from auth.users
  where lower(email) = lower('enzo.enzofernandesoli@gmail.com');

  if host_id is null then
    raise exception 'Conta host não encontrada. Confirme o e-mail antes de aplicar a migration.';
  end if;

  insert into public.papeis_aplicativo (user_id, papel)
  values (host_id, 'host')
  on conflict (user_id) do update set papel = excluded.papel;
end;
$$;

create or replace function public.sou_host()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.papeis_aplicativo
    where user_id = auth.uid() and papel = 'host'
  );
$$;

create or replace function public.minha_conta_esta_banida()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios_banidos where user_id = auth.uid()
  );
$$;

create or replace function public.banir_usuario(p_usuario_id uuid, p_motivo text default 'Violação das regras da comunidade')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare motivo_normalizado text;
begin
  if not public.sou_host() then
    raise exception 'Apenas o host pode banir usuários.' using errcode = '42501';
  end if;
  if p_usuario_id = auth.uid() then
    raise exception 'O host não pode banir a própria conta.' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = p_usuario_id) then
    raise exception 'Usuário não encontrado.' using errcode = '22023';
  end if;

  motivo_normalizado := left(coalesce(nullif(trim(p_motivo), ''), 'Violação das regras da comunidade'), 500);
  insert into public.usuarios_banidos (user_id, motivo, banido_por)
  values (p_usuario_id, motivo_normalizado, auth.uid())
  on conflict (user_id) do update
    set motivo = excluded.motivo, banido_por = excluded.banido_por, banido_em = now();

  update auth.users set banned_until = 'infinity'::timestamptz where id = p_usuario_id;
  delete from auth.sessions where user_id = p_usuario_id;

  insert into public.auditoria_moderacao (host_id, acao, alvo_usuario_id, motivo)
  values (auth.uid(), 'banir_usuario', p_usuario_id, motivo_normalizado);
end;
$$;

-- Mantém a exclusão própria e acrescenta a exclusão administrativa auditada.
create or replace function public.excluir_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare caminho text; autor_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  select user_id into autor_id from public.posts where id = p_post_id;
  if autor_id is null or (autor_id <> auth.uid() and not public.sou_host()) then
    raise exception 'Publicação não encontrada.' using errcode = '42501';
  end if;

  delete from public.posts where id = p_post_id returning foto_path into caminho;

  if autor_id <> auth.uid() then
    insert into public.auditoria_moderacao (host_id, acao, alvo_usuario_id, alvo_post_id)
    values (auth.uid(), 'excluir_post', autor_id, p_post_id);
  end if;
  return caminho;
end;
$$;

-- Usuários banidos deixam de aparecer nos contratos públicos.
-- Mantida aqui também para a migration funcionar em bancos que ainda não
-- receberam o script separado de perfil social/sequência.
create or replace function public.calcular_sequencia_publica(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with dias as (
    select distinct finalizada_em::date as dia
    from public.sessoes_concluidas
    where user_id = p_user_id
      and finalizada_em is not null
      and finalizada_em::date <= current_date
  ), ancora as (
    select case
      when exists (select 1 from dias where dia = current_date) then current_date
      when exists (select 1 from dias where dia = current_date - 1) then current_date - 1
      else null
    end as dia
  ), ordenados as (
    select d.dia, row_number() over (order by d.dia desc) as posicao
    from dias d cross join ancora a
    where a.dia is not null and d.dia <= a.dia
  )
  select coalesce(count(*) filter (
    where o.dia = a.dia - ((o.posicao - 1)::integer)
  ), 0)::integer
  from ordenados o cross join ancora a;
$$;

create or replace view public.posts_publicos
with (security_barrier = true)
as
select
  p.id, p.user_id, p.legenda, p.foto_url,
  (p.sessao_concluida_id is not null) as tem_treino,
  p.treino_nome,
  case when p.mostrar_duracao then p.treino_duracao_seg else null end as treino_duracao_seg,
  case when p.mostrar_series then p.treino_series else null end as treino_series,
  case when p.mostrar_volume then p.treino_volume_kg else null end as treino_volume_kg,
  p.mostrar_duracao, p.mostrar_series, p.mostrar_volume, p.criado_em,
  p.treino_exercicios
from public.posts p
where auth.role() = 'authenticated'
  and not exists (select 1 from public.usuarios_banidos ub where ub.user_id = p.user_id)
  and not exists (
    select 1 from public.usuarios_bloqueados b
    where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.user_id)
       or (b.bloqueador_id = p.user_id and b.bloqueado_id = auth.uid())
  );

create or replace view public.perfis_publicos
with (security_barrier = true)
as
select p.id, p.nome, p.foto_url, p.bio,
  (select count(*)::integer from public.sessoes_concluidas s
    where s.user_id = p.id and s.finalizada_em is not null) as total_treinos,
  public.calcular_sequencia_publica(p.id) as sequencia_atual
from public.perfis p
where not exists (select 1 from public.usuarios_banidos ub where ub.user_id = p.id)
  and not exists (
    select 1 from public.usuarios_bloqueados b
    where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.id)
       or (b.bloqueador_id = p.id and b.bloqueado_id = auth.uid())
  );

revoke all on public.posts_publicos, public.perfis_publicos from public, anon;
grant select on public.posts_publicos, public.perfis_publicos to authenticated;

revoke all on function public.sou_host() from public, anon;
revoke all on function public.minha_conta_esta_banida() from public, anon;
revoke all on function public.banir_usuario(uuid, text) from public, anon;
revoke all on function public.excluir_post(uuid) from public, anon;
revoke all on function public.calcular_sequencia_publica(uuid) from public, anon, authenticated;
grant execute on function public.sou_host() to authenticated;
grant execute on function public.minha_conta_esta_banida() to authenticated;
grant execute on function public.banir_usuario(uuid, text) to authenticated;
grant execute on function public.excluir_post(uuid) to authenticated;
grant execute on function public.calcular_sequencia_publica(uuid) to authenticated;

drop policy if exists "host exclui midia social" on storage.objects;
create policy "host exclui midia social"
on storage.objects for delete to authenticated
using (
  bucket_id = 'midia-publica'
  and public.sou_host()
  and (storage.foldername(name))[2] = 'social'
);
