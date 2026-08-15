-- VIVECI — BLOCO 1: ESTRUTURA
-- Cole no SQL Editor do Supabase e clique em Run.

create table perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text, foto_url text, sexo text, idade int, altura_cm int, peso_kg numeric,
  objetivo text, nivel text, local_treino text, dias_semana int, tempo_sessao_min int,
  biotipo text, onboarding_completo boolean default false,
  plano text default 'free', criado_em timestamptz default now()
);

create table exercicios (
  id serial primary key, nome text not null, grupo_muscular text not null,
  grupos_secundarios text[], nivel text, equipamento text, gif_url text,
  execucao text[], erros_comuns text[], dicas text[], is_composto boolean default false
);

create table planos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  nome text, semanas int default 12, data_inicio date default current_date,
  ativo boolean default true, config jsonb
);

create table plano_sessoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos on delete cascade,
  semana int, dia_semana int, nome_sessao text, tipo text default 'treino', ordem int
);

create table plano_itens (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid references plano_sessoes on delete cascade,
  exercicio_id int references exercicios,
  series int, reps_min int, reps_max int, descanso_seg int, ordem int, tecnica text default 'normal'
);

create table registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  exercicio_id int references exercicios, sessao_id uuid,
  serie_num int, peso_kg numeric, reps int, data timestamptz default now()
);

create table sessoes_concluidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  sessao_id uuid, iniciada_em timestamptz, finalizada_em timestamptz,
  volume_total_kg numeric, duracao_seg int
);

create table medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  data date default current_date, peso_kg numeric, gordura_pct numeric,
  peitoral numeric, cintura numeric, quadril numeric, braco_d numeric, coxa_d numeric
);

create table fotos_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  data date default current_date, angulo text, url text
);

create table receitas (
  id serial primary key, nome text, categoria text, refeicao text,
  ingredientes text[], modo_preparo text[], calorias int, proteina_g numeric,
  carboidrato_g numeric, gordura_g numeric, tempo_min int, dificuldade text, imagem_url text
);

create table alimentos (
  id serial primary key, nome text, unidade text default 'g',
  kcal_100 numeric, prot_100 numeric, carb_100 numeric, gord_100 numeric, categoria text
);

create table metas_nutricionais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  calculada_em timestamptz default now(), tmb numeric, get numeric,
  meta_kcal int, meta_prot_g int, meta_carb_g int, meta_gord_g int, ativa boolean default true
);

create table diario_alimentar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  data date default current_date, refeicao text, origem text,
  receita_id int, alimento_id int, nome_livre text, quantidade numeric,
  kcal numeric, prot_g numeric, carb_g numeric, gord_g numeric
);

create table desafio_dias (
  dia int primary key, titulo text, tarefa text, meta_alimentacao text
);

create table desafio_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  dia int, treino_ok boolean default false, tarefa_ok boolean default false,
  alimentacao_ok boolean default false, copos_agua int default 0, concluido_em timestamptz
);

create table streaks (
  user_id uuid primary key references auth.users on delete cascade,
  atual int default 0, maior int default 0, ultimo_dia_valido date, escudos int default 1
);

-- RLS
alter table perfis enable row level security;
alter table planos enable row level security;
alter table plano_sessoes enable row level security;
alter table plano_itens enable row level security;
alter table registros enable row level security;
alter table sessoes_concluidas enable row level security;
alter table medidas enable row level security;
alter table fotos_progresso enable row level security;
alter table metas_nutricionais enable row level security;
alter table diario_alimentar enable row level security;
alter table desafio_progresso enable row level security;
alter table streaks enable row level security;

create policy "dono" on perfis for all using (auth.uid() = id);
create policy "dono" on planos for all using (auth.uid() = user_id);
create policy "dono" on registros for all using (auth.uid() = user_id);
create policy "dono" on sessoes_concluidas for all using (auth.uid() = user_id);
create policy "dono" on medidas for all using (auth.uid() = user_id);
create policy "dono" on fotos_progresso for all using (auth.uid() = user_id);
create policy "dono" on metas_nutricionais for all using (auth.uid() = user_id);
create policy "dono" on diario_alimentar for all using (auth.uid() = user_id);
create policy "dono" on desafio_progresso for all using (auth.uid() = user_id);
create policy "dono" on streaks for all using (auth.uid() = user_id);
create policy "dono via plano" on plano_sessoes for all using (
  exists (select 1 from planos p where p.id = plano_id and p.user_id = auth.uid()));
create policy "dono via sessao" on plano_itens for all using (
  exists (select 1 from plano_sessoes s join planos p on p.id = s.plano_id
          where s.id = sessao_id and p.user_id = auth.uid()));

alter table exercicios enable row level security;
alter table receitas enable row level security;
alter table alimentos enable row level security;
alter table desafio_dias enable row level security;
create policy "leitura" on exercicios for select using (auth.role() = 'authenticated');
create policy "leitura" on receitas for select using (auth.role() = 'authenticated');
create policy "leitura" on alimentos for select using (auth.role() = 'authenticated');
create policy "leitura" on desafio_dias for select using (auth.role() = 'authenticated');

-- perfil criado automaticamente no cadastro
create function public.novo_usuario() returns trigger language plpgsql security definer as $$
begin
  insert into public.perfis (id, nome) values (new.id, new.raw_user_meta_data->>'nome');
  insert into public.streaks (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.novo_usuario();
