-- VIVECI — BLOCO 29: corrige a leitura segura de mensagens de grupos.
-- Permite que cada usuário autenticado consulte somente a própria participação.

begin;

alter table public.grupo_membros enable row level security;

drop policy if exists "usuario le propria participacao" on public.grupo_membros;
create policy "usuario le propria participacao"
on public.grupo_membros
for select
to authenticated
using (user_id = auth.uid());

grant select on public.grupo_membros to authenticated;

-- Atualiza imediatamente o catálogo usado pela API do Supabase.
notify pgrst, 'reload schema';

commit;
