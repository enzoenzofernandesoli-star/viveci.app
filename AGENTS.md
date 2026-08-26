# Viveci — guia do projeto

App de treino e nutrição personalizados, em português do Brasil. Web app + PWA
instalável.
Este arquivo é a fonte da verdade. Leia antes de escrever qualquer código.

**Antes de codar qualquer coisa nova**, rode `git log --oneline` pra ver o
histórico real do projeto — o app já passou por uma reformulação grande (saiu
o gerador automático de treino, entrou o construtor manual de rotinas) e o
`git log` conta essa história melhor que qualquer resumo.

---

## O conceito

O usuário faz um onboarding curto (dados físicos + objetivo), monta as
próprias rotinas de treino escolhendo os exercícios um a um, registra carga
série a série ao treinar, ilumina no mapa corporal os músculos treinados,
registra o que come com cálculo automático de calorias, e acompanha a
evolução (peso, cargas, consistência). Por cima disso, o **VIVECI
Intelligence Engine** (`src/lib/vivici.ts`) cruza esse histórico real e
recomenda qual rotina treinar hoje, com o motivo — sem inventar treino novo.

```
PERFIL → ROTINA (montada pelo usuário) → SESSÃO DE TREINO → REGISTRO DE CARGA
→ MAPA CORPORAL → NUTRIÇÃO (diário + meta) → EVOLUÇÃO
                  ↑
     VIVECI INTELLIGENCE ENGINE (recomendação, DNA, PR, Daily Score)
```

Não existe plano automático de 12 semanas nem gerador de treino por
algoritmo — isso foi removido a pedido do usuário e continua removido. O
motor de recomendação **não gera rotina nenhuma**: ele só escolhe, entre as
rotinas que o próprio usuário já montou, qual faz mais sentido treinar hoje
(regra determinística sobre dias sem estímulo e volume recente) — a
diferença é sutil mas importante pra não reintroduzir o que foi tirado.
Cada rotina continua sendo criada e editada manualmente, sem limite de
tempo ou de semanas.

---

## Regras inegociáveis

1. **Nada de código morto.** Nenhum arquivo, componente, dependência ou tela que
   não seja usado. Se algo deixou de ser necessário, apague.
2. **Um passo por vez.** Cada etapa tem que compilar, passar nos testes e rodar
   antes da próxima começar.
3. **Toda tela tem** estado vazio, estado de carregamento e tratamento de erro.
4. **Todo texto visível em português do Brasil.** Números com vírgula decimal
   (`75,2 kg`).
5. **Regra de negócio é função pura e testada**, nunca lógica solta dentro de
   componente. Cálculo de metas, mapa corporal, progressão de carga, ritmo de
   cardio, consistência/streak, PRs, DNA de treino, recomendação de treino,
   treino express e Daily Score vivem em `src/lib/` com teste ao lado
   (`*.test.ts`) — `vivici.ts` é a única exceção (é a camada de I/O que
   junta tudo, não tem lógica de negócio própria pra testar).
6. **Nunca prometer resultado**, nunca usar linguagem de culpa, nunca tratar
   biotipo como diagnóstico.
7. Mobile-first. Testar a 375px. Alvos de toque de no mínimo 44px.
8. **Sem git não tem como desfazer.** O projeto tem `git init` feito — sempre
   commitar antes de uma mudança grande/destrutiva, pra ter ponto de volta.

---

## Design system

Tokens em `src/index.css`, dentro do bloco `@theme` do Tailwind v4.
Use sempre a classe do token (`bg-card`, `text-ink-2`, `border-line`), nunca o
hex solto no componente.

| Token | Valor | Uso |
|---|---|---|
| `app` | `#070A10` | fundo geral — preto azulado profundo |
| `sidebar` | `#080B12` | barra lateral e barra inferior |
| `card` | `#0D111A` | cards e painéis |
| `card-hover` | `#131826` | hover e superfícies elevadas |
| `line` | `#202735` | bordas de 1px |
| `brand` | `#0066FF` | **única cor de ação** |
| `brand-hover` | `#0052CC` | hover do botão primário |
| `silver` | `#BFC3CA` | acento decorativo premium (gráficos, ícones em destaque) — nunca em botão/ação |
| `ink` | `#F4F5F7` | texto principal (quase branco, não branco puro) |
| `ink-2` | `#7E8795` | labels e legendas |
| `ink-3` | `#545B68` | estados inativos |
| `up` / `down` | `#22C55E` / `#EF4444` | **só** em variação numérica |
| `gold` | `#F5A524` | só conquista, troféu e streak |
| `muscle-off` | `#3A4252` | músculo não treinado no mapa |

Paleta reformulada (2026-08-18) pra uma identidade mais "premium/masculino/
tecnológico" (pedido explícito do usuário, referência: Apple Fitness+ +
Garmin + Nike Training Club). Trocar valor de token é sempre feito só em
`src/index.css` — nunca hex solto no componente — e propaga pro app inteiro
automaticamente por causa da arquitetura de tokens.

