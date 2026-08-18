# VIVECI — relatório de migração do Storage

Data: 18 de agosto de 2026.

## Resultado da Etapa 34

**PARCIALMENTE VALIDADO** — inventário e privacidade do Body Scan concluídos;
objetos sem referência foram preservados.

| Item | Encontrados | Migrados | Ignorados | Falhos | Removidos |
|---|---:|---:|---:|---:|---:|
| Avatar legado referenciado | 1 | 0 | 1 | 0 | 0 |
| Caminhos legados sem referência (avatar/social) | 5 | 0 | 5 | 0 | 0 |
| Body Scans legados | 0 | 0 | 0 | 0 | 0 |
| Body Scans novos privados | 3 | não se aplica | 0 | 0 | 0 |

Nenhum arquivo foi copiado, movido ou excluído. O bucket `Fotos` tinha 6 objetos
(4 paths de avatar e 2 sociais): 1 avatar ainda referenciado e 5 sem referência
inequívoca. Não havia foto corporal legada. `progresso-privado` recebeu 3 objetos
novos de teste; o proprietário os visualizou e outra conta recebeu zero linhas
tanto em `fotos_progresso` quanto em `storage.objects`.

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

1. avaliar manualmente o avatar legado referenciado sem quebrar o perfil;
2. decidir retenção dos 5 objetos sem referência antes de qualquer remoção;
3. comprovar expiração prática de uma URL assinada;
4. testar tentativa explícita de sobrescrita do path de outro usuário.
