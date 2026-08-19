# VIVECI — relatório final do beta fechado

Auditoria final: 18 de agosto de 2026. Gate executado após o commit `e03e096`.
Atualização de 19 de agosto de 2026: expiração prática da URL assinada
confirmada (Etapa 38), único P0 técnico restante.

## Etapas 23–31

| Etapa | Commit | Resultado |
|---|---|---|
| 23 | `49e4f35` | jornadas principais reforçadas |
| 24 | `6ff477d` | estados, erros e dupla submissão |
| 25 | `8c2c5bd` | QA mobile |
| 26 | `24861f5` | consulta do feed oculto removida |
| 27 | `69c6b30` | E2E críticos |
| 28 | `17e761c` | auditoria: NO-GO |
| 29 | `490ee90` | matriz Supabase; BLOCKED por falta de evidência remota |
| 30 | `fa891fd` | controles de dados; fluxo de exclusão removido posteriormente |
| 31 | commit deste relatório | release gate final |

## Etapas 32–37

| Etapa | Commit | Resultado |
|---|---|---|
| 32 | `b785923` | correção local da exposição de métricas; remoto pendente |
| 33 | `4dd4460` | rotação confirmada pelo proprietário; RLS remota BLOCKED |
| 34 | `2176b2d` | compensação de uploads e plano de migração; remoto BLOCKED |
| 35 | `1b4c891` | fluxo posteriormente removido por decisão do produto |
| 36 | `e03e096` | operação documentada; idade mínima continua P0 |
| 37 | `aff3a1f` | release gate definitivo |
| 38 | commit desta atualização | expiração da URL assinada confirmada; gate liberado com P1 em acompanhamento |

## Etapa 29 — Supabase, RLS e Storage

**Resultado atualizado: PASS parcial com pendências específicas.**

As migrations 09–13, funções, triggers, views, índices, buckets e policies foram
confirmados remotamente. A matriz A/B comprovou isolamento do perfil completo,
rotinas, sessões, registros, nutrição e Body Scan; o perfil público mínimo e o
conteúdo social autorizado permaneceram visíveis.

O bucket `progresso-privado` foi validado com três fotos reais: o proprietário
acessou os registros e a outra conta recebeu zero linhas e zero objetos. Não
existiam Body Scans legados para migrar. A tentativa explícita de sobrescrever
path alheio foi bloqueada com `42501`. Em 19/08/2026 (Etapa 38), a expiração
prática de uma URL assinada de 60s foi confirmada contra o bucket remoto:
`200` na primeira requisição, `400 InvalidJWT` (`"exp"` expirada) após ~119s.
Os recursos restantes marcados como pendentes na matriz completa de
`SUPABASE_SECURITY_VALIDATION.md` são operacionais (P1), não de segurança.

## Etapa 30 — exportação e privacidade

**Resultado atualizado: PASS para exportação; exclusão fora do escopo.**

Implementado e testado localmente:

- exportação inclui perfil, preferências, rotinas/itens, registros, sessões, cardio, medidas, metas, diário, fotos, posts, comentários, curtidas, seguidores, bloqueios, denúncias, streak e desafio;
- JSON é versionado, datado, inclui referências de mídia e remove chaves de tokens/senhas/segredos defensivamente;
- Política, Termos e `DATA_LIFECYCLE.md` foram alinhados ao produto real.

O fluxo de exclusão de conta construído naquela etapa foi removido posteriormente por decisão do produto e nunca foi publicado. Idade mínima continua como decisão necessária. Política e Termos continuam rascunhos para revisão profissional.

## Testes finais

- Unitários: **138/138**.
- E2E: **10/10** no Chromium local contra o build de produção, incluindo o novo
  caso de idade 18+. No Windows, a execução limpa usa o servidor de preview
  controlado externamente para evitar o travamento de encerramento do servidor
  de desenvolvimento interno do Playwright.
- TypeScript/build: aprovado.
- Lint: aprovado.
- `git diff --check`: aprovado.
- Nenhum valor real `sb_secret_` encontrado nos arquivos auditados.

Cobertura E2E: login, recuperação, proteção de rota, onboarding com refresh, criação de rotina, série/finalização, cardio, ausência da opção de excluir conta e smoke das áreas principais.

