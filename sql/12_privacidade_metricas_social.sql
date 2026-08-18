-- VIVECI — BLOCO 12: contrato público seguro dos posts
-- Aplicar depois de 11_indices_performance.sql.

-- O feed nunca recebe o id da sessão nem métricas desmarcadas pelo autor.
create or replace view public.posts_publicos
with (security_barrier = true)
as
select
  p.id,
  p.user_id,
  p.legenda,
  p.foto_url,
  (p.sessao_concluida_id is not null) as tem_treino,
  p.treino_nome,
  case when p.mostrar_duracao then p.treino_duracao_seg else null end as treino_duracao_seg,
  case when p.mostrar_series then p.treino_series else null end as treino_series,
  case when p.mostrar_volume then p.treino_volume_kg else null end as treino_volume_kg,
  p.mostrar_duracao,
  p.mostrar_series,
  p.mostrar_volume,
  p.criado_em
from public.posts p
where auth.role() = 'authenticated'
  and not exists (
    select 1 from public.usuarios_bloqueados b
    where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.user_id)
       or (b.bloqueador_id = p.user_id and b.bloqueado_id = auth.uid())
  );

-- Exportação do titular: inclui o registro completo somente quando o JWT é do autor.
create or replace view public.posts_proprios
with (security_barrier = true)
as
select p.*
from public.posts p
where auth.uid() = p.user_id;

revoke all on public.posts_publicos from public, anon;
revoke all on public.posts_proprios from public, anon;
grant select on public.posts_publicos to authenticated;
grant select on public.posts_proprios to authenticated;

-- Remove leitura direta do snapshot bruto. As colunas mínimas abaixo continuam
-- legíveis para operações próprias e policies; o feed usa posts_publicos.
revoke select on public.posts from authenticated, anon;
grant select (id, user_id, legenda, foto_url, mostrar_duracao, mostrar_series, mostrar_volume, criado_em)
on public.posts to authenticated;

-- Exclusão retorna o path apenas ao próprio autor, sem reabrir foto_path no SELECT.
create or replace function public.excluir_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare caminho text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  delete from public.posts
  where id = p_post_id and user_id = auth.uid()
  returning foto_path into caminho;

  if not found then
    raise exception 'Publicação não encontrada.' using errcode = '42501';
  end if;
  return caminho;
end; $$;

revoke all on function public.excluir_post(uuid) from public, anon;
grant execute on function public.excluir_post(uuid) to authenticated;
