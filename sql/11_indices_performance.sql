-- VIVECI — BLOCO 11: índices sustentados pelas consultas reais do beta
-- Aplicar depois de 10_integridade_rotinas.sql.

create index if not exists posts_criado_em_idx on posts (criado_em desc);
create index if not exists posts_user_criado_em_idx on posts (user_id, criado_em desc);
create index if not exists post_comments_post_criado_em_idx on post_comments (post_id, criado_em);
create index if not exists post_likes_post_idx on post_likes (post_id);
create index if not exists seguidores_seguido_idx on seguidores (seguido_id);
create index if not exists registros_user_data_idx on registros (user_id, data desc);
create index if not exists sessoes_concluidas_user_finalizada_idx
  on sessoes_concluidas (user_id, finalizada_em desc) where finalizada_em is not null;
create index if not exists diario_alimentar_user_data_idx on diario_alimentar (user_id, data desc);
create index if not exists fotos_progresso_user_data_idx on fotos_progresso (user_id, data desc);
