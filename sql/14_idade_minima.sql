-- VIVECI — BLOCO 14: idade mínima definida pelo produto
-- Aplicar depois de 13_privilegios_minimos.sql.

alter table public.perfis
  drop constraint if exists perfis_idade_minima;

alter table public.perfis
  add constraint perfis_idade_minima
  check (idade is null or idade >= 10);
