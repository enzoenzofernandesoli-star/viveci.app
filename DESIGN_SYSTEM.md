# VIVECI — Design System

Estado congelado após a Etapa 22. Novas telas devem ampliar este sistema, não
reinventá-lo.

## Princípios

- Performance esportiva + diário pessoal + tecnologia + fotografia editorial.
- Cada tela tem uma ação principal óbvia e revela detalhes progressivamente.
- Espaço, tipografia e divisores vêm antes de cards.
- Dados reais orientam a interface; demonstrações são sempre identificadas.
- Mobile-first, com alvos de toque mínimos de 44px.

## Cores

Usar somente tokens de `src/index.css`: `app`, `sidebar`, `card`, `card-hover`,
`line`, `brand`, `brand-hover`, `silver`, `ink`, `ink-2`, `ink-3`, `up`,
`down`, `gold` e `muscle-off`. Não escrever hex em componentes, exceto as duas
cores auxiliares já documentadas para macros.

Azul representa ação, estado ativo, progresso importante e mapa corporal. Verde
e vermelho ficam restritos a variação numérica. Dourado é exclusivo de PR,
conquista e sequência.

## Tipografia

- Família: Sora; fallback `ui-sans-serif, system-ui, sans-serif`.
- Títulos: peso 600, tracking negativo discreto e poucas palavras.
- Texto: 14px; metadado: 12px; eyebrow: 10–12px maiúsculo.
- Números usam `.num` para algarismos tabulares.
- O wordmark VIVECI é a única aplicação com tracking muito aberto.

## Radius e superfícies

- Controle: 10px.
- Ação: 12px.
- Superfície: 14px.
- Mídia: 18px.
- Preferir fundo aberto, borda horizontal e `divide-y`.
- Cards existem apenas quando agrupam conteúdo inseparável ou elevam uma ação.
- Sem sombras pesadas, glassmorphism ou glow repetido.

## Fotografia

- Home: fotografia editorial fixa `home-hero`, sem carrossel ou troca automática.
- Login desktop: reutiliza a Home Hero com crop próprio.
- Treinos: não usa fotografia decorativa; rotinas e cardio são composições
  tipográficas orientadas à ação.
- Sessão usa GIF didático do exercício, nunca fotografia decorativa.
- Social e Body Scan usam mídia enviada pelo usuário.
- Corpo e Nutrição não recebem fotografia decorativa.

## Espaçamento

- Base de composição: 4px; intervalos usuais: 8, 12, 16, 20, 24, 32 e 40px.
- Seções maiores usam divisores e respiro, não margens arbitrariamente enormes.
- Largura de leitura é limitada por página; desktop preserva composição
  editorial e não vira dashboard SaaS.

## Movimento

- Entrada: 220ms; escala: 180ms; feedback de controle: 160ms.
- Curvas rápidas, sem elasticidade.
- Respeitar `prefers-reduced-motion` e `data-reduzir-movimento`.
- Glow `.brilho-brand` é reservado ao CTA editorial principal.

## CTAs

- Um botão primário azul por contexto.
- Ações secundárias são texto ou borda discreta.
- A ação principal usa verbo específico: Começar, Adicionar, Concluir, Publicar.
- Ações destrutivas exigem confirmação e não espalham vermelho pela tela.

## Estados

- Carregamento: indicador mínimo com `role="status"` e texto humano.
- Vazio: explicar o que falta, por que importa e qual é a próxima ação.
- Erro: nunca expor mensagem crua do Supabase; usar texto humano e permitir nova
  tentativa quando aplicável.
- Demonstração: usar rótulo visível `Experimental · Demonstração`.

## Mobile

- Validar em 375, 390 e 430px.
- Seis destinos fixos: Início, Treino, Social, Corpo, Nutrição e Perfil.
- Reservar espaço inferior para navegação e safe area.
- Inputs numéricos usam teclado apropriado; mídia usa `object-contain` ou crop
  explicitamente escolhido.
- Nenhum conteúdo pode causar overflow horizontal.
