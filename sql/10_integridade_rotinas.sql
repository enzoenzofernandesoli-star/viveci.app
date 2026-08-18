-- VIVECI — BLOCO 10: integridade transacional das rotinas
-- Aplicar depois de 09_seguranca_beta.sql.

create or replace function public.criar_rotina(p_nome text)
returns table (rotina_id uuid, sessao_id uuid)
language plpgsql security invoker set search_path = public as $$
declare nova_rotina uuid; nova_sessao uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  if char_length(trim(p_nome)) not between 1 and 80 then
    raise exception 'O nome da rotina deve ter entre 1 e 80 caracteres.' using errcode = '23514';
  end if;

  insert into planos (user_id, nome)
  values (auth.uid(), trim(p_nome))
  returning id into nova_rotina;

  insert into plano_sessoes (plano_id, semana, dia_semana, ordem, nome_sessao)
  values (nova_rotina, 1, 1, 1, trim(p_nome))
  returning id into nova_sessao;

  return query select nova_rotina, nova_sessao;
end; $$;

create or replace function public.salvar_itens_rotina(p_sessao_id uuid, p_itens jsonb)
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null or not exists (
    select 1 from plano_sessoes s
    join planos p on p.id = s.plano_id
    where s.id = p_sessao_id and p.user_id = auth.uid()
  ) then
    raise exception 'Sessão de rotina inválida.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) > 100 then
    raise exception 'Lista de exercícios inválida.' using errcode = '23514';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_itens) as item(exercicio_id int, ordem int)
    group by item.exercicio_id
    having count(*) > 1
  ) or exists (
    select 1 from jsonb_to_recordset(p_itens) as item(exercicio_id int, ordem int)
    where item.exercicio_id is null or item.ordem is null or item.ordem < 1
  ) then
    raise exception 'Exercícios repetidos ou fora de ordem.' using errcode = '23514';
  end if;

  delete from plano_itens where sessao_id = p_sessao_id;
  insert into plano_itens (sessao_id, exercicio_id, series, reps_min, reps_max, descanso_seg, ordem, tecnica)
  select p_sessao_id, item.exercicio_id, 3, 8, 12, 90, item.ordem, 'normal'
  from jsonb_to_recordset(p_itens) as item(exercicio_id int, ordem int)
  order by item.ordem;
end; $$;

revoke all on function public.criar_rotina(text) from public, anon;
grant execute on function public.criar_rotina(text) to authenticated;
revoke all on function public.salvar_itens_rotina(uuid, jsonb) from public, anon;
grant execute on function public.salvar_itens_rotina(uuid, jsonb) to authenticated;

alter table planos add constraint planos_nome_valido
  check (nome is not null and char_length(trim(nome)) between 1 and 80) not valid;
alter table plano_itens add constraint plano_itens_series_validas
  check (series between 1 and 20 and reps_min between 1 and 100 and reps_max between reps_min and 100) not valid;
alter table plano_itens add constraint plano_itens_descanso_valido
  check (descanso_seg between 0 and 1800) not valid;
alter table registros add constraint registros_sessao_fk
  foreign key (sessao_id) references plano_sessoes(id) on delete set null not valid;
alter table sessoes_concluidas add constraint sessoes_concluidas_sessao_fk
  foreign key (sessao_id) references plano_sessoes(id) on delete set null not valid;

comment on column sessoes_concluidas.finalizada_em is
  'NULL identifica sessão iniciada e abandonada; consultas de histórico devem exigir valor não nulo.';