**Tipografia:** Sora. H1 28px/700. Título de card 17px/600. Número de destaque
44px/700 com a classe `.num` (tabular-nums). Texto 14px. Label 12px maiúscula
com tracking 0.06em em `ink-2`. No logotipo/wordmark "VIVECI", usar letter
spacing largo (`tracking-widest` ou maior) — é a única exceção ao texto
compacto do resto do app.

**Logo oficial:** fonte preservada em
`src/assets/viveci/brand/logo-oficial.jpg`. Os ícones instaláveis derivados
ficam em `public/icons/` (180, 192 e 512px, incluindo maskable). Não substituir
por símbolo genérico nem redesenhar sem pedido explícito do dono do produto.

**Card:** `bg-card`, borda 1px `line`, radius 16px, padding 24px, **sem sombra**.
**Botão primário:** `bg-brand`, texto branco 600, radius 12px, altura 48px.
**Chip ativo:** fundo azul translúcido + texto `brand`. Inativo: borda `line` + `ink-2`.

**Glow azul (`.brilho-brand` em `src/index.css`):** `box-shadow` sutil,
reservado só pro CTA principal da Home ("Começar treino" dentro do card de
recomendação) e pro botão flutuante de Treino Rápido na navegação — nunca em
cards comuns nem em todo botão `bg-brand`. Isso é a única exceção à regra
"sem sombra"; usar com moderação é o que faz parecer premium, exagerar faz
parecer genérico.

**Proibido:** gradiente colorido, sombra pesada, emoji como ícone de interface,
mais de uma cor de ação por tela. Ícones: `lucide-react`, `strokeWidth={1.75}`.

**Exceção única:** as três barras de macro do diário alimentar usam
Proteína `#0066FF` (= `brand`), Carboidrato `#8B5CF6`, Gordura `#F5A524` —
três barras iguais seriam ilegíveis.

---

## Onde as coisas ficam

```
src/
  lib/          regra de negócio pura + testes (*.test.ts ao lado) + camadas de I/O com o Supabase
  lib/services/ serviços de IA de visão — hoje só mock declarado (ver seção "IA de visão")
  data/         catálogos estáticos que espelham tabelas do Supabase (exercícios, alimentos)
  components/   componentes reutilizáveis
  pages/        uma por rota
```

`npm test` roda os testes com o runner nativo do Node (sem vitest, sem jest).
Arquivos de teste (`*.test.ts`) só importam módulos **puros** (sem `import.meta.env`,
sem o client do Supabase) — por isso a lógica de negócio fica separada da
camada de I/O em arquivos próprios (ex: `progressaoCarga.ts` puro vs `registros.ts` com I/O).

**Navegação:** 5 abas fixas — Início, Treino, Social, Nutrição, Perfil (`src/lib/nav.ts`,
compartilhado entre `Sidebar.tsx` e `BottomNav.tsx`) — mais um botão redondo
flutuante no meio da barra inferior que abre o Treino Rápido (`/treino/rapido`).
Na barra inferior o botão fica entre a 3ª e a 4ª aba (grupo esquerdo com
3 itens, direito com 2 — `BottomNav.tsx` desestrutura `NAV` manualmente,
cuidado ao adicionar/remover item). Planos não tem aba própria (acessível a
partir do Perfil e de telas de bloqueio). Evolução não é mais rota — é a 2ª
aba dentro da própria página de Perfil (a 1ª é Treinos). Food Scanner e
Label Scanner não são rotas — abrem como view cheia de dentro de Nutrição
(ícone de câmera em cada refeição). Body Scan (`/perfil/body-scan`),
Configurações (`/perfil/configuracoes`), Analisar movimento
(`/treino/analisar/:id`) e Perfil público (`/social/usuario/:id`) são rotas
próprias sem aba própria na navegação inferior.

**Dependência externa de UI:** `body-muscles` (npm) — biblioteca do mapa
corporal (SVG anatômico com 89 regiões). Ver seção "Mapa corporal" abaixo
pra entender por que as cores dela são sobrescritas na mão.

**VIVECI Intelligence Engine:** `src/lib/vivici.ts` é o hook central
(`useVivici`) que busca registros/sessões do usuário uma vez e alimenta
todos os módulos de inteligência (`dnaTreino.ts`, `recomendacaoTreino.ts`,
`recordesPessoais.ts`, `treinoExpress.ts`, `dailyScore.ts`, mais
`detectarMusculoNegligenciado` em `mapaCorporal.ts`) — usado no Dashboard
(recomendação + Daily Score + PRs + músculo negligenciado) e na aba
Evolução do Perfil (DNA de treino). Cada módulo é função pura testada; o
`vivici.ts` só faz o fetch e a costura entre eles.

---

## Estado atual

Praticamente tudo abaixo está implementado, testado e passou por teste manual
no navegador. Rode `npm test` (deve passar 100%) e `npm run build` antes de
qualquer entrega.

