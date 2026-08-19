-- VIVECI — BLOCO 15: beta exclusivo para maiores de idade
-- Aplicar depois de 14_idade_minima.sql.

alter table public.perfis
  drop constraint if exists perfis_idade_minima;

alter table public.perfis
  add constraint perfis_idade_minima
  check (idade is null or idade >= 18);
