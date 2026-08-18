# VIVECI — relatório de migração do Storage

Data: 18 de agosto de 2026.

## Resultado da Etapa 34

**BLOCKED** — o inventário remoto foi adiado pelo proprietário.

| Item | Encontrados | Migrados | Ignorados | Falhos | Removidos |
|---|---:|---:|---:|---:|---:|
| Avatares legados | não medido | 0 | não medido | 0 | 0 |
| Fotos sociais legadas | não medido | 0 | não medido | 0 | 0 |
| Body Scans legados | não medido | 0 | não medido | 0 | 0 |
| Desconhecidos/órfãos | não medido | 0 | não medido | 0 | 0 |

Nenhum arquivo foi copiado, movido ou excluído. Os buckets, flags e policies
remotos continuam sem comprovação A/B.

## Estado local esperado

- `midia-publica/<user_id>/avatar/`: avatar público;
- `midia-publica/<user_id>/social/`: publicação social pública;
- `progresso-privado/<user_id>/body/`: progresso corporal privado;
- `Fotos/<user_id>/...`: origem legada temporária.

Novos Body Scans persistem somente bucket/path e geram URL assinada de uma hora.
Uploads de avatar, post e Body Scan agora tentam remover o arquivo recém-enviado
quando a etapa posterior de banco/URL falha. A exclusão de post deixa de ignorar
erro ao remover a mídia.

## Evidência necessária para PASS

1. inventário remoto classificado;
2. backup/registro de recuperação;
3. cópia e verificação antes da remoção;
4. A lê Body Scan e B recebe negação;
5. A e B visualizam avatar/post público;
6. B não sobrescreve paths de A;
7. relatório preenchido com contagens reais.
