# Viveci — guia do projeto

App de treino personalizado, em português do Brasil. Web app + PWA instalável.
Este arquivo é a fonte da verdade. Leia antes de escrever qualquer código.

---

## O conceito

Não é uma pasta de planilhas com login. O usuário responde um onboarding e o
sistema **monta o plano dele**, entrega o treino do dia, registra carga série a
série, ilumina no mapa corporal os músculos treinados e mostra a evolução ao
longo de 12 semanas.

```
PERFIL → OBJETIVO → TREINO → EXERCÍCIOS → REGISTRO DE CARGA
→ MAPA CORPORAL → PROGRESSO → NUTRIÇÃO → DESAFIO → EVOLUÇÃO
```

Plano de **12 semanas**. Nunca "12 meses".

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
   componente. Gerador de treino, cálculo de metas e cálculo do mapa corporal
   vivem em `src/lib/` com teste ao lado.
6. **Nunca prometer resultado**, nunca usar linguagem de culpa, nunca tratar
   biotipo como diagnóstico.
7. Mobile-first. Testar a 375px. Alvos de toque de no mínimo 44px.

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
  lib/        regra de negócio pura + testes (*.test.ts ao lado)
  data/       catálogos estáticos que espelham tabelas do Supabase
  components/ componentes reutilizáveis
  pages/      uma por rota
```

`npm test` roda os testes com o runner nativo do Node (sem vitest, sem jest).

---

## Estado atual

**Pronto e testado:**
- Design system, sidebar (desktop), bottom nav (celular), rotas, `Page`, `Empty`
- `src/lib/metas.ts` — cálculo de meta calórica e macros. 7 testes passando.
- `src/lib/perfil.ts`, `src/lib/refeicoes.ts`, `src/lib/data.ts`, `src/lib/diario.ts`
- `src/data/alimentos.ts` — 50 alimentos brasileiros

**Em construção:** tela `/nutricao` (anel de calorias + barras de macro).

**Ainda não existe:** Supabase, auth, onboarding, gerador de treino, sessão de
treino, mapa corporal, dashboard com dados reais, desafio, evolução, paywall, PWA.

---

## Ordem de construção

```
1  ✅ Fundação: design system, navegação, rotas
2  ⬜ Diário alimentar: motor de metas ✅ + tela ⬜
3  ⬜ Supabase + auth + perfil
4  ⬜ Onboarding de 10 passos
5  ⬜ Gerador de treino (12 semanas)
6  ⬜ Sessão de treino + registro de carga + timer
7  ⬜ Biblioteca de exercícios
8  ⬜ Mapa corporal + equilíbrio muscular
9  ⬜ Dashboard com dados reais
10 ⬜ Evolução: peso, medidas, cargas, consistência
11 ⬜ Desafio 24 Dias + streak
12 ⬜ Paywall, planos, perfil
13 ⬜ PWA, offline, acabamento
```

---

## Regras de negócio

### Meta calórica — `src/lib/metas.ts` (implementado)

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

### Gerador de treino — a fazer

Divisão por frequência: 2 dias Full Body A/B · 3 Push/Pull/Legs ·
4 Peito+Tríceps / Costas+Bíceps / Pernas / Ombros+Abdômen ·
5 Peito / Costas / Pernas / Ombros+Abdômen / Braços · 6 PPL ×2.

Volume por nível: iniciante 5–6 ex, 3 séries, 10–12 reps, 60s ·
intermediário 6–7 ex, 3–4 séries, 8–12 reps, 60–90s ·
avançado 7–8 ex, 4 séries, 6–12 reps, 90–120s.

Objetivo: emagrecer 12–15 reps e 45s · ganhar massa 8–12 reps, 90s, compostos
primeiro · definir 10–15 reps · força 4–6 reps nos compostos, 120s ·
condicionamento 30–45s.

Biotipo: ectomorfo −1 exercício e +15s de descanso · mesomorfo padrão ·
endomorfo −15s de descanso e +1 bloco de cardio.

Local "Casa" → só peso corporal, halter e elástico.
Tempo → `séries_totais ≈ minutos / 3`.

Progressão: sem 1–4 adaptação · 5–8 +1 série nos compostos · 9–11 técnica
avançada em 1 exercício por sessão (só intermediário/avançado) · 12 deload 60%.

Nunca dois treinos do mesmo grupo em dias consecutivos.
Função determinística: mesmo perfil, mesmo plano. Sem IA, sem chamada externa.

### Progressão de carga

Pré-preencher peso e reps com o último registro. Se o usuário completou todas as
reps, sugerir +2,5% em membro superior e +5% em inferior. Mostrar sempre
`Última vez: 80 kg × 10`.

### Mapa corporal

```
volume_grupo = Σ (séries × reps × peso) dos últimos 7 dias
percentual   = round(volume_grupo / maior_volume × 100)
```
Exercício composto: 70% ao grupo primário, 30% dividido entre os secundários.
Grupo em `muscle-off` quando não treinado; em `brand` com opacidade de 0,35 a 1
conforme a intensidade. Alerta de desequilíbrio quando um grupo passa 25 pontos
do antagonista. **Os percentuais vêm do histórico real — nunca valores fixos.**

### Diário alimentar

Anel: azul até 99% · verde `up` de 100 a 110% · âmbar `gold` acima, com arco de
excedente. **Nunca vermelho** — passar da meta não é falha.
Registro por receita, alimento livre, refeição salva ou entrada rápida
(só kcal + proteína, para reduzir atrito). Botão "Copiar dia".
Dia futuro não é editável.

### Planos

`free` — onboarding, semana 1 do plano, 20 exercícios, 10 receitas, dias 1–3 do
desafio. `basico` — pagamento único vitalício, tudo menos recálculo automático de
metas e histórico do diário acima de 7 dias. `premium` — R$ 49,90/mês, tudo,
com plano que se adapta ao desempenho real.

Bloqueio sempre **visível e desfocado**, com cadeado e um único CTA `Ver planos`.

---

## Supabase

Projeto `Viveci APP`. As tabelas já existem no banco — os scripts estão em
`sql/`. Rodar na ordem 01 → 02 → 03 → 04.
Bucket de fotos: **`Fotos`** (com F maiúsculo). Caminho obrigatório do arquivo:
`<user_id>/nome.jpg`, senão a policy bloqueia.

Seeds já aplicados: 59 exercícios, 50 alimentos, 24 dias de desafio.
RLS ativo: cada usuário só lê e escreve as próprias linhas.

Ao integrar, o ponto de troca do diário é `src/lib/diario.ts` — as quatro funções
do topo do arquivo. Nenhum componente precisa mudar.

---

## Loja de aplicativos

Web/PWA primeiro, de propósito: a Apple exige compra dentro do app para conteúdo
digital, com 15–30% de comissão e sem Pix, o que inviabiliza o low ticket.
Manter a estrutura compatível com **Capacitor** para empacotar depois sem
reescrever.
