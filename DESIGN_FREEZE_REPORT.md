# VIVECI — Design Freeze Report

## Estado visual

O produto encerra este bloco com uma linguagem única: fundo profundo, Sora,
azul usado como ação, fotografia editorial com função definida e conteúdo
organizado principalmente por espaço e divisores. O redesign está congelado;
novas mudanças devem responder a problema de produto concreto.

## Etapa 17

- Classificação determinística e testada de rotinas em Push, Pull, Legs e Full Body.
- Sistema de capas oficiais preparado, com fallback geométrico sem foto falsa.
- Treinos reorganizados em composição editorial.
- Login desktop ganhou composição fotográfica; mobile preservou o formulário.

## Etapa 18

- Progresso da sessão tornou-se explícito.
- Descanso passou a dominar o fluxo e informa a próxima série.
- Formulário da série fica oculto durante o descanso.
- Recorde e pós-treino permanecem discretos, sem mudar persistência ou cálculos.

## Etapa 19

- Diário nutricional passou a usar linhas e divisores em vez de cards repetidos.
- Calorias e macros mantiveram cálculos e leitura principal.
- Scanners foram reunidos em Experimental, com aviso de demonstração e escolha
  explícita da refeição.

## Etapa 20

- Social removeu metadata duplicada e manteve mídia como protagonista.
- Treino associado virou uma leitura editorial curta.
- Body Scan identifica claramente a análise simulada.
- DNA passou a ser apresentado como leitura do histórico de treino.

## Etapa 21

- Onboarding usa uma pergunta e uma lista simples por etapa.
- Erros comuns de autenticação/rede têm mensagens humanas centralizadas.
- Quatro testes impedem vazamento de detalhe técnico desconhecido.
- Alterações paralelas existentes em Configurações foram preservadas e não
  incluídas nos commits deste bloco.

## Etapa 22

- Oito rotas auditadas em 375, 390, 430 e 1280px.
- Nenhum overflow horizontal detectado nas 32 combinações.
- Seis destinos da navegação confirmados.
- Foco visível, safe area e redução de movimento confirmados na arquitetura.
- Design System documentado e congelado.

## Assets

- `home-hero.webp`: 1024 × 1536, 110,86 kB.
- Capas `push`, `pull`, `legs`, `fullbody` e `cardio`: estrutura pronta; fotos
  oficiais ainda não fornecidas.
- 59 GIFs didáticos de exercícios preservados.

## Componentes

- Criados: `WorkoutCategoryCover` e helper puro `categoriaTreino`.
- Refinados: Login, Treinos, Sessão de Treino, Nutrição, PostCard, Body Scan,
  Perfil e Onboarding.
- Regras de negócio, Supabase, SQL, RLS, Intelligence Engine e Free/Pro não foram
  alterados neste bloco.

## Mobile

Layouts auditados nas três larguras prioritárias. Navegação permanece legível
com seis destinos, alvos principais respeitam 44px e não houve overflow.

## Desktop

Home e Login usam fotografia editorial; páginas internas mantêm largura de
leitura e espaço negativo, sem assumir aparência de painel SaaS.

## Acessibilidade

Foco global visível, controles com estado desabilitado, navegação nomeada,
imagens funcionais com texto alternativo e suporte a movimento reduzido.

## Performance

Comparação com o início do bloco:

| Recurso | Antes | Depois |
|---|---:|---:|
| JS inicial | 457,29 kB | 457,78 kB |
| JS inicial gzip | 133,06 kB | 133,29 kB |
| CSS | 51,88 kB | 52,55 kB |
| CSS gzip | 10,11 kB | 10,18 kB |
| Home Hero | 110,86 kB | 110,86 kB |

As rotas continuam em chunks lazy. O aumento inicial foi de 0,49 kB bruto e
0,23 kB gzip, sem regressão relevante.

## Testes

- 120 testes unitários passando.
- 3 testes E2E passando.
- TypeScript e build passando.
- Lint de `src` passando.
- `git diff --check` passando para os arquivos do bloco.

## Pendências visuais

- As capas oficiais de Push, Pull, Legs, Full Body e Cardio ainda não existem;
  o fallback atual é intencional.
- Sora vem do Google Fonts. Em primeiro acesso sem rede, o app usa o fallback do
  sistema; empacotar a fonte localmente eliminaria essa diferença visual.
- Não houve sessão autenticada real segura para screenshots com dados pessoais.
  A auditoria usou contexto local controlado e listas vazias, sem inventar
  treinos, métricas ou mídia.

## Próximo passo

Não iniciar outra rodada de redesign. A próxima etapa deve ser definida por
feedback de beta, métricas de uso ou um problema funcional comprovado.
