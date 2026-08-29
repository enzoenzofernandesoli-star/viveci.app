-- VIVECI — BLOCO 24: fotos e áudios privados nos chats
-- Aplicar depois de 23_treinos_marcados.sql. Seguro para executar novamente.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-privado','chat-privado',false,15728640,array[
  'image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav'
])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

alter table public.mensagens add column if not exists midia_tipo text check(midia_tipo in('imagem','audio'));
alter table public.mensagens add column if not exists midia_path text;

drop policy if exists "chat envia midia para conversa" on storage.objects;
create policy "chat envia midia para conversa" on storage.objects for insert to authenticated with check(
  bucket_id='chat-privado' and (storage.foldername(name))[1]='conversas'
  and (storage.foldername(name))[3]=auth.uid()::text
  and exists(select 1 from public.conversas c where c.id::text=(storage.foldername(name))[2] and auth.uid() in(c.usuario_a,c.usuario_b))
);
drop policy if exists "chat envia midia para grupo" on storage.objects;
create policy "chat envia midia para grupo" on storage.objects for insert to authenticated with check(
  bucket_id='chat-privado' and (storage.foldername(name))[1]='grupos'
  and (storage.foldername(name))[3]=auth.uid()::text
  and exists(select 1 from public.grupo_membros gm where gm.grupo_id::text=(storage.foldername(name))[2] and gm.user_id=auth.uid())
);
drop policy if exists "chat le midia de conversa" on storage.objects;
create policy "chat le midia de conversa" on storage.objects for select to authenticated using(
  bucket_id='chat-privado' and (storage.foldername(name))[1]='conversas'
  and exists(select 1 from public.conversas c where c.id::text=(storage.foldername(name))[2] and auth.uid() in(c.usuario_a,c.usuario_b))
);
drop policy if exists "chat le midia de grupo" on storage.objects;
create policy "chat le midia de grupo" on storage.objects for select to authenticated using(
  bucket_id='chat-privado' and (storage.foldername(name))[1]='grupos'
  and exists(select 1 from public.grupo_membros gm where gm.grupo_id::text=(storage.foldername(name))[2] and gm.user_id=auth.uid())
);
drop policy if exists "chat exclui propria midia" on storage.objects;
create policy "chat exclui propria midia" on storage.objects for delete to authenticated using(
  bucket_id='chat-privado' and (storage.foldername(name))[3]=auth.uid()::text
);

create or replace function public.enviar_midia_mensagem(p_conversa_id uuid,p_grupo_id uuid,p_midia_path text)
returns bigint language plpgsql security definer set search_path=public,storage as $$
declare objeto storage.objects; tipo text; nova_id bigint; mime text; tamanho bigint;
begin
  if auth.uid() is null or ((p_conversa_id is not null)::integer+(p_grupo_id is not null)::integer)<>1 then raise exception 'Destino inválido.' using errcode='22023'; end if;
  if p_conversa_id is not null and not exists(select 1 from public.conversas where id=p_conversa_id and auth.uid() in(usuario_a,usuario_b)) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if p_grupo_id is not null and not exists(select 1 from public.grupo_membros where grupo_id=p_grupo_id and user_id=auth.uid()) then raise exception 'Sem acesso.' using errcode='42501'; end if;
  if (select count(*) from public.mensagens where remetente_id=auth.uid() and criada_em>now()-interval '1 minute')>=30 then raise exception 'Aguarde antes de enviar mais mensagens.' using errcode='42900'; end if;

  select * into objeto from storage.objects where bucket_id='chat-privado' and name=p_midia_path and owner_id=auth.uid()::text;
  if objeto.id is null then raise exception 'Arquivo inválido.' using errcode='42501'; end if;
  if p_conversa_id is not null and p_midia_path not like 'conversas/'||p_conversa_id::text||'/'||auth.uid()::text||'/%' then raise exception 'Caminho inválido.' using errcode='42501'; end if;
  if p_grupo_id is not null and p_midia_path not like 'grupos/'||p_grupo_id::text||'/'||auth.uid()::text||'/%' then raise exception 'Caminho inválido.' using errcode='42501'; end if;

  mime:=coalesce(objeto.metadata->>'mimetype',''); tamanho:=coalesce((objeto.metadata->>'size')::bigint,0);
  if mime in('image/jpeg','image/png','image/webp') then tipo:='imagem';
  elsif mime in('audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav') then tipo:='audio';
  else raise exception 'Tipo de arquivo inválido.' using errcode='22023'; end if;
  if tamanho<=0 or tamanho>15728640 or (tipo='imagem' and tamanho>10485760) then raise exception 'Arquivo muito grande.' using errcode='22023'; end if;

  insert into public.mensagens(remetente_id,conversa_id,grupo_id,texto,midia_tipo,midia_path)
  values(auth.uid(),p_conversa_id,p_grupo_id,case when tipo='imagem' then 'Foto' else 'Áudio' end,tipo,p_midia_path)
  returning id into nova_id;
  if p_conversa_id is not null then update public.conversas set atualizada_em=now() where id=p_conversa_id; end if;
  return nova_id;
end;
$$;

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
    tm.id,tm.local,tm.data_hora,count(tp.user_id)::bigint,bool_or(tp.user_id=auth.uid()),m.midia_tipo,m.midia_path
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

revoke all on function public.enviar_midia_mensagem(uuid,uuid,text),public.listar_mensagens(uuid,uuid,bigint) from public,anon;
grant execute on function public.enviar_midia_mensagem(uuid,uuid,text),public.listar_mensagens(uuid,uuid,bigint) to authenticated;
