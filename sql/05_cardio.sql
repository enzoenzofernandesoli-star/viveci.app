-- VIVECI — BLOCO 5: CARDIO
-- Cole no SQL Editor do Supabase e clique em Run.

create table cardio_sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  equipamento text not null,
  duracao_min int not null,
  distancia_km numeric,
  data timestamptz default now()
);

alter table cardio_sessoes enable row level security;

create policy "dono" on cardio_sessoes for all using (auth.uid() = user_id);
