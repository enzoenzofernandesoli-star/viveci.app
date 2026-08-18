# VIVECI — ciclo de vida dos dados

Documento técnico do beta. Não substitui Política de Privacidade nem revisão jurídica.

```text
CRIAÇÃO → ARMAZENAMENTO → USO → EXPORTAÇÃO → EXCLUSÃO
```

| Dado | Armazenamento | Visibilidade | Exportação | Exclusão esperada |
|---|---|---|---|---|
| Conta e perfil completo | Supabase Auth/Postgres | próprio usuário | JSON, sem credenciais | exclusão administrativa do Auth + cascatas |
| Nome, bio e avatar | Postgres + `midia-publica` | outros autenticados | JSON + referência | arquivo + conta |
| Treino, nutrição, medidas e preferências | Postgres com RLS | próprio usuário | JSON | cascata da conta |
| Body Scan | `progresso-privado` + path no Postgres | próprio usuário por URL assinada | metadados/path no JSON | arquivo + linha ou conta |
| Post e foto social | Postgres + `midia-publica` | outros autenticados | JSON + referência | post/arquivo ou conta |
| Interações sociais | Postgres | conforme contrato social/RLS | JSON relacionado ao usuário | cascata da conta |

## Criação e uso

Dados entram pelo próprio usuário ou são calculados deterministicamente a partir do histórico. Food Scanner, Label Scanner, análise de movimento e análise de físico são demonstrações e não produzem análise real de IA.

## Exportação

O app produz JSON versionado com data, seções do próprio usuário e referências de mídia. Tokens, senhas, chaves e segredos são removidos defensivamente. Binários de foto não são incorporados.

## Exclusão

A Edge Function identifica o usuário pelo JWT, remove suas pastas nos três buckets conhecidos e então exclui `auth.users`; as FKs usam `ON DELETE CASCADE`. Storage, Auth e Postgres não compartilham uma única transação. A função falha antes do Auth se Storage falhar; se o Auth falhar depois da remoção dos arquivos, a conta e os dados estruturados permanecem e a operação pode ser tentada novamente.

O fluxo só pode ser considerado operacional depois do deploy e de um teste remoto com conta descartável. Retenção em backups e prazo de descarte dependem de decisão operacional e jurídica ainda não definida.
