-- VIVECI — BLOCO 8: núcleo do VIVECI Social (feed, curtidas, comentários, seguir)
-- Cole no SQL Editor do Supabase e clique em Run.

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  legenda text,
  foto_url text,
  sessao_concluida_id uuid references sessoes_concluidas on delete set null,
  mostrar_duracao boolean not null default true,
  mostrar_series boolean not null default true,
  mostrar_volume boolean not null default true,
  mostrar_prs boolean not null default true,
  criado_em timestamptz not null default now()
);

create table post_likes (
  post_id uuid references posts on delete cascade,
  user_id uuid references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade,
  user_id uuid references auth.users on delete cascade,
  texto text not null,
  criado_em timestamptz not null default now()
);

create table seguidores (
  seguidor_id uuid references auth.users on delete cascade,
  seguido_id uuid references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor_id, seguido_id)
);

alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table seguidores enable row level security;

-- leitura aberta pra qualquer usuário autenticado (feed público simples, sem
-- conta privada nessa primeira versão) — escrita só pelo dono.
create policy "leitura" on posts for select using (auth.role() = 'authenticated');
create policy "dono" on posts for insert with check (auth.uid() = user_id);
create policy "dono" on posts for update using (auth.uid() = user_id);
create policy "dono" on posts for delete using (auth.uid() = user_id);

create policy "leitura" on post_likes for select using (auth.role() = 'authenticated');
create policy "dono" on post_likes for insert with check (auth.uid() = user_id);
create policy "dono" on post_likes for delete using (auth.uid() = user_id);

create policy "leitura" on post_comments for select using (auth.role() = 'authenticated');
create policy "dono" on post_comments for insert with check (auth.uid() = user_id);
create policy "dono" on post_comments for delete using (auth.uid() = user_id);

create policy "leitura" on seguidores for select using (auth.role() = 'authenticated');
create policy "dono" on seguidores for insert with check (auth.uid() = seguidor_id);
create policy "dono" on seguidores for delete using (auth.uid() = seguidor_id);

-- `perfis` só tinha a policy "dono" (for all), que também restringe o select
-- ao próprio dono — antes disso não tinha problema porque nenhuma tela
-- precisava ler o perfil de outro usuário. O Social precisa (autor do post,
-- perfil público), então libera leitura pra qualquer autenticado, mantendo
-- insert/update/delete restritos ao dono via a policy "dono" já existente.
create policy "leitura publica" on perfis for select using (auth.role() = 'authenticated');
