-- VIVECI — BLOCO 9: segurança, privacidade e autorização pré-beta
-- Aplicar depois de 08_social.sql.

-- Buckets separados: conteúdo deliberadamente público e progresso corporal privado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('midia-publica', 'midia-publica', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('progresso-privado', 'progresso-privado', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "midia publica inserir propria pasta" on storage.objects for insert to authenticated
with check (bucket_id = 'midia-publica' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "midia publica atualizar propria pasta" on storage.objects for update to authenticated
using (bucket_id = 'midia-publica' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "midia publica excluir propria pasta" on storage.objects for delete to authenticated
using (bucket_id = 'midia-publica' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progresso privado inserir propria pasta" on storage.objects for insert to authenticated
with check (bucket_id = 'progresso-privado' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progresso privado ler propria pasta" on storage.objects for select to authenticated
using (bucket_id = 'progresso-privado' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progresso privado atualizar propria pasta" on storage.objects for update to authenticated
using (bucket_id = 'progresso-privado' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progresso privado excluir propria pasta" on storage.objects for delete to authenticated
using (bucket_id = 'progresso-privado' and (storage.foldername(name))[1] = auth.uid()::text);

alter table fotos_progresso add column if not exists storage_bucket text;
alter table fotos_progresso add column if not exists storage_path text;
alter table posts add column if not exists foto_path text;
alter table posts add column if not exists treino_nome text;
alter table posts add column if not exists treino_duracao_seg int;
alter table posts add column if not exists treino_series int;
alter table posts add column if not exists treino_volume_kg numeric;

alter table perfis add constraint perfis_bio_limite check (bio is null or char_length(bio) <= 240) not valid;
alter table posts add constraint posts_legenda_limite check (legenda is null or char_length(legenda) <= 2200) not valid;
alter table post_comments add constraint comentarios_texto_limite check (char_length(texto) between 1 and 500) not valid;

-- Normaliza policies de escrita do bloco 8, que usava nomes repetidos.
drop policy if exists "dono" on posts;
create policy "autor insere" on posts for insert with check (auth.uid() = user_id);
create policy "autor atualiza" on posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "autor exclui" on posts for delete using (auth.uid() = user_id);

drop policy if exists "dono" on seguidores;
create policy "seguidor insere" on seguidores for insert with check (auth.uid() = seguidor_id);
create policy "seguidor exclui" on seguidores for delete using (auth.uid() = seguidor_id);

-- O perfil completo volta a ser privado. A view expõe somente o contrato social mínimo.
drop policy if exists "leitura publica" on perfis;
create or replace view public.perfis_publicos
with (security_barrier = true)
as
select id, nome, foto_url, bio
from public.perfis;
revoke all on public.perfis_publicos from anon, public;
grant select on public.perfis_publicos to authenticated;

-- Usuário autenticado não pode se promover para Pro.
create or replace function public.proteger_entitlement_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and new.plano is distinct from old.plano then
    raise exception 'O plano só pode ser alterado pelo backend.' using errcode = '42501';
  end if;
  return new;
end; $$;
drop trigger if exists proteger_entitlement_perfil on perfis;
create trigger proteger_entitlement_perfil before update on perfis
for each row execute function public.proteger_entitlement_perfil();

-- Mesmo por API direta, Free não cria a quinta rotina.
create or replace function public.validar_limite_rotinas()
returns trigger language plpgsql security definer set search_path = public as $$
declare plano_usuario text; total int;
begin
  if auth.role() = 'authenticated' and auth.uid() is distinct from new.user_id then
    raise exception 'Usuário inválido.' using errcode = '42501';
  end if;
  select plano into plano_usuario from perfis where id = new.user_id;
  select count(*) into total from planos where user_id = new.user_id;
  if auth.role() = 'authenticated' and coalesce(plano_usuario, 'free') = 'free' and total >= 4 then
    raise exception 'Limite de quatro rotinas do plano Free atingido.' using errcode = '23514';
  end if;
  return new;
end; $$;
drop trigger if exists validar_limite_rotinas on planos;
create trigger validar_limite_rotinas before insert on planos
for each row execute function public.validar_limite_rotinas();

-- Snapshot seguro do treino: valores sempre derivados da sessão pertencente ao autor.
create or replace function public.preparar_snapshot_treino_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare s sessoes_concluidas%rowtype; nome_rotina text; total_series int;
begin
  if new.sessao_concluida_id is null then
    new.treino_nome := null; new.treino_duracao_seg := null;
    new.treino_series := null; new.treino_volume_kg := null;
    return new;
  end if;
  select * into s from sessoes_concluidas where id = new.sessao_concluida_id and user_id = new.user_id;
  if not found then raise exception 'Sessão inválida para este usuário.' using errcode = '42501'; end if;
  select p.nome into nome_rotina from plano_sessoes ps join planos p on p.id = ps.plano_id where ps.id = s.sessao_id;
  select count(*) into total_series from registros r
    where r.user_id = new.user_id and r.data >= s.iniciada_em and r.data <= coalesce(s.finalizada_em, now());
  new.treino_nome := coalesce(nome_rotina, 'Treino Rápido');
  new.treino_duracao_seg := s.duracao_seg;
  new.treino_series := total_series;
  new.treino_volume_kg := s.volume_total_kg;
  return new;
end; $$;
drop trigger if exists preparar_snapshot_treino_post on posts;
create trigger preparar_snapshot_treino_post before insert or update of sessao_concluida_id on posts
for each row execute function public.preparar_snapshot_treino_post();

-- Moderação mínima.
create table if not exists usuarios_bloqueados (
  bloqueador_id uuid references auth.users on delete cascade,
  bloqueado_id uuid references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);
alter table usuarios_bloqueados enable row level security;
create policy "dono" on usuarios_bloqueados for all
using (auth.uid() = bloqueador_id) with check (auth.uid() = bloqueador_id);

create table if not exists denuncias_social (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid references auth.users on delete cascade not null,
  tipo text not null check (tipo in ('post', 'comentario')),
  post_id uuid references posts on delete cascade,
  comentario_id uuid references post_comments on delete cascade,
  categoria text not null check (categoria in ('spam', 'inadequado', 'assedio', 'enganoso', 'outro')),
  criado_em timestamptz not null default now(),
  check ((tipo = 'post' and post_id is not null and comentario_id is null) or
         (tipo = 'comentario' and comentario_id is not null and post_id is null))
);
alter table denuncias_social enable row level security;
create policy "denunciante cria" on denuncias_social for insert with check (auth.uid() = denunciante_id);
create policy "denunciante le" on denuncias_social for select using (auth.uid() = denunciante_id);

create or replace function public.impedir_follow_bloqueado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.seguidor_id = new.seguido_id or exists (
    select 1 from usuarios_bloqueados b where
      (b.bloqueador_id = new.seguidor_id and b.bloqueado_id = new.seguido_id) or
      (b.bloqueador_id = new.seguido_id and b.bloqueado_id = new.seguidor_id)
  ) then raise exception 'Não é possível seguir este usuário.' using errcode = '42501'; end if;
  return new;
end; $$;
drop trigger if exists impedir_follow_bloqueado on seguidores;
create trigger impedir_follow_bloqueado before insert on seguidores
for each row execute function public.impedir_follow_bloqueado();

create or replace view public.perfis_publicos
with (security_barrier = true)
as
select p.id, p.nome, p.foto_url, p.bio
from public.perfis p
where not exists (
  select 1 from public.usuarios_bloqueados b where
    (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.id) or
    (b.bloqueador_id = p.id and b.bloqueado_id = auth.uid())
);
grant select on public.perfis_publicos to authenticated;

-- Leituras sociais respeitam bloqueio nos dois sentidos.
drop policy if exists "leitura" on posts;
create policy "leitura sem bloqueio" on posts for select using (
  auth.role() = 'authenticated' and not exists (
    select 1 from usuarios_bloqueados b where
      (b.bloqueador_id = auth.uid() and b.bloqueado_id = posts.user_id) or
      (b.bloqueador_id = posts.user_id and b.bloqueado_id = auth.uid())
  )
);

drop policy if exists "leitura" on post_comments;
create policy "leitura sem bloqueio" on post_comments for select using (
  auth.role() = 'authenticated' and not exists (
    select 1 from usuarios_bloqueados b where
      (b.bloqueador_id = auth.uid() and b.bloqueado_id = post_comments.user_id) or
      (b.bloqueador_id = post_comments.user_id and b.bloqueado_id = auth.uid())
  )
);
drop policy if exists "dono" on post_comments;
create policy "dono insere em post visivel" on post_comments for insert with check (
  auth.uid() = user_id and exists (select 1 from posts p where p.id = post_id)
);
create policy "dono exclui" on post_comments for delete using (auth.uid() = user_id);

drop policy if exists "dono" on post_likes;
create policy "dono insere em post visivel" on post_likes for insert with check (
  auth.uid() = user_id and exists (select 1 from posts p where p.id = post_id)
);
create policy "dono exclui" on post_likes for delete using (auth.uid() = user_id);

-- Evita duplicar a mesma denúncia do mesmo conteúdo pelo mesmo usuário.
create unique index if not exists denuncias_post_unica on denuncias_social (denunciante_id, post_id) where post_id is not null;
create unique index if not exists denuncias_comentario_unica on denuncias_social (denunciante_id, comentario_id) where comentario_id is not null;
