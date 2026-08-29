-- VIVECI — BLOCO 31: restaura o vínculo opcional de convites no chat.
-- Seguro para executar novamente. Preserva mensagens, fotos, áudios e treinos existentes.

begin;

alter table public.mensagens
  add column if not exists convite_grupo_id uuid
  references public.grupo_convites(id) on delete set null;

commit;