Os E2E autenticados usam backend simulado e não são evidência de RLS/Storage remoto.

## Smoke, mobile e console

Home, Treino, Corpo, Nutrição, Social, Perfil e Configurações abriram em 375, 390, 430 e 1280 px sem overflow horizontal, erro de aplicação, request interna falha ou warning React observado. A fonte externa foi respondida localmente no teste para não confundir bloqueio de rede do sandbox com erro do app. Câmera, teclado nativo e instalação PWA ainda exigem aparelho real.

## Performance final

| Item | Resultado |
|---|---:|
| JS inicial | 458,89 kB |
| JS inicial gzip | 133,72 kB |
| CSS | 55,69 kB |
| Home hero | 110,86 kB |
| Push | 86,67 kB |
| Pull | 107,73 kB |
| Legs | 109,68 kB |
| Full Body | 100,25 kB |
| Cardio | 96,29 kB |

Não houve nova otimização no release gate. Rotas pesadas continuam sob demanda e Social pagina 15 posts.

## FINAL RELEASE GATE

| Item | Status | Evidência |
|---|---|---|
| Chave antiga rotacionada | PASS por confirmação | proprietário confirmou a rotação sem compartilhar segredo |
| Migrations 09–13 | PASS remoto | estruturas, funções, views, triggers e privilégios confirmados |
| RLS com A/B | PASS remoto | matriz principal e complementar aprovadas |
| Perfil privado | PASS remoto | perfil completo invisível e perfil público mínimo visível para outra conta |
| Body Scan privado | PASS remoto | 3 registros/objetos privados invisíveis para outra conta |
| Social limitado ao compartilhado | PASS remoto | duração autorizada presente; séries e volume desmarcados retornaram `NULL` |
| Plano protegido | PASS remoto | promoção direta falhou com `42501` |
| Limite Free backend | PASS remoto | quinta rotina falhou com `23514`; total permaneceu em quatro |
| Uploads | PASS remoto | buckets/policies, Body Scan, bloqueio de path alheio e expiração de URL assinada validados |
| Exportação | PASS local | pacote ampliado e teste de remoção de segredos |
| Exclusão de conta | FORA DO ESCOPO | opção e função removidas por decisão do produto |
| Fluxo principal | PASS local | unitários, E2E e smoke aprovados |
| Simulações identificadas | PASS | avisos explícitos na interface |
| Idade mínima | PASS remoto | beta 18+; idade 17 rejeitada pela constraint com `23514` |

## Pendências

### P0

Nenhuma. A expiração prática de uma URL assinada de `progresso-privado` foi
confirmada em 19/08/2026 (Etapa 38) — ver `SUPABASE_SECURITY_VALIDATION.md`.
Os cinco objetos legados sem referência permanecem preservados e foram
classificados para avaliação pós-beta (P2).

### P1

Completar responsável/contato/retenção/fornecedores e revisão jurídica; processo de moderação; observabilidade; testes em aparelhos reais.

### P2

Homologação automatizada; atomicidade integral da criação de rotina; inventário/limpeza de mídia órfã remota; retomada/limpeza de sessões abandonadas; pipeline de thumbnails se necessário.

## Decisão

**GO TÉCNICO — BETA FECHADO, COM PENDÊNCIAS OPERACIONAIS P1 EM ACOMPANHAMENTO**

O núcleo local está estável e a exposição social conhecida foi corrigida no
contrato local. RLS, Storage, migration 12, limite Free, proteção do plano e a
expiração prática da URL assinada de mídia corporal privada foram comprovados
remotamente (Etapa 38, 19/08/2026). Não resta nenhum P0 técnico ou de
segurança. O beta fechado pode prosseguir, mas permanece condicionado ao
fechamento dos itens P1 (responsável/contato do beta, retenção/backups/
fornecedores, revisão jurídica de Termos e Privacidade, processo de denúncias,
observabilidade mínima e testes em aparelhos reais) — nenhum deles bloqueia
tecnicamente o lançamento, mas todos precisam de dono e prazo antes de abrir
para os primeiros participantes.