- **Auth** — email/senha via Supabase (`src/lib/auth.ts`). Cadastro envia a
  origem atual em `emailRedirectTo`; o template visual de confirmação fica em
  `supabase/email-templates/confirmacao-cadastro.html` e precisa ser aplicado
  no painel conforme `docs/EMAIL_CONFIRMACAO_SUPABASE.md`.
- **Onboarding** — 6 passos: nome, sexo, idade, altura/peso, objetivo, dias/semana.
  Idade mínima de 18 anos, sem limite máximo; regra pura em
  `src/lib/elegibilidade.ts` e proteção correspondente no banco.
- **Rotinas de treino (manual)** — usuário cria, nomeia, adiciona/remove
  exercícios pelo catálogo, edita e exclui. Sem geração automática.
- **Sessão de treino** — cronômetro total no topo, carrossel de bolinhas pra
  trocar de exercício livremente, tabela de séries (peso/reps/check), descanso
  editável por exercício (persiste), sugestão de carga baseada no histórico.
- **Treino rápido** — sessão avulsa sem rotina salva, exercícios adicionados
  na hora; fica só no histórico.
- **Cardio** — aba dentro de Treino: equipamento, duração, distância, ritmo
  calculado (min/km).
- **Biblioteca de exercícios** — não é mais tela própria; vive como o
  componente `SeletorExercicio`, usado dentro do editor de rotina e do treino
  rápido. Cada um dos 59 exercícios tem um GIF de demonstração real
  (`public/exercicios/<id>.gif`) — mostrado no seletor, na lista da rotina e
  em destaque na sessão de treino.
- **Nutrição** — diário alimentar real (busca no catálogo com cálculo
  automático de kcal/macros por quantidade, ou entrada rápida manual), meta de
  calorias calculada automaticamente e **editável manualmente** (mantém
  proteína/gordura, recalcula carboidrato como resto).
- **Mapa corporal** — corpo anatômico real via `body-muscles`, frente/costas,
  cores por intensidade real dos últimos 7 dias, alerta de desequilíbrio.
  Clicar num músculo (SVG ou legenda) abre painel com treinos/séries/volume/
  último estímulo dos últimos 30 dias. A tela Corpo também calcula um rank
  semanal pela média dos 10 grupos, mostra um brasão VIVECI e exporta rank +
  estatísticas + mapa como PNG de fundo transparente.
- **Dashboard** — dados reais: recomendação "O que eu treino hoje?" (com
  motivo), Daily Score, nutrição do dia, alerta de PR recente, alerta de
  músculo negligenciado, mapa corporal.
- **Treino Express** — dentro de Treino, botão "Treino express" em cada
  rotina abre um seletor de duração (15 a 90 min) que reconstrói a sessão
  pra caber no tempo (reduz/remove isolados antes de tocar em compostos),
  com aviso do quanto foi cortado.
- **Novo PR** — ao bater recorde numa série (1RM estimado por Epley maior
  que o anterior), banner dourado aparece na sessão de treino.
- **Perfil** — avatar (upload pro bucket `Fotos`), nome e biografia editáveis,
  3 números reais (treinos concluídos / rotinas criadas / sequência de dias),
  link pra **Configurações**, e 2 abas: **Treinos** (histórico de sessões
  concluídas) e **Evolução** (DNA de treino, peso com gráfico, consistência
  7/30 dias, cargas por exercício com gráfico).
- **Configurações** (`/perfil/configuracoes`) — menu de categorias dentro do
  Perfil: Perfil (objetivo/nível/dias por semana), Notificações,
  Treinamento (duração/horário/dias/equipamentos preferidos), Nutrição
  (o que mostrar no diário), Aparência (animações — tema é só escuro por
  enquanto), Privacidade (excluir fotos; excluir dados/conta é só
  instrução de contato, não é automatizado), Meus dados (exportação real
  em JSON), Aplicativo (versão, limpar cache) e Sobre.
- **Planos** — só `free` e `pro`. Único bloqueio ativo hoje: free trava em 4
  rotinas de treino. Pro ainda não tem nenhum recurso exclusivo de verdade —
  isso é intencional, só entra quando o dono do produto decidir o quê.
- **PWA** — manifest, ícones, service worker (offline básico); a interface
  bloqueia zoom por pinça/duplo toque e mantém apenas o scroll vertical.
- **Food Scanner** (câmera na Nutrição) — identifica alimentos numa foto do
  prato, estima kcal/macros/fibra por item, permite ajustar quantidade
  (Pouco/Médio/Muito) e adiciona ao diário de verdade. **Análise é
  simulada** (mock declarado) — não há IA de visão conectada.
- **Label Scanner** (câmera na Nutrição) — lê a tabela nutricional de um
  rótulo, explica os números em linguagem simples, calcula quantas porções
  a pessoa realmente comeu (matemática real) e adiciona ao diário.
  **Leitura do rótulo é simulada** — sem OCR conectado.
