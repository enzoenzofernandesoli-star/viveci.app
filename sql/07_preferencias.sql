-- VIVECI — BLOCO 7: preferências do usuário (tela de Configurações)
-- Cole no SQL Editor do Supabase e clique em Run.

create table preferencias_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- treinamento
  duracao_treino_preferida_min integer,
  horario_treino_preferido time,
  dias_treino_preferidos int[] not null default '{}',   -- 0=domingo .. 6=sábado
  equipamentos_disponiveis text[] not null default '{}',
  exercicios_excluidos int[] not null default '{}',

  -- notificações
  notif_lembrete_treino boolean not null default true,
  notif_horario_treino boolean not null default true,
  notif_treino_recomendado boolean not null default true,
  notif_lembrete_alimentacao boolean not null default false,
  notif_novo_pr boolean not null default true,
  notif_resumo_semanal boolean not null default true,
  notif_recomendacoes boolean not null default true,
  notif_inteligentes boolean not null default true,
  notif_inicio time not null default '08:00',
  notif_fim time not null default '22:00',

  -- nutrição
  nutricao_mostrar_kcal boolean not null default true,
  nutricao_mostrar_proteina boolean not null default true,
  nutricao_mostrar_carboidrato boolean not null default true,
  nutricao_mostrar_gordura boolean not null default true,

  -- aparência
  tema text not null default 'sistema' check (tema in ('claro', 'escuro', 'sistema')),
  animacoes boolean not null default true,
  reduzir_movimento boolean not null default false,

  atualizado_em timestamptz not null default now()
);

alter table preferencias_usuario enable row level security;
create policy "dono" on preferencias_usuario for all using (auth.uid() = user_id);
