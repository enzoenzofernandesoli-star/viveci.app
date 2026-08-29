-- VIVECI — BLOCO 26: restaura a leitura do chat sem apagar mensagens.
-- Pode ser executado novamente. Aplicar depois dos blocos 23 e 24.

begin;

create table if not exists public.treinos_marcados (
  id uuid primary key default gen_random_uuid(), criador_id uuid not null references auth.users(id) on delete cascade,
  conversa_id uuid references public.conversas(id) on delete cascade, grupo_id uuid references public.grupos_sociais(id) on delete cascade,
  local text not null check(char_length(local) between 2 and 120), data_hora timestamptz not null, criada_em timestamptz not null default now(),
  check(((conversa_id is not null)::integer+(grupo_id is not null)::integer)=1)
);
create table if not exists public.treino_marcado_participantes (
  treino_marcado_id uuid not null references public.treinos_marcados(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, entrou_em timestamptz not null default now(),
  primary key(treino_marcado_id,user_id)
);
alter table public.mensagens add column if not exists treino_marcado_id uuid references public.treinos_marcados(id) on delete set null;
alter table public.mensagens add column if not exists midia_tipo text check(midia_tipo in('imagem','audio'));
alter table public.mensagens add column if not exists midia_path text;

drop function if exists public.listar_mensagens(uuid,uuid,bigint);
create function public.listar_mensagens(p_conversa_id uuid default null,p_grupo_id uuid default null,p_antes bigint default null)
returns table(
  id bigint,remetente_id uuid,texto text,treino_id uuid,criada_em timestamptz,nome text,foto_url text,
  convite_id uuid,convite_grupo_id uuid,convite_grupo_nome text,convite_grupo_foto text,convite_ativo boolean,
  treino_marcado_id uuid,treino_marcado_local text,treino_marcado_em timestamptz,treino_marcado_participantes bigint,participando_treino boolean,
  midia_tipo text,midia_path text
)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas c where c.id=p_conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros gm where gm.grupo_id=p_grupo_id and gm.user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  return query
  select m.id,m.remetente_id,m.texto,m.treino_id,m.criada_em,coalesce(p.nome,'Atleta VIVECI'),p.foto_url,
    gc.id,gc.grupo_id,g.nome,g.foto_url,(gc.usado_em is null and gc.expira_em>now()),
    tm.id,tm.local,tm.data_hora,count(tp.user_id)::bigint,coalesce(bool_or(tp.user_id=auth.uid()),false),m.midia_tipo,m.midia_path
  from public.mensagens m
  left join public.perfis p on p.id=m.remetente_id
  left join public.grupo_convites gc on gc.id=m.convite_grupo_id
  left join public.grupos_sociais g on g.id=gc.grupo_id
  left join public.treinos_marcados tm on tm.id=m.treino_marcado_id
  left join public.treino_marcado_participantes tp on tp.treino_marcado_id=tm.id
  where (p_conversa_id is null or m.conversa_id=p_conversa_id) and (p_grupo_id is null or m.grupo_id=p_grupo_id) and (p_antes is null or m.id<p_antes)
  group by m.id,m.remetente_id,m.texto,m.treino_id,m.criada_em,p.nome,p.foto_url,gc.id,gc.grupo_id,g.nome,g.foto_url,gc.usado_em,gc.expira_em,tm.id,tm.local,tm.data_hora,m.midia_tipo,m.midia_path
  order by m.id desc limit 40;
end;
$$;

revoke all on function public.listar_mensagens(uuid,uuid,bigint) from public,anon;
grant execute on function public.listar_mensagens(uuid,uuid,bigint),public.enviar_mensagem(uuid,uuid,text,uuid) to authenticated;

commit;
