-- VIVECI — BLOCO 25: fila e tokens de notificações push
-- Aplicar depois de 24_midias_chat.sql. Seguro para executar novamente.

create table if not exists public.push_tokens(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check(char_length(token) between 20 and 4096),
  plataforma text not null check(plataforma in('android','ios')),
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
create index if not exists push_tokens_usuario_ativo_idx on public.push_tokens(user_id) where ativo;

create table if not exists public.notificacoes_push(
  id bigint generated always as identity primary key,
  destinatario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check(tipo in('mensagem','grupo','curtida','comentario','seguidor')),
  titulo text not null check(char_length(titulo) between 1 and 80),
  corpo text not null check(char_length(corpo) between 1 and 180),
  rota text not null check(char_length(rota) between 1 and 300 and rota like '/%'),
  criada_em timestamptz not null default now(),
  enviada_em timestamptz
);
create index if not exists notificacoes_push_pendentes_idx on public.notificacoes_push(criada_em) where enviada_em is null;

alter table public.push_tokens enable row level security;
alter table public.notificacoes_push enable row level security;
revoke all on public.push_tokens,public.notificacoes_push from public,anon,authenticated;

create or replace function public.registrar_push_token(p_token text,p_plataforma text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  if char_length(p_token) not between 20 and 4096 or p_plataforma not in('android','ios') then raise exception 'Token inválido.' using errcode='22023'; end if;
  insert into public.push_tokens(user_id,token,plataforma) values(auth.uid(),p_token,p_plataforma)
  on conflict(token) do update set user_id=auth.uid(),plataforma=excluded.plataforma,ativo=true,atualizado_em=now();
end;
$$;

create or replace function public.desativar_meus_push_tokens()
returns void language sql security definer set search_path=public as $$
  update public.push_tokens set ativo=false,atualizado_em=now() where user_id=auth.uid();
$$;

create or replace function public.enfileirar_push_mensagem()
returns trigger language plpgsql security definer set search_path=public as $$
declare nome_autor text; nome_grupo text; destino uuid; titulo_push text; corpo_push text; rota_push text;
begin
  select coalesce(nome,'Atleta VIVECI') into nome_autor from public.perfis where id=new.remetente_id;
  corpo_push:=case
    when new.midia_tipo='imagem' then 'Enviou uma foto'
    when new.midia_tipo='audio' then 'Enviou um áudio'
    when new.treino_marcado_id is not null then 'Marcou um treino. Toque para participar.'
    when new.convite_grupo_id is not null then 'Enviou um convite para uma guilda.'
    when new.treino_id is not null then 'Compartilhou um treino concluído.'
    else left(coalesce(new.texto,'Nova mensagem'),180)
  end;
  if new.conversa_id is not null then
    select case when usuario_a=new.remetente_id then usuario_b else usuario_a end into destino from public.conversas where id=new.conversa_id;
    titulo_push:=nome_autor; rota_push:='/social/mensagem/'||new.conversa_id::text;
    insert into public.notificacoes_push(destinatario_id,tipo,titulo,corpo,rota) values(destino,'mensagem',titulo_push,corpo_push,rota_push);
  else
    select nome into nome_grupo from public.grupos_sociais where id=new.grupo_id;
    titulo_push:=left(coalesce(nome_grupo,'Guilda')||' · '||nome_autor,80); rota_push:='/social/grupo/'||new.grupo_id::text;
    insert into public.notificacoes_push(destinatario_id,tipo,titulo,corpo,rota)
    select gm.user_id,'mensagem',titulo_push,corpo_push,rota_push from public.grupo_membros gm where gm.grupo_id=new.grupo_id and gm.user_id<>new.remetente_id;
  end if;
  return new;
end;
$$;
drop trigger if exists enfileirar_push_mensagem on public.mensagens;
create trigger enfileirar_push_mensagem after insert on public.mensagens for each row execute function public.enfileirar_push_mensagem();

create or replace function public.enfileirar_push_social()
returns trigger language plpgsql security definer set search_path=public as $$
declare destino uuid; ator uuid; nome_ator text; tipo_push text; titulo_push text; corpo_push text; rota_push text;
begin
  if tg_table_name='post_likes' then
    ator:=new.user_id; select user_id into destino from public.posts where id=new.post_id;
    tipo_push:='curtida'; titulo_push:='Nova curtida'; corpo_push:='curtiu sua publicação.'; rota_push:='/social';
  elsif tg_table_name='post_comments' then
    ator:=new.user_id; select user_id into destino from public.posts where id=new.post_id;
    tipo_push:='comentario'; titulo_push:='Novo comentário'; corpo_push:=left(new.texto,180); rota_push:='/social';
  else
    ator:=new.seguidor_id; destino:=new.seguido_id;
    tipo_push:='seguidor'; titulo_push:='Novo seguidor'; corpo_push:='começou a seguir você.'; rota_push:='/social/usuario/'||ator::text;
  end if;
  if destino is null or destino=ator then return new; end if;
  select coalesce(nome,'Atleta VIVECI') into nome_ator from public.perfis where id=ator;
  insert into public.notificacoes_push(destinatario_id,tipo,titulo,corpo,rota)
  values(destino,tipo_push,left(titulo_push||' · '||nome_ator,80),corpo_push,rota_push);
  return new;
end;
$$;
drop trigger if exists enfileirar_push_curtida on public.post_likes;
create trigger enfileirar_push_curtida after insert on public.post_likes for each row execute function public.enfileirar_push_social();
drop trigger if exists enfileirar_push_comentario on public.post_comments;
create trigger enfileirar_push_comentario after insert on public.post_comments for each row execute function public.enfileirar_push_social();
drop trigger if exists enfileirar_push_seguidor on public.seguidores;
create trigger enfileirar_push_seguidor after insert on public.seguidores for each row execute function public.enfileirar_push_social();

create or replace function public.enfileirar_push_solicitacao_grupo()
returns trigger language plpgsql security definer set search_path=public as $$
declare nome_pessoa text; nome_grupo text;
begin
  select coalesce(nome,'Atleta VIVECI') into nome_pessoa from public.perfis where id=new.solicitante_id;
  select nome into nome_grupo from public.grupos_sociais where id=new.grupo_id;
  insert into public.notificacoes_push(destinatario_id,tipo,titulo,corpo,rota)
  select gm.user_id,'grupo',left('Solicitação · '||coalesce(nome_grupo,'Guilda'),80),left(nome_pessoa||' quer participar da guilda.',180),'/social/grupo/'||new.grupo_id::text
  from public.grupo_membros gm where gm.grupo_id=new.grupo_id and gm.papel in('dono','admin') and gm.user_id<>new.solicitante_id;
  return new;
end;
$$;
drop trigger if exists enfileirar_push_solicitacao_grupo on public.grupo_solicitacoes;
create trigger enfileirar_push_solicitacao_grupo after insert on public.grupo_solicitacoes for each row execute function public.enfileirar_push_solicitacao_grupo();

revoke all on function public.registrar_push_token(text,text),public.desativar_meus_push_tokens() from public,anon;
grant execute on function public.registrar_push_token(text,text),public.desativar_meus_push_tokens() to authenticated;
