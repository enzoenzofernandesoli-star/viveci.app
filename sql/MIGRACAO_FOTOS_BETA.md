# Migração de fotos para os buckets pré-beta

`09_seguranca_beta.sql` cria `midia-publica` e `progresso-privado`. SQL não move os bytes do bucket legado `Fotos`.

## Ordem segura

1. Aplicar `09_seguranca_beta.sql`.
2. Confirmar que os dois buckets foram criados com os flags corretos.
3. Novos avatares/posts passam a usar `midia-publica`; novos Body Scans usam `progresso-privado`.
4. Registros antigos sem `storage_path` continuam usando `fotos_progresso.url` temporariamente.
5. Em ambiente administrativo, copiar cada arquivo corporal legado para `progresso-privado/<user_id>/body/...` e preencher `storage_bucket`/`storage_path` na linha correspondente.
6. Validar as fotos com uma conta de teste e confirmar que outra conta não consegue acessá-las.
7. Só depois remover os bytes corporais do bucket `Fotos` e, quando não houver mais fallback, planejar a remoção da coluna `url` em migration futura.

Não marque a migração como concluída sem mover e validar os arquivos reais.

## Inventário obrigatório antes da cópia

Registrar cada objeto do bucket `Fotos` sem expor URLs assinadas:

| Classificação | Sinal esperado | Destino |
|---|---|---|
| AVATAR | path do usuário e referência em `perfis.foto_url` | `midia-publica/<user_id>/avatar/` |
| SOCIAL | referência em `posts.foto_url`/`foto_path` | `midia-publica/<user_id>/social/` |
| BODY | referência em `fotos_progresso` | `progresso-privado/<user_id>/body/` |
| DESCONHECIDO | sem referência inequívoca | não mover nem excluir |

Antes de qualquer remoção, manter relatório com origem, destino, checksum ou
tamanho comparado, linha atualizada, teste do proprietário e teste de negação A/B.
Objetos órfãos e desconhecidos são apenas documentados nesta etapa.

## Rollback

Copiar antes de atualizar a referência. Preservar a origem até validar o destino,
a leitura do proprietário e a negação para outro usuário. Se qualquer verificação
falhar, restaurar a referência anterior e manter o objeto original. Nunca executar
remoção em lote sem backup/inventário exportado.
