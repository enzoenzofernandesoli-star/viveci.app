-- VIVECI — BLOCO 27: restaura publicação de fotos no Social.
-- Não remove posts nem imagens. Seguro para executar novamente.

begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('midia-publica','midia-publica',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "midia publica inserir propria pasta" on storage.objects;
create policy "midia publica inserir propria pasta" on storage.objects for insert to authenticated
with check(
  bucket_id='midia-publica'
  and (storage.foldername(name))[1]=auth.uid()::text
  and (storage.foldername(name))[2] in('social','avatar','grupos')
);

drop policy if exists "midia publica atualizar propria pasta" on storage.objects;
create policy "midia publica atualizar propria pasta" on storage.objects for update to authenticated
using(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "midia publica excluir propria pasta" on storage.objects;
create policy "midia publica excluir propria pasta" on storage.objects for delete to authenticated
using(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text);

alter table public.posts enable row level security;
drop policy if exists "autor insere" on public.posts;
create policy "autor insere" on public.posts for insert to authenticated with check(auth.uid()=user_id);
grant insert on public.posts to authenticated;

commit;
