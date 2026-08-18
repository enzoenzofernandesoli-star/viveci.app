# Capas oficiais de treino

O sistema procura automaticamente por `push.webp`, `pull.webp`, `legs.webp`,
`fullbody.webp` e `cardio.webp`. Todas as artes oficiais usam 1536 × 1024. O
componente usa uma capa 5:3 com `object-cover` centralizado: o crop vertical é
curto e consistente, sem distorção ou letterboxing. Um fade escuro discreto na
base integra a fotografia ao fundo do aplicativo.

Se um arquivo estiver ausente ou falhar durante o carregamento, a interface
volta ao fallback geométrico silencioso. Não adicionar imagens externas ou
provisórias.
