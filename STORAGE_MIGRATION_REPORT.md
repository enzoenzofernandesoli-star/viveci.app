# VIVECI — relatório de migração do Storage

Data: 18 de agosto de 2026. Atualizado em 20 de agosto de 2026 (classificação
confirmada dos 5 objetos sem referência e expiração de URL assinada).

## Resultado da Etapa 34

**PARCIALMENTE VALIDADO** — inventário e privacidade do Body Scan concluídos;
objetos sem referência foram preservados. Atualização de 20/08/2026:
classificação dos 5 objetos confirmada sem ambiguidade (ver seção abaixo) e
expiração de URL assinada comprovada — só falta decisão de retenção/exclusão
do proprietário, que é operacional (P2), não mais uma pendência técnica.

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

## Classificação confirmada dos 5 objetos sem referência (20/08/2026)

Consulta direta a `storage.objects`, `perfis.foto_url` e `posts.foto_path`
(acesso administrativo, sem RLS) confirma, sem ambiguidade, que nenhum dos 5
está referenciado em lugar nenhum do banco atual — todos foram superados pela
migração pra `midia-publica`/`progresso-privado`:

| Objeto | Tamanho | Status |
|---|---:|---|
| `<dono A>/avatar.png` | 108 B | órfão — placeholder de teste, não referenciado |
| `<dono B>/avatar.jpeg` | 52 KB | órfão — avatar antigo, superado por `midia-publica/.../avatar/` |
| `<dono B>/avatar.png` | 1,7 MB | órfão — avatar antigo, superado |
| `<dono B>/social/*.png` (2 objetos) | 1,7 MB cada | órfãos — fotos de post antigas, nenhum post atual referencia esses paths |

Nenhum arquivo foi removido — a exclusão continua exigindo autorização
explícita do proprietário do produto, mesmo com a classificação confirmada.

## Evidência necessária para PASS

1. avaliar manualmente o avatar legado referenciado sem quebrar o perfil;
2. ~~decidir retenção dos 5 objetos sem referência antes de qualquer remoção~~ —
   classificação confirmada acima (20/08/2026); decisão de exclusão em si
   continua pendente de autorização explícita do proprietário.
3. ~~comprovar expiração prática de uma URL assinada~~ — PASS: confirmado em
   19/08/2026, ver `SUPABASE_SECURITY_VALIDATION.md`.
4. ~~testar tentativa explícita de sobrescrita do path de outro usuário~~ —
   PASS: A foi bloqueado por RLS com `42501` ao tentar inserir no path privado de B.