- **Body Scan** (`/perfil/body-scan`) — fotos de progresso reais (frente/
  lateral/costas) sobem pro bucket `Fotos` e ficam em `fotos_progresso`;
  timeline filtrável por 7/30/90 dias; comparação lado a lado entre duas
  datas do mesmo ângulo, com contagem real de treinos no período.
  **Analisar meu físico** — fluxo de instruções + foto + pontuação
  (Overall/Potencial/Definição/Simetria/V-Taper/Massa muscular) inspirado
  no Symmetry, mas **simulado e declarado**: sem IA de análise corporal
  conectada, a pontuação é sempre a mesma e vem com aviso visível.
- **Analisar movimento** (botão na sessão de treino) — grava/envia vídeo do
  exercício. **100% simulado**: sempre devolve a mesma mensagem avisando
  que a análise real ainda não está conectada, nunca finge diagnóstico.
- **VIVECI Social** (`/social`) — núcleo real (sem mock): feed Amigos/Descobrir,
  publicar foto + legenda + treino real anexado (com controle de quais dados
  aparecem), curtir, comentar, seguir, perfil público, card "Desafio inicial"
  com progresso calculado de verdade. **Sem vídeo, XP/rankings, notificações,
  desafios além do inicial, moderação ou tempo real** — ver seção própria
  abaixo pra escopo completo do que ficou de fora do MVP.

**Não existe (e não tem ordem definida pra construir):** Desafio 24 Dias,
receitas, IA de dieta personalizada, vídeo/Stories no Social, XP e rankings,
notificações sociais, desafios além do "Desafio inicial", moderação/denúncia,
contas privadas. Não construir nenhum desses sem pedido explícito.

---

## Regras de negócio

### Meta calórica — `src/lib/metas.ts`

Mifflin-St Jeor → fator de atividade → ajuste por objetivo → pisos de segurança
→ proteína → gordura → carboidrato como resto.

Fator de atividade por dias/semana: 0–1 → 1,2 · 2 → 1,375 · 3–4 → 1,55 ·
5 → 1,725 · 6+ → 1,9.

Ajuste por objetivo: emagrecer ×0,80 · definir ×0,90 · condicionamento ×1 ·
força ×1,10 · ganhar massa ×1,15.

**Pisos obrigatórios:** nunca abaixo de `TMB × 1,1`, nem de 1.500 kcal (homem)
ou 1.200 kcal (mulher). Quando o piso agir, `meta_limitada = true` e a meta é
arredondada **para cima**.

Proteína g/kg: emagrecer 2,2 · definir 2,2 · ganhar massa 1,9 · força 2,0 ·
condicionamento 1,6. Gordura: `max(meta×0,25/9 ; peso×0,8)`. Carboidrato: o resto.
Gramas em múltiplos de 5, calorias em múltiplos de 10.

**Caso de referência (é teste):** homem, 28a, 178cm, 75,2kg, 5 dias, ganhar massa
→ **3.430 kcal · P 145g · C 500g · G 95g**.

**Meta manual** (`aplicarMetaManual`): usuário pode sobrescrever a meta de
calorias direto na tela de Nutrição. Mantém proteína e gordura fixas,
recalcula só o carboidrato como resto — mesma regra do cálculo automático.
Fica salva em `metas_nutricionais` (mantém histórico, a mais recente com
`ativa = true` vale).

### Rotinas de treino (manual) — `src/lib/rotinas.ts`

Sem gerador automático. O usuário cria a rotina (nome), adiciona exercícios
pelo `SeletorExercicio` (busca + filtro por grupo muscular), reordena não é
suportado ainda. Cada rotina vira 1 linha em `planos` + 1 linha em
`plano_sessoes` (estrutura antiga reaproveitada, sem semana/progressão) +
N linhas em `plano_itens`.

Todo item novo entra com padrão `series: 3, reps_min: 8, reps_max: 12,
descanso_seg: 90` — editável durante a própria sessão de treino (o descanso
persiste de volta em `plano_itens`; peso/reps são por série, registrados em
`registros`).

**Limite do plano Free:** até 4 rotinas (`limiteRotinasAtingido` em
`src/lib/planos.ts`). Pro não tem limite. Bloqueio sempre **visível**, nunca
some silenciosamente — mostra cadeado + CTA único `Ver planos`.

### Sessão de treino — `src/pages/SessaoTreino.tsx`

Cronômetro total desde o início, sempre visível. Circulo de exercícios no
topo permite pular pra qualquer um a qualquer momento (sem ordem forçada).
Cada série tem peso/reps editáveis até marcar como feita (check verde, trava
depois). Ao marcar, entra num descanso mostrado inline (não tela cheia) com
botão "Pular".

Funciona em dois modos, mesmo componente:
- **A partir de uma rotina** (`/treino/:id/sessao`) — exercícios pré-carregados,
  grava em `registros`/`sessoes_concluidas` com `sessao_id` da rotina.
- **Treino rápido** (`/treino/rapido`) — começa vazio, `sessao_id = null`,
  usuário monta na hora.

