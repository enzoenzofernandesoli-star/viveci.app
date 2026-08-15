-- VIVECI — BLOCO 4: permissões do bucket de fotos de progresso
-- Cada usuário só enxerga e escreve dentro da própria pasta (o nome do arquivo
-- começa com o id dele, no formato:  <user_id>/frente-2026-08-15.jpg)

create policy "usuario envia a propria foto"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'Fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "usuario le a propria foto"
on storage.objects for select to authenticated
using (
  bucket_id = 'Fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "usuario atualiza a propria foto"
on storage.objects for update to authenticated
using (
  bucket_id = 'Fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "usuario apaga a propria foto"
on storage.objects for delete to authenticated
using (
  bucket_id = 'Fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
