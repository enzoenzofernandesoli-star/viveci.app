# Capas oficiais de treino

O sistema procura automaticamente por `push.webp`, `pull.webp`, `legs.webp`,
`fullbody.webp` e `cardio.webp`. Todas as artes oficiais usam 1536 × 1024. O
componente mantém a mesma proporção 3:2 e usa `object-cover`, preenchendo o
bloco inteiro sem distorção ou letterboxing.

Se um arquivo estiver ausente ou falhar durante o carregamento, a interface
volta ao fallback geométrico silencioso. Não adicionar imagens externas ou
provisórias.
