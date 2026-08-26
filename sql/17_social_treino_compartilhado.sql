-- VIVECI — BLOCO 17: mapa, detalhes e cópia segura do treino no Social
-- Aplicar depois de 12_privacidade_metricas_social.sql.

alter table public.posts
  add column if not exists treino_exercicios jsonb;

-- O snapshot contém apenas exercício, quantidade de séries, faixa de repetições
-- e descanso. Carga e registros privados nunca entram no feed.
create or replace function public.preparar_snapshot_treino_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessoes_concluidas%rowtype;
  nome_rotina text;
  total_series int;
begin
  if new.sessao_concluida_id is null then
    new.treino_nome := null;
    new.treino_duracao_seg := null;
    new.treino_series := null;
    new.treino_volume_kg := null;
    new.treino_exercicios := null;
    return new;
  end if;

  select * into s
  from public.sessoes_concluidas
  where id = new.sessao_concluida_id and user_id = new.user_id;

  if not found then
    raise exception 'Sessão inválida para este usuário.' using errcode = '42501';
  end if;

  select p.nome into nome_rotina
  from public.plano_sessoes ps
  join public.planos p on p.id = ps.plano_id
  where ps.id = s.sessao_id;

  select count(*) into total_series
  from public.registros r
  where r.user_id = new.user_id
    and r.data >= s.iniciada_em
    and r.data <= coalesce(s.finalizada_em, now());

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'exercicioId', itens.exercicio_id,
      'nome', itens.nome,
      'series', itens.series,
      'repsMin', itens.reps_min,
      'repsMax', itens.reps_max,
      'descansoSeg', itens.descanso_seg
    ) order by itens.primeiro_registro
  ), '[]'::jsonb)
  into new.treino_exercicios
  from (
    select
      r.exercicio_id,
      e.nome,
      count(*)::int as series,
      min(r.reps)::int as reps_min,
      max(r.reps)::int as reps_max,
      coalesce((
        select pi.descanso_seg
        from public.plano_itens pi
        where pi.sessao_id = s.sessao_id
          and pi.exercicio_id = r.exercicio_id
        limit 1
      ), 90)::int as descanso_seg,
      min(r.data) as primeiro_registro
    from public.registros r
    join public.exercicios e on e.id = r.exercicio_id
    where r.user_id = new.user_id
      and r.data >= s.iniciada_em
      and r.data <= coalesce(s.finalizada_em, now())
    group by r.exercicio_id, e.nome
  ) itens;

  new.treino_nome := coalesce(nome_rotina, 'Treino rápido');
  new.treino_duracao_seg := s.duracao_seg;
  new.treino_series := total_series;
  new.treino_volume_kg := s.volume_total_kg;
  return new;
end;
$$;

drop trigger if exists preparar_snapshot_treino_post on public.posts;
create trigger preparar_snapshot_treino_post
before insert or update of sessao_concluida_id on public.posts
for each row execute function public.preparar_snapshot_treino_post();

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
  p.criado_em,
  p.treino_exercicios
from public.posts p
where auth.role() = 'authenticated'
  and not exists (
    select 1 from public.usuarios_bloqueados b
    where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.user_id)
       or (b.bloqueador_id = p.user_id and b.bloqueado_id = auth.uid())
  );

revoke all on public.posts_publicos from public, anon;
grant select on public.posts_publicos to authenticated;

-- Copia o snapshot público para uma rotina nova do usuário autenticado.
-- O trigger de limite Free em planos continua sendo a autoridade do limite.
create or replace function public.copiar_treino_post(p_post_id uuid)
returns table(rotina_id uuid, sessao_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  origem public.posts%rowtype;
  novo_plano uuid;
  nova_sessao uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  select p.* into origem
  from public.posts p
  where p.id = p_post_id
    and p.sessao_concluida_id is not null
    and not exists (
      select 1 from public.usuarios_bloqueados b
      where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p.user_id)
         or (b.bloqueador_id = p.user_id and b.bloqueado_id = auth.uid())
    );

  if not found or jsonb_array_length(coalesce(origem.treino_exercicios, '[]'::jsonb)) = 0 then
    raise exception 'Este treino não está disponível para cópia.' using errcode = '42501';
  end if;

  insert into public.planos (user_id, nome, semanas, data_inicio, ativo)
  values (auth.uid(), left(coalesce(origem.treino_nome, 'Treino') || ' (cópia)', 80), 1, current_date, true)
  returning id into novo_plano;

  insert into public.plano_sessoes (plano_id, semana, dia_semana, nome_sessao, tipo, ordem)
  values (novo_plano, 1, 1, coalesce(origem.treino_nome, 'Treino'), 'treino', 1)
  returning id into nova_sessao;

  insert into public.plano_itens
    (sessao_id, exercicio_id, series, reps_min, reps_max, descanso_seg, ordem, tecnica)
  select
    nova_sessao,
    (dados.item ->> 'exercicioId')::int,
    greatest(1, (dados.item ->> 'series')::int),
    greatest(1, (dados.item ->> 'repsMin')::int),
    greatest(1, (dados.item ->> 'repsMax')::int),
    greatest(15, (dados.item ->> 'descansoSeg')::int),
    dados.ordinalidade::int,
    'normal'
  from jsonb_array_elements(origem.treino_exercicios) with ordinality as dados(item, ordinalidade)
  join public.exercicios e on e.id = (dados.item ->> 'exercicioId')::int;

  return query select novo_plano, nova_sessao;
end;
$$;

revoke all on function public.copiar_treino_post(uuid) from public, anon;
grant execute on function public.copiar_treino_post(uuid) to authenticated;

-- Gera snapshots para publicações antigas que ainda apontam para uma sessão.
update public.posts
set sessao_concluida_id = sessao_concluida_id
where sessao_concluida_id is not null;