**Cuidado com StrictMode:** o `useEffect` que chama `iniciarSessao` roda duas
vezes em desenvolvimento por causa do StrictMode do React. Use uma ref-trava
(`sessaoIniciada`) pra não criar duas linhas em `sessoes_concluidas` — já
apareceu esse bug uma vez, não reintroduzir.

### Progressão de carga — `src/lib/progressaoCarga.ts`

Pré-preencher peso e reps com o último registro. Se o usuário completou todas as
reps, sugerir +2,5% em membro superior e +5% em inferior. Mostrar sempre
`Última vez: 80 kg × 10`. Arredonda pro meio quilo mais próximo.

### Cardio — `src/lib/cardio.ts`, `src/lib/ritmo.ts`

Aba própria dentro de Treino (não misturar com rotinas de força). Registro:
equipamento (Esteira, Bicicleta, Elíptico, Escada, Remo, Bike spinning — lista
fixa, pode crescer), duração em minutos (obrigatório), distância em km
(opcional). Ritmo (`calcularRitmo`) só aparece quando tem distância:
`duracao_min / distancia_km`, formatado como `min:seg`.

### Mapa corporal — `src/lib/mapaCorporal.ts`, `src/components/MapaCorporal.tsx`

```
volume_grupo = Σ (séries × reps × peso) dos últimos 7 dias
percentual   = round(volume_grupo / maior_volume × 100)
```
Exercício composto: 70% ao grupo primário, 30% dividido entre os secundários.
Grupo em `muscle-off` quando não treinado; em `brand` com opacidade de 0,35 a 1
conforme a intensidade. Alerta de desequilíbrio quando um grupo passa 25 pontos
do antagonista (Peito↔Costas, Bíceps↔Tríceps, Quadríceps↔Posterior).
**Os percentuais vêm do histórico real — nunca valores fixos.**

O corpo em si é renderizado pela lib `body-muscles` (40 regiões anatômicas
por vista, frente/costas — nem todas são "músculo" de verdade: cabeça, mão,
pé, joelho e cotovelo entram na mesma lista, só ficam neutras por não terem
grupo em `ID_PARA_GRUPO`). Ela colore por gradiente amarelo→vermelho por
padrão, o que **fere a regra de "proibido gradiente colorido"** — por isso
`MapaCorporal.tsx` repinta cada `path` na mão (`muscle-off`/`brand` +
opacidade) logo depois de todo `chart.update()`. **Cuidado com hover:** a
lib pinta a própria cor de hover *depois* de disparar `onMuscleHover`, então
o repaint customizado precisa rodar num `setTimeout(0)` senão a cor da lib
vaza de volta — já foi bug, não reintroduzir.

**Clicar num músculo** (path do SVG ou linha da legenda abaixo do corpo)
seleciona o grupo e abre um painel com treinos/séries/volume/último estímulo
dos últimos 30 dias (`calcularEstatisticasPorGrupo` em `mapaCorporal.ts`,
alimentado por `vivici.ts`). Clicar de novo no mesmo grupo fecha o painel.
Regiões sem grupo (cabeça, mão...) não são clicáveis (`cursor: default`,
sem `onclick`). A lib expõe cada `path` com `role="button"` e
`aria-label` com o nome em inglês — isso é só acessibilidade da lib, o
clique físico no elemento é o que dispara nossa seleção, não o texto.

**Rank corporal semanal** (`src/lib/rankCorporal.ts`) — média aritmética dos
percentuais dos 10 grupos do mapa. Faixas: Ferro 0, Bronze 15, Prata 30,
Ouro 45, Platina 60, Diamante 72, Ascendente 82, Imortal 90 e Radiante 97.
Os nomes seguem a hierarquia competitiva pedida pelo dono do produto, mas os
brasões são desenhos originais do VIVECI (`src/components/RankCorporal.tsx`),
sem copiar símbolos de outro jogo. A exportação em
`src/lib/exportarResumoCorporal.ts` gera PNG vertical 1080×1920, próprio para
Stories e com transparência real. O arquivo mostra somente a marca VIVECI
pequena, o brasão/nome do rank e o corpo iluminado, para ser sobreposto a uma
foto escolhida fora do app — não adicionar estatísticas ao PNG.

### Diário alimentar — `src/lib/diario.ts`, `src/lib/alimentos.ts`

Anel: azul até 99% · verde `up` de 100 a 110% · âmbar `gold` acima, com arco de
excedente. **Nunca vermelho** — passar da meta não é falha.
Registro por busca no catálogo (`ALIMENTOS`, calcula kcal/macros pela
quantidade em gramas) ou entrada rápida (nome + kcal + proteína, pra reduzir
atrito). Refeições principais sempre visíveis (Café da manhã, Almoço, Lanche
da tarde, Jantar); as demais só aparecem se tiverem item.

**Ainda não construído:** registro por receita, refeição salva, botão "Copiar
dia", trava de dia futuro.

### Perfil — `src/pages/Perfil.tsx`, `src/lib/historicoTreinos.ts`

