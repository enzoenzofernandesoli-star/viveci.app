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
evolução (peso, cargas, consistência).

```
PERFIL → ROTINA (montada pelo usuário) → SESSÃO DE TREINO → REGISTRO DE CARGA
→ MAPA CORPORAL → NUTRIÇÃO (diário + meta) → EVOLUÇÃO
```

Não existe plano automático de 12 semanas nem gerador de treino por
algoritmo — isso foi removido a pedido do usuário. Cada rotina é criada e
editada manualmente, sem limite de tempo ou de semanas.

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
   cardio e consistência/streak vivem em `src/lib/` com teste ao lado (`*.test.ts`).
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
| `app` | `#05070D` | fundo geral |
| `sidebar` | `#080B12` | barra lateral e barra inferior |
| `card` | `#0E1219` | cards e painéis |
| `card-hover` | `#141A24` | hover e superfícies elevadas |
| `line` | `#1B2231` | bordas de 1px |
| `brand` | `#2F6BFF` | **única cor de ação** |
| `brand-hover` | `#1E56E0` | hover do botão primário |
| `ink` | `#FFFFFF` | texto principal |
| `ink-2` | `#9AA4B8` | labels e legendas |
| `ink-3` | `#5A6478` | estados inativos |
| `up` / `down` | `#22C55E` / `#EF4444` | **só** em variação numérica |
| `gold` | `#F5A524` | só conquista, troféu e streak |
| `muscle-off` | `#3A4252` | músculo não treinado no mapa |

**Tipografia:** Inter. H1 28px/700. Título de card 17px/600. Número de destaque
44px/700 com a classe `.num` (tabular-nums). Texto 14px. Label 12px maiúscula
com tracking 0.06em em `ink-2`.

**Card:** `bg-card`, borda 1px `line`, radius 16px, padding 24px, **sem sombra**.
**Botão primário:** `bg-brand`, texto branco 600, radius 12px, altura 48px.
**Chip ativo:** fundo azul translúcido + texto `brand`. Inativo: borda `line` + `ink-2`.

**Proibido:** gradiente colorido, sombra pesada, emoji como ícone de interface,
mais de uma cor de ação por tela. Ícones: `lucide-react`, `strokeWidth={1.75}`.

**Exceção única:** as três barras de macro do diário alimentar usam
Proteína `#2F6BFF`, Carboidrato `#8B5CF6`, Gordura `#F5A524` — três barras
iguais seriam ilegíveis.

---

## Onde as coisas ficam

```
src/
  lib/        regra de negócio pura + testes (*.test.ts ao lado) + camadas de I/O com o Supabase
  data/       catálogos estáticos que espelham tabelas do Supabase (exercícios, alimentos)
  components/ componentes reutilizáveis
  pages/      uma por rota
```

`npm test` roda os testes com o runner nativo do Node (sem vitest, sem jest).
Arquivos de teste (`*.test.ts`) só importam módulos **puros** (sem `import.meta.env`,
sem o client do Supabase) — por isso a lógica de negócio fica separada da
camada de I/O em arquivos próprios (ex: `progressaoCarga.ts` puro vs `registros.ts` com I/O).

**Navegação:** 4 abas fixas — Início, Treino, Nutrição, Perfil — mais um botão
redondo flutuante no meio da barra inferior que abre o Treino Rápido
(`/treino/rapido`). Planos não tem aba própria (acessível a partir do Perfil
e de telas de bloqueio). Evolução não é mais rota — é a 2ª aba dentro da
própria página de Perfil (a 1ª é Treinos).

**Dependência externa de UI:** `body-muscles` (npm) — biblioteca do mapa
corporal (SVG anatômico com 89 regiões). Ver seção "Mapa corporal" abaixo
pra entender por que as cores dela são sobrescritas na mão.

---

## Estado atual

Praticamente tudo abaixo está implementado, testado e passou por teste manual
no navegador. Rode `npm test` (deve passar 100%) e `npm run build` antes de
qualquer entrega.

- **Auth** — email/senha via Supabase (`src/lib/auth.ts`).
- **Onboarding** — 6 passos: nome, sexo, idade, altura/peso, objetivo, dias/semana.
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
- **Dashboard** — dados reais: rotinas, nutrição do dia, mapa corporal.
- **Perfil** — avatar (upload pro bucket `Fotos`), nome e biografia editáveis,
  3 números reais (treinos concluídos / rotinas criadas / sequência de dias),
  e 2 abas: **Treinos** (histórico de sessões concluídas) e **Evolução**
  (peso com gráfico, consistência 7/30 dias, cargas por exercício com gráfico).
- **Planos** — só `free` e `pro`. Único bloqueio ativo hoje: free trava em 4
  rotinas de treino. Pro ainda não tem nenhum recurso exclusivo de verdade —
  isso é intencional, só entra quando o dono do produto decidir o quê.
- **PWA** — manifest, ícones, service worker (offline básico).

**Não existe (e não tem ordem definida pra construir):** Desafio 24 Dias,
receitas, IA de dieta personalizada, sistema social (seguidores/amigos —
o Perfil foi inspirado visualmente num app com esse recurso, mas os 3 números
mostrados são só estatísticas próprias, não social), fotos de progresso.
Não construir nenhum desses sem pedido explícito.

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

O corpo em si é renderizado pela lib `body-muscles` (89 regiões anatômicas
reais, frente/costas). Ela colore por gradiente amarelo→vermelho por padrão,
o que **fere a regra de "proibido gradiente colorido"** — por isso
`MapaCorporal.tsx` repinta cada `path` na mão (`muscle-off`/`brand` + opacidade)
logo depois de todo `chart.update()`. Os 89 IDs da lib são mapeados pros nossos
10 grupos musculares em `ID_PARA_GRUPO`; IDs sem grupo correspondente (mão, pé,
joelho...) ficam neutros. **Cuidado com hover:** a lib pinta a própria cor de
hover *depois* de disparar `onMuscleHover`, então o repaint customizado
precisa rodar num `setTimeout(0)` senão a cor da lib vaza de volta — já foi
bug, não reintroduzir.

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
→ `05_cardio` → `06_perfil_bio`. Todos já foram rodados no banco de produção.

Bucket de fotos: **`Fotos`** (com F maiúsculo). Caminho obrigatório do arquivo:
`<user_id>/nome.jpg`, senão a policy bloqueia.

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
