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