Avatar sobe pro bucket `Fotos` em `<user_id>/avatar.<ext>` (sobrescreve, `upsert:
true`) e salva a URL em `perfis.foto_url`. Nome e `bio` (coluna `perfis.bio`)
editáveis num formulário inline (sem navegar pra outra tela).

**Sequência (streak)** — `calcularStreak` em `src/lib/consistencia.ts`: conta
dias seguidos com pelo menos 1 treino concluído, terminando hoje. Se o usuário
ainda não treinou hoje mas treinou ontem, a sequência **não zera** — só quebra
de verdade quando passa um dia inteiro sem nenhum treino.

A aba "Treinos" busca o histórico via `useHistoricoTreinos`, que junta
`sessoes_concluidas` → `plano_sessoes` → `planos` pra achar o nome da rotina;
sessão sem `sessao_id` (treino rápido) ou com rotina já excluída mostra
"Treino rápido" / "Rotina" como *fallback*, não quebra.

### Exercícios: GIFs de demonstração — `public/exercicios/`

Os 59 exercícios têm GIF real (fonte: dataset público
`hasaneyldrm/exercises-dataset`, 1.324 exercícios — casado manualmente nome a
nome com o catálogo em português). Os arquivos ficam em `public/exercicios/
<id>.gif`, referenciados pelo campo `gif` em `Exercicio`
(`src/data/exercicios.ts`). A pasta `videos/` na raiz (matéria-prima com os
1.324 GIFs originais) está no `.gitignore` — não é usada pelo app, só serviu
de fonte pra escolher os 59. Se precisar trocar ou adicionar um GIF, o
material bruto está lá.

### VIVECI Intelligence Engine — `src/lib/vivici.ts`

Hook `useVivici(userId, rotinas, diasSemanaMeta, caloriasHoje, metaCalorias)`
busca registros dos últimos 90 dias + sessões concluídas uma única vez e
calcula tudo abaixo. Nada aqui é IA — são regras determinísticas sobre
dados reais; sem dado suficiente, o indicador fica zerado/neutro, nunca
inventado. **Limitação conhecida:** PR e DNA só enxergam os últimos 90 dias
de `registros` (a janela do fetch) — um recorde batido há mais de 90 dias
não entra na comparação. Aceitável pro estágio atual do produto.

**Recomendação "O que eu treino hoje?"** (`recomendacaoTreino.ts`) — escolhe
qual rotina do usuário treinar, nunca gera rotina nova. Prioridade: rotina
nunca treinada → rotina há mais dias sem estímulo → em empate, grupos com
menor volume relativo (via `mapaCorporal.ts`). Rotina já treinada hoje só
volta a ser sugerida se for a única que existe. Sempre vem com `motivos`
explicáveis, mostrados na Home.

**Recordes pessoais (PR)** — `src/lib/recordesPessoais.ts`. 1RM estimado
por Epley (`peso × (1 + reps/30)`); PR é quando o 1RM da série bate o
melhor 1RM anterior do exercício. O primeiro registro de um exercício
nunca conta como PR (não tem o que superar). Banner na sessão de treino;
lista de PRs recentes (7 dias) no Dashboard.

**DNA de treino** — `src/lib/dnaTreino.ts`. Seis indicadores 0-100: força
(variação do 1RM em 90 dias), hipertrofia (% de séries na faixa 8-12 reps),
consistência (sessões/30d ÷ meta mensal), volume (séries/30d ÷ meta de
séries), progressão (% de exercícios com PR nos últimos 30 dias),
equilíbrio (menor % de volume relativo entre os grupos treinados). Mostrado
na aba Evolução do Perfil.

**Treino Express** — `src/lib/treinoExpress.ts`. Reconstrói a lista de
exercícios de uma rotina pra caber num tempo disponível: reduz séries de
isolados primeiro (mínimo 2), depois remove isolados do fim pra começo, só
depois toca em compostos, e nunca fica com zero exercícios. Acionado pelo
botão "Treino express" em cada rotina (`/treino/:id/sessao?minutos=N`).

**Daily Score** — `src/lib/dailyScore.ts`. Indicador interno do dia (**não
é nota de saúde**), média de 4 indicadores 0-100: treino (cai 15 pontos por
dia sem treinar), alimentação (% da meta calórica já registrada hoje),
consistência (sessões/7d ÷ meta semanal), evolução (sessões/30d ÷ meta
mensal).

**Músculo negligenciado** — `detectarMusculoNegligenciado` em
`mapaCorporal.ts`. Aponta o grupo treinado com menor volume relativo ao
mais treinado, só quando a diferença passa 30 pontos (evita ruído). Não
confundir com `detectarDesequilibrios`, que é especificamente sobre pares
antagonistas (Peito↔Costas etc).

### IA de visão (mock declarado) — `src/lib/services/`

Food Scanner, Label Scanner, Análise de movimento e a pontuação do Body Scan
dependem de IA de visão computacional / OCR real, que este projeto **não
tem configurada**. Em vez de fingir, cada um segue o padrão UI → Service →
dado mock, igual à seção 33 do prompt original:

