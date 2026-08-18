# Capas oficiais de treino

O sistema procura automaticamente por `push.webp`, `pull.webp`, `legs.webp`,
`fullbody.webp` e `cardio.webp`. Todas as artes oficiais usam 1536 × 1024 e
permanecem em `object-contain`, porque possuem tipografia incorporada que não
pode ser cortada.

Se um arquivo estiver ausente ou falhar durante o carregamento, a interface
volta ao fallback geométrico silencioso. Não adicionar imagens externas ou
provisórias.
