-- VIVECI — BLOCO 28: remove push e restaura escritas do Social.
-- Não apaga posts, mensagens, fotos, contas ou grupos. Seguro para executar novamente.

begin;

-- Push ainda não configurado: remover primeiro os gatilhos que podem interromper escritas.
drop trigger if exists enfileirar_push_mensagem on public.mensagens;
drop trigger if exists enfileirar_push_curtida on public.post_likes;
drop trigger if exists enfileirar_push_comentario on public.post_comments;
drop trigger if exists enfileirar_push_seguidor on public.seguidores;
drop trigger if exists enfileirar_push_solicitacao_grupo on public.grupo_solicitacoes;
drop function if exists public.enfileirar_push_mensagem();
drop function if exists public.enfileirar_push_social();
drop function if exists public.enfileirar_push_solicitacao_grupo();
drop function if exists public.registrar_push_token(text,text);
drop function if exists public.desativar_meus_push_tokens();
drop table if exists public.notificacoes_push;
drop table if exists public.push_tokens;

-- Publicações: somente o usuário autenticado escreve na própria pasta e cria o próprio post.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('midia-publica','midia-publica',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "midia publica inserir propria pasta" on storage.objects;
create policy "midia publica inserir propria pasta" on storage.objects for insert to authenticated
with check(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2] in('social','avatar','grupos'));
drop policy if exists "midia publica atualizar propria pasta" on storage.objects;
create policy "midia publica atualizar propria pasta" on storage.objects for update to authenticated
using(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "midia publica excluir propria pasta" on storage.objects;
create policy "midia publica excluir propria pasta" on storage.objects for delete to authenticated
using(bucket_id='midia-publica' and (storage.foldername(name))[1]=auth.uid()::text);
alter table public.posts enable row level security;
drop policy if exists "autor insere" on public.posts;
create policy "autor insere" on public.posts for insert to authenticated with check(auth.uid()=user_id);
grant insert on public.posts to authenticated;

-- Mensagens de texto: função independente e sem qualquer chamada de notificação.
create or replace function public.enviar_mensagem(p_conversa_id uuid,p_grupo_id uuid,p_texto text default null,p_treino_id uuid default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare texto_limpo text:=nullif(trim(p_texto),''); nova_id bigint;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.' using errcode='42501'; end if;
  if ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if texto_limpo is null and p_treino_id is null then raise exception 'Mensagem vazia.' using errcode='22023'; end if;
  if char_length(texto_limpo)>1000 then raise exception 'Mensagem muito longa.' using errcode='22023'; end if;
  if (select count(*) from public.mensagens where remetente_id=auth.uid() and criada_em>now()-interval '1 minute')>=30 then raise exception 'Aguarde antes de enviar mais mensagens.' using errcode='42900'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas c where c.id=p_conversa_id and auth.uid() in(c.usuario_a,c.usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros gm where gm.grupo_id=p_grupo_id and gm.user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_treino_id is not null and not exists(select 1 from public.sessoes_concluidas s where s.id=p_treino_id and s.user_id=auth.uid() and s.finalizada_em is not null) then raise exception 'Treino inválido.' using errcode='42501'; end if;
  insert into public.mensagens(remetente_id,conversa_id,grupo_id,texto,treino_id) values(auth.uid(),p_conversa_id,p_grupo_id,texto_limpo,p_treino_id) returning id into nova_id;
  if p_conversa_id is not null then update public.conversas set atualizada_em=now() where id=p_conversa_id; end if;
  return nova_id;
end;
$$;
revoke all on function public.enviar_mensagem(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.enviar_mensagem(uuid,uuid,text,uuid) to authenticated;

commit;
