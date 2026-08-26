-- VIVECI — PERFIL SOCIAL: total público de treinos e sequência atual.
-- Expõe somente agregados; sessões, cargas e datas continuam privadas.

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

revoke all on function public.calcular_sequencia_publica(uuid) from public, anon, authenticated;

create or replace view public.perfis_publicos
with (security_barrier = true)
as
select
  p.id,
  p.nome,
  p.foto_url,
  p.bio,
  (select count(*)::integer from public.sessoes_concluidas s
    where s.user_id = p.id and s.finalizada_em is not null) as total_treinos,
  public.calcular_sequencia_publica(p.id) as sequencia_atual
from public.perfis p
where not exists (
  select 1 from public.usuarios_bloqueados b where
    (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.id) or
    (b.bloqueador_id = p.id and b.bloqueado_id = auth.uid())
);

revoke all on public.perfis_publicos from anon, public;
grant select on public.perfis_publicos to authenticated;
