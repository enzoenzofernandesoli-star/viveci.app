# VIVECI — relatório final do beta fechado

Auditoria final: 18 de agosto de 2026. Estado de código anterior à documentação final: `fa891fd`.

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
| 30 | `fa891fd` | controles de dados; BLOCKED até deploy/teste da exclusão |
| 31 | commit deste relatório | release gate final |

## Etapa 29 — Supabase, RLS e Storage

**Resultado: BLOCKED.**

O workspace tem apenas URL e chave publicável. Não há CLI vinculada, credencial administrativa segura, duas contas descartáveis ou ambiente de homologação acessível. As migrations 09–11 foram auditadas no repositório, mas não foram reaplicadas nem declaradas ativas remotamente.

Buckets esperados: `midia-publica` para avatar/social, `progresso-privado` para Body Scan e `Fotos` como legado. Body Scan local grava path permanente e gera signed URL de uma hora; a privacidade remota e a migração dos legados não estão comprovadas.

A matriz completa está em `SUPABASE_SECURITY_VALIDATION.md`. O teste A/B não foi executado. Também foi identificado um P0: flags de compartilhamento escondem métricas na UI, porém a consulta atual lê o snapshot bruto completo de `posts`; isso exige máscara/permissão no contrato do banco e validação A/B.

## Etapa 30 — exclusão, exportação e privacidade

**Resultado: BLOCKED.**

Implementado e testado localmente:

- Edge Function autentica o JWT e deriva o próprio usuário, sem aceitar `user_id` arbitrário;
- service role permanece apenas no ambiente da função;
- arquivos são listados/removidos em páginas nos três buckets antes da exclusão do Auth;
- falha de Storage interrompe o fluxo; falha posterior não é apresentada como sucesso;
- confirmação exige digitar `EXCLUIR`, bloqueia duplicidade, limpa estado local e encerra a sessão após sucesso;
- exportação inclui perfil, preferências, rotinas/itens, registros, sessões, cardio, medidas, metas, diário, fotos, posts, comentários, curtidas, seguidores, bloqueios, denúncias, streak e desafio;
- JSON é versionado, datado, inclui referências de mídia e remove chaves de tokens/senhas/segredos defensivamente;
- Política, Termos e `DATA_LIFECYCLE.md` foram alinhados ao produto real.

A exclusão não é considerada funcional porque não houve deploy nem teste destrutivo remoto. Storage, Auth e Postgres não formam transação única; a limitação está documentada. Idade mínima continua como decisão necessária. Política e Termos continuam rascunhos para revisão profissional.

## Testes finais

- Unitários: **131/131**.
- E2E: **10/10** no Chromium local.
- TypeScript/build: aprovado.
- Lint: aprovado.
- `git diff --check`: aprovado.
- Nenhum valor real `sb_secret_` encontrado nos arquivos auditados.

Cobertura E2E: login, recuperação, proteção de rota, onboarding com refresh, criação de rotina, série/finalização, cardio, exclusão com confirmação, falha segura da exclusão e smoke das áreas principais.

Os E2E autenticados usam backend simulado e não são evidência de RLS/Storage remoto.

## Smoke, mobile e console

Home, Treino, Corpo, Nutrição, Social, Perfil e Configurações abriram em 375, 390, 430 e 1280 px sem overflow horizontal, erro de aplicação, request interna falha ou warning React observado. A fonte externa foi respondida localmente no teste para não confundir bloqueio de rede do sandbox com erro do app. Câmera, teclado nativo e instalação PWA ainda exigem aparelho real.

## Performance final

| Item | Resultado |
|---|---:|
| JS inicial | 458,82 kB |
| JS inicial gzip | 133,71 kB |
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
| Chave antiga rotacionada | BLOCKED | confirmação do painel ausente |
| Migrations 09–11 | BLOCKED | somente SQL local auditado |
| RLS com A/B | BLOCKED | duas contas não disponíveis |
| Perfil privado | BLOCKED | desenho local correto; remoto não testado |
| Body Scan privado | BLOCKED | bucket/signed URL esperados; remoto e legado não testados |
| Social limitado ao compartilhado | FAIL | snapshot oculto pode ser lido no payload bruto |
| Plano protegido | BLOCKED | trigger local; bypass remoto não testado |
| Limite Free backend | BLOCKED | trigger local; quinta rotina remota não testada |
| Uploads | PASS local | 4 testes de MIME/extensão/tamanho + paths por usuário |
| Exportação | PASS local | pacote ampliado e teste de remoção de segredos |
| Exclusão de conta | BLOCKED | implementação/E2E local; deploy e jornada real ausentes |
| Fluxo principal | PASS local | unitários, E2E e smoke aprovados |
| Simulações identificadas | PASS | avisos explícitos na interface |
| Idade mínima | BLOCKED | decisão de produto/jurídica ausente |

## Pendências

### P0

Rotação da chave; migrations/RLS/Storage A/B; migração de fotos legadas; máscara real das métricas sociais; proteção remota de plano/limite Free; deploy e teste da exclusão; decisão de idade mínima.

### P1

Completar responsável/contato/retenção/fornecedores e revisão jurídica; processo de moderação; observabilidade; testes em aparelhos reais.

### P2

Homologação automatizada; atomicidade integral da criação de rotina; tratamento de mídia órfã; retomada/limpeza de sessões abandonadas; pipeline de thumbnails se necessário.

## Decisão

**NO-GO — BETA FECHADO**

O núcleo local está estável, mas os critérios mínimos de GO exigem evidência remota de isolamento, chave revogada, limite backend e exclusão real. Há ainda um vazamento potencial de métricas sociais desmarcadas no payload bruto. Segurança e privacidade prevalecem sobre o resultado dos testes locais.