- `src/lib/services/foodScannerService.ts` — `FoodScannerService.analisarFoto`
  sempre devolve o mesmo prato de exemplo (frango, arroz, feijão, salada)
  com confiança de 78%. Usado por `src/components/EscanearRefeicao.tsx`.
- `src/lib/services/labelScannerService.ts` — `LabelScannerService.escanearRotulo`
  sempre devolve o mesmo rótulo de exemplo. Usado por
  `src/components/EscanearRotulo.tsx`.
- `src/lib/services/movementAnalysisService.ts` — sempre devolve a mesma
  mensagem avisando que é simulação, nunca finge diagnóstico. Usado por
  `src/pages/AnalisarMovimento.tsx`.
- `src/lib/services/physiqueScoreService.ts` — `PhysiqueScoreService.analisarFisico`
  sempre devolve a mesma pontuação de exemplo (Overall 74 e demais
  indicadores fixos). Usado por `src/components/AnalisarFisico.tsx`.

**Regra pra quando plugar uma API de verdade:** trocar só a implementação
dentro do arquivo do serviço (a interface já está pronta) — nunca a UI que
consome. Toda tela que usa esses serviços mostra um aviso visível
("Simulação — ..." em `gold`) enquanto o resultado for mockado; isso não é
opcional, é o que impede o usuário de confiar num número inventado.

O que **é** real nesses fluxos, mesmo com o mock: os cálculos em cima do
resultado. `src/lib/analiseRefeicao.ts` (ajuste de quantidade Pouco/Médio/
Muito, heurística "como posso melhorar" por proteína/fibra) e
`src/lib/analiseRotulo.ts` (explicador de rótulo em linguagem simples,
`calcularConsumoPorPorcao` — matemática real de porções) são funções puras
testadas, e o botão "Adicionar ao diário" grava de verdade em
`diario_alimentar` via `src/lib/diario.ts`. Só a etapa de "olhar a foto e
identificar o que tem nela" é simulada.

### Body Scan — `src/pages/BodyScan.tsx`, `src/lib/bodyScan.ts`

A parte de fotos/timeline/comparação **não tem mock** — é 100% real e
determinística. Reaproveita a tabela `fotos_progresso` que já existia desde
`sql/01_estrutura.sql` (nunca usada até agora) e o bucket `Fotos` (mesmo
bucket do avatar), caminho `<user_id>/body/<angulo>-<timestamp>.<ext>`.
Três ângulos fixos: Frente, Lateral, Costas (`ANGULOS` em `bodyScan.ts`).
A comparação entre duas datas mostra as fotos lado a lado e a contagem real
de treinos concluídos no período (via `useHistoricoTreinos`).

**Analisar meu físico** (`src/components/AnalisarFisico.tsx`) — fluxo
inspirado no app Symmetry (carrossel de instruções → foto → pontuação),
pedido explicitamente pelo dono do produto pra imitar esse visual. A
pontuação (`src/lib/services/physiqueScoreService.ts`) é **mock
declarado**, igual Food/Label Scanner: sempre devolve o mesmo conjunto de
números (Overall 74, Potencial 82 etc.), nunca varia com a foto enviada, e
a tela mostra aviso dourado de simulação — nunca remover isso. A foto pode
ser salva de verdade como registro de progresso (mesmo fluxo de
`enviarFotoProgresso`), mas a pontuação em si **não é persistida em lugar
nenhum**, porque não tem valor analítico real. Não inventar proporção
corporal fora desse fluxo declarado — regra 22 do prompt original.

### Configurações — `src/pages/Configuracoes.tsx`, `src/lib/preferencias.ts`

Dentro do Perfil (`/perfil/configuracoes`), não é rota própria da navegação
inferior. Objetivo/nível/dias por semana editam direto `perfis` (reusa
`atualizarPerfil`); o resto (duração/horário/dias preferidos, equipamentos,
notificações, aparência, nutrição) vive na tabela nova
`preferencias_usuario` (uma linha por usuário, criada só quando o usuário
salva algo pela primeira vez — até lá a UI usa `PREFERENCIAS_PADRAO`).

Tema é só escuro por enquanto — a opção existe na UI mas não tem tema claro
construído (fere a regra 41 do prompt original: não fingir funcionalidade
que não existe). Excluir dados/conta não é automatizado — o app não tem
acesso de service role pra apagar `auth.users` com segurança, então o botão
só explica que é preciso contatar o suporte. Exportar dados é real: baixa
um JSON com perfil, rotinas, registros, sessões, medidas, diário e cardio
do próprio usuário.

### VIVECI Social — `src/pages/Social.tsx`, `src/lib/social/`

Pedido explícito do dono do produto (o AGENTS.md antes dizia pra não
construir sistema social sem pedido explícito — isso mudou aqui). Escopo
combinado com o usuário: núcleo real primeiro (feed, posts, curtidas,
comentários, seguir, perfil público, desafio inicial), **sem** vídeo,
XP/rankings, notificações, desafios além do inicial, moderação/denúncia ou
tempo real — essas partes do prompt original (seções 28-33, 38-43, 48,
65-73 do prompt master) não foram implementadas ainda.

