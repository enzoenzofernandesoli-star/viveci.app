-- VIVECI — auditoria remota somente leitura (Etapa 33)
-- Esta consulta não cria, altera ou exclui dados.

select 'tabela:usuarios_bloqueados' as item, to_regclass('public.usuarios_bloqueados') is not null as ativo
union all select 'tabela:denuncias_social', to_regclass('public.denuncias_social') is not null
union all select 'view:perfis_publicos', to_regclass('public.perfis_publicos') is not null
union all select 'view:posts_publicos', to_regclass('public.posts_publicos') is not null
union all select 'view:posts_proprios', to_regclass('public.posts_proprios') is not null
union all select 'funcao:proteger_entitlement_perfil', to_regprocedure('public.proteger_entitlement_perfil()') is not null
union all select 'funcao:validar_limite_rotinas', to_regprocedure('public.validar_limite_rotinas()') is not null
union all select 'funcao:preparar_snapshot_treino_post', to_regprocedure('public.preparar_snapshot_treino_post()') is not null
union all select 'funcao:criar_rotina', to_regprocedure('public.criar_rotina(text)') is not null
union all select 'funcao:salvar_itens_rotina', to_regprocedure('public.salvar_itens_rotina(uuid,jsonb)') is not null
union all select 'funcao:excluir_post', to_regprocedure('public.excluir_post(uuid)') is not null
union all select 'trigger:proteger_plano', exists (
  select 1 from pg_trigger where tgname = 'proteger_entitlement_perfil' and not tgisinternal
)
union all select 'trigger:limite_free', exists (
  select 1 from pg_trigger where tgname = 'validar_limite_rotinas' and not tgisinternal
)
union all select 'trigger:snapshot_social', exists (
  select 1 from pg_trigger where tgname = 'preparar_snapshot_treino_post' and not tgisinternal
)
union all select 'indice:posts_criado_em', to_regclass('public.posts_criado_em_idx') is not null
union all select 'indice:registros_user_data', to_regclass('public.registros_user_data_idx') is not null
union all select 'indice:sessoes_finalizadas', to_regclass('public.sessoes_concluidas_user_finalizada_idx') is not null
order by item;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('midia-publica', 'progresso-privado', 'Fotos')
order by id;

select schemaname, tablename, policyname, cmd
from pg_policies
where (schemaname = 'public' and tablename in (
  'perfis', 'preferencias_usuario', 'planos', 'plano_sessoes', 'plano_itens',
  'registros', 'sessoes_concluidas', 'cardio_sessoes', 'medidas',
  'metas_nutricionais', 'diario_alimentar', 'fotos_progresso', 'posts',
  'post_likes', 'post_comments', 'seguidores', 'usuarios_bloqueados', 'denuncias_social'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Deve retornar zero linhas depois da migration 13.
select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;
