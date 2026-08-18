# VIVECI — relatório final de prontidão do beta

Auditoria concluída em 18 de agosto de 2026. Versão auditada: commit `69c6b30`, acrescido somente desta documentação da Etapa 28.

## 1. Etapas auditadas

| Etapa | Commit | Resultado |
|---|---|---|
| 23 — jornadas principais | `49e4f35` | Proteções contra duplicidade, onboarding persistente e primeira ação corrigidos |
| 24 — estados e erros | `6ff477d` | Erros humanos, confirmações e submissões robustas |
| 25 — mobile | `8c2c5bd` | Alvos de toque, teclado e viewports revisados |
| 26 — performance | `24861f5` | Feed oculto deixou de fazer consulta desnecessária |
| 27 — E2E | `69c6b30` | Quatro jornadas críticas adicionadas |
| 28 — release | commit deste relatório | Auditoria final, checklist e decisão |

## 2. Classificação funcional

### PRONTO no código local

- Onboarding, Home, rotinas manuais, sessão de treino, PR, Treino Express, Treino Rápido e cardio.
- Corpo/mapa de estímulo, Perfil, Evolução, configurações e exportação JSON.
- PWA instalável com cache básico network-first; não oferece sincronização offline de dados.

### BETA — depende de validação remota e uso controlado

- Auth e recuperação de senha via Supabase.
- Nutrição manual e diário alimentar.
- Social com posts de foto, treino vinculado, curtidas, comentários, seguidores, bloqueio e denúncia.
- Body Scan real para upload, timeline e comparação de fotos privadas.
- Free/Pro: o único bloqueio funcional é o limite de quatro rotinas no Free.

### DEMONSTRAÇÃO — sem IA/OCR real

- Food Scanner e Label Scanner.
- Análise de movimento e análise de físico.

As quatro interfaces mostram aviso explícito de demonstração ou avaliação experimental. Os resultados simulados não são apresentados como diagnóstico.

### ADIADO ou indisponível

- Exclusão automática de conta no estado local auditado.
- Vídeo/Stories, XP, rankings, notificações sociais, contas privadas, desafios avançados, IA de dieta e painel de moderação.

## 3. Fluxo de dados e confiabilidade

O núcleo usa Supabase Auth, Postgres com RLS e Storage. Rotinas são criadas por RPC transacional; o limite Free também existe no banco. Séries são gravadas uma vez e sessões concluídas alimentam histórico, Corpo e Intelligence Engine. Sessões interrompidas permanecem com `finalizada_em = NULL`, ficam fora do histórico e não são retomadas. Isso evita sessão concluída fantasma, mas deve ser explicado e validado no beta.

Os testes locais cobrem a interface desses fluxos com backend simulado. Não foi possível provar nesta auditoria a persistência remota após novo login, email de confirmação, RLS entre duas contas nem Storage real, pois não há ambiente Supabase de teste isolado configurado.

## 4. Testes e build

- Unitários: **130/130** aprovados.
- E2E: **7/7** aprovados no Chromium local.
- E2E novos: onboarding com refresh; rotina + exercício + salvamento único; série + finalização única; registro de cardio.
- E2E públicos existentes: login, recuperação e redirecionamento de rota privada.
- TypeScript/build: aprovado.
- Lint: aprovado.
- `git diff --check`: aprovado.

Ainda sem cobertura real: cadastro por email, links de confirmação/redefinição, alimentação, Corpo após treino, persistência após novo login, duas contas no Social, RLS e Storage. O motivo é a ausência de ambiente de teste remoto seguro; nenhuma credencial pessoal ou de produção foi usada.

## 5. Performance

| Medida | Antes da Etapa 26 | Depois |
|---|---:|---:|
| JS inicial | 458,82 kB | 458,82 kB |
| JS inicial gzip | 133,72 kB | 133,72 kB |
| CSS observado | 55,14 kB | 55,84 kB |
| Social | 11,30 kB / 3,63 kB gzip | 11,30 kB / 3,63 kB gzip |

Não houve redução segura do bundle nessa etapa. O ganho real foi comportamental: o Social agora consulta somente Amigos ou Descobrir, conforme a aba visível, em vez de buscar os dois feeds ao abrir. Paginação permanece em 15 posts e rotas pesadas continuam sob demanda.

## 6. Segurança

Confirmado por código e SQL disponível:

- `progresso-privado` é privado e Body Scan usa URL assinada de uma hora;
- avatar e mídia social deliberadamente pública usam `midia-publica`;
- uploads aceitam somente JPEG/PNG/WebP compatíveis e possuem limite de tamanho;
- `perfis_publicos` expõe somente id, nome, foto e bio a autenticados;
- plano, limite Free e snapshot de treino social possuem proteção no banco;
- RLS restringe escrita, bloqueio e interações conforme o proprietário.

Não confirmado no ambiente remoto: aplicação efetiva das migrations 09–11, policies dos buckets, migração das fotos legadas e teste cruzado com duas contas. A função de exclusão privilegiada e seu acionamento foram removidos por alteração local paralela; portanto a exclusão automática de conta está indisponível nesta versão e não pode ser prometida.

## 7. Privacidade e documentos

Body Scan é projetado como privado; Social e avatar são públicos por escolha de produto. Exportação de dados é funcional em JSON. A exclusão integral não está disponível no estado auditado.

`docs/POLITICA_PRIVACIDADE_RASCUNHO.md` e `docs/TERMOS_USO_RASCUNHO.md` são apenas estruturas: faltam responsável, contato, retenção, provedores/regiões, idade mínima, jurisdição e revisão profissional. Eles não são aconselhamento jurídico nem estão prontos para aceite de usuários reais.

## 8. PWA e metadata

Manifest: nome, nome curto, descrição, idioma, cores, ícones, modo standalone e orientação coerentes. HTML: idioma, viewport com safe area, description, theme-color, favicon, ícone Apple e manifest presentes. O service worker usa network-first para arquivos da mesma origem e cache básico; o produto não promete offline completo. Nenhuma referência ao antigo plano automático foi encontrada.

## 9. Console e UX real

As jornadas E2E finalizadas não apresentaram erro de aplicação, request não tratada, imagem 404 ou warning React no resultado observado. Os avisos `NO_COLOR` vieram do processo Node/Playwright e não da aplicação. O QA automatizado de viewports não encontrou overflow horizontal no fluxo público; câmera, teclado nativo e PWA ainda exigem aparelho real.

## 10. Problemas conhecidos

- Sessão abandonada não pode ser retomada e permanece como registro técnico.
- Não há homologação Supabase automatizada.
- Moderação registra denúncias, mas não possui operação administrativa.
- Scanners e análises são demonstrações.
- Sem error tracking/alertas centralizados.

## 11. Blockers

1. Rotação da chave secreta anteriormente compartilhada não comprovada.
2. Migrations 09–11, RLS e Storage não validados no Supabase remoto com duas contas.
3. Fotos corporais legadas ainda dependem de migração e verificação de exposição.
4. Exclusão integral de conta, dados e arquivos está indisponível no estado local.
5. Política de Privacidade e Termos não estão prontos para usuários reais.

## 12. Recomendação final

**NO-GO — BETA FECHADO**

O núcleo local está estável e testado, mas segurança, privacidade e direito de exclusão ainda não têm comprovação suficiente para convidar usuários reais. O status só deve mudar para GO depois de concluir e registrar evidência para todos os itens P0 do `BETA_CHECKLIST.md`.