**Sem conta privada nessa primeira versão** — qualquer usuário autenticado
lê qualquer post/comentário/curtida/perfil (RLS só restringe *escrita* ao
dono, ver `sql/08_social.sql`). A tabela `perfis` só tinha a policy "dono"
(restringia leitura ao próprio usuário) — teve que ganhar uma policy nova
de leitura pública, senão o feed não conseguia mostrar nome/foto de outros
autores.

**`src/lib/social/posts.ts`** monta a lista de posts em lote (sem N+1):
busca os posts, depois busca autores/curtidas/comentários/sessões em
poucas queries `in (...)`, e junta tudo em memória. Um post pode referenciar
uma `sessoes_concluidas.sessao_id` real (nunca duplica o treino) — o card
mostra nome da rotina, duração, séries e volume, cada um **opcionalmente
oculto** pelos campos `mostrar_duracao/mostrar_series/mostrar_volume` que o
autor escolhe ao publicar (`src/components/CriarPost.tsx`). PR do post não
foi implementado ainda (calcular PR retroativo por post seria caro demais
pra fazer por item de feed).

**Feed Amigos** = posts de quem o usuário segue + os próprios
(`buscarSeguindoIds` em `seguidores.ts`). **Descobrir** = todos os posts
públicos recentes, sem algoritmo de recomendação — só ordem cronológica,
igual o prompt master pedia pra fase inicial (seção 34).

**Desafio inicial** (`src/lib/social/desafioInicial.ts`, puro e testado) —
substitui o "25% fixo" da referência visual por 4 tarefas reais de peso
igual (perfil completo, primeira rotina, primeiro treino concluído,
primeiro post): `calcularDesafioInicial` nunca inventa o percentual.
Card em `src/components/CardDesafioInicial.tsx`, mostrado só na aba Amigos
do Social, some sozinho quando chega a 100%.

**Curtir/comentar/seguir** são otimistas na UI (atualiza a tela antes da
resposta do servidor, desfaz se der erro) — sem tempo real, sem
notificação pro autor. Curtida duplicada é impedida pela chave primária
composta `(post_id, user_id)` de `post_likes`, não por lógica no frontend.

### Planos — `src/lib/planos.ts`

Só `free` e `pro`. Hoje o único recurso realmente bloqueado é o limite de 4
rotinas no Free — todo o resto do app está aberto pros dois planos. **Não
adicionar novos bloqueios sem pedido explícito**; quando pedido, seguir o
padrão visual já usado (cadeado + desfoque + CTA único `Ver planos`, sem
modal, sem popup).

A ideia de o Pro gerar dieta personalizada via IA (pesquisa de internet,
questionário de objetivo, etc.) foi levantada mas **não tem escopo definido
ainda** — não implementar até o dono do produto detalhar como deve funcionar.

---

## Supabase

Projeto `Viveci APP`. Scripts em `sql/`, rodar em ordem crescente:
`01_estrutura` → `02_exercicios` → `03_alimentos_desafio` → `04_storage_policies`
→ `05_cardio` → `06_perfil_bio` → `07_preferencias` → `08_social` →
`09_seguranca_beta` → `10_integridade_rotinas` → `11_indices_performance` →
`12_privacidade_metricas_social` → `13_privilegios_minimos` →
`14_idade_minima` → `15_idade_minima_18`. As migrations 01–15 foram confirmadas
no remoto em 18/08/2026.

Bucket de fotos: **`Fotos`** (com F maiúsculo). Caminho obrigatório do arquivo:
`<user_id>/nome.jpg`, senão a policy bloqueia. Avatar usa
`<user_id>/avatar.<ext>`; Body Scan usa `<user_id>/body/<angulo>-<timestamp>.<ext>`;
Social usa `<user_id>/social/<timestamp>.<ext>` — todos passam na policy
porque ela só olha o primeiro segmento do caminho.

Tabela `fotos_progresso` existia desde `01_estrutura.sql` mas não era usada
por nenhuma tela até o Body Scan (ver seção "Body Scan" acima) — não é
tabela nova, só ficou "adormecida" até agora.

Seeds aplicados: 59 exercícios, 50 alimentos, 24 dias de desafio (tabela existe,
recurso de desafio não é usado pelo app ainda). RLS ativo: cada usuário só lê
e escreve as próprias linhas.

Tabelas `planos` / `plano_sessoes` / `plano_itens` foram **reaproveitadas** pro
sistema de rotinas manuais (ver seção "Rotinas de treino" acima) — os campos
de semana/progressão da estrutura original ficam sempre com valor fixo
(`semana: 1`, sem uso real).

---

## Loja de aplicativos

Web/PWA primeiro, de propósito: a Apple exige compra dentro do app para conteúdo
digital, com 15–30% de comissão e sem Pix, o que inviabiliza o low ticket.
Manter a estrutura compatível com **Capacitor** para empacotar depois sem
reescrever.
