# VIVECI RELEASE CANDIDATE REPORT

Data da auditoria local: 18 de agosto de 2026.

## 1. Versão

- Etapa 12: `28cfe28` — segurança, privacidade e autorização.
- Etapa 13: `40326b1` — integridade e fluxos do beta.
- Etapa 14: `2191cc2` — divisão de rotas e carregamento.
- Etapa 15: documentação e decisão deste relatório.

## 2. Segurança

Corrigido no repositório:

- validação compartilhada de MIME, extensão e tamanho de imagens;
- separação entre mídia pública e fotos corporais privadas;
- perfil social mínimo por `perfis_publicos`;
- proteção do plano e do limite Free no banco;
- snapshot de treino social derivado no banco e validado pelo proprietário;
- exclusão de post/comentário próprio, bloqueio e denúncia;
- recuperação de senha oficial do Supabase;
- exclusão privilegiada de conta isolada em Edge Function;
- nenhum valor `sb_secret_` encontrado no código ou histórico Git acessível.

Pendente de comprovação externa:

- rotação da chave secreta comprometida;
- aplicação das migrations 09–11;
- publicação e teste da função `excluir-conta`;
- teste cruzado com duas contas após as policies entrarem no Supabase.

## 3. Privacidade

Novos Body Scans usam bucket privado e URL assinada temporária; o banco guarda bucket/path. Registros antigos mantêm fallback documentado para não quebrar imagens antes da migração. Avatar e fotos deliberadamente publicadas no Social ficam no bucket público. A privacidade só pode ser considerada efetiva no ambiente remoto depois de aplicar a migration 09 e migrar os arquivos legados.

## 4. Banco

Ordem: `01_estrutura` → `02_exercicios` → `03_alimentos_desafio` → `04_storage_policies` → `05_cardio` → `06_perfil_bio` → `07_preferencias` → `08_social` → `09_seguranca_beta` → `10_integridade_rotinas` → `11_indices_performance`.

A migration 10 cria transações RPC para criação e substituição de itens da rotina, adiciona validações e diferencia sessão abandonada (`finalizada_em = NULL`) de sessão concluída. A migration 11 adiciona índices correspondentes às consultas reais.

## 5. Produto

O código preserva autenticação/onboarding, rotinas manuais, sessão com séries/carga/repetições/descanso, Treino Express, Treino Rápido, cardio, PR, Intelligence Engine determinístico, nutrição, mapa corporal, evolução, Body Scan, Perfil, Configurações, Free/Pro e Social. O pós-treino oferece um CTA principal para concluir e ações secundárias para mapa e compartilhamento, sem publicação automática.

## 6. Simulações

Food Scanner, Label Scanner, análise de movimento e análise de físico continuam sem IA/OCR real. Todas exibem `DEMONSTRAÇÃO` de forma explícita. O VIVECI Intelligence Engine usa regras determinísticas sobre histórico; não é machine learning.

## 7. Performance

- Antes: 1 chunk JS inicial, 695,64 kB; 190,18 kB gzip. CSS: 50,71 kB; 9,78 kB gzip.
- Depois: entry JS de 457,46 kB; 133,04 kB gzip; 43 chunks sob demanda. Total JS produzido: aproximadamente 691,45 kB.
- Ganho inicial: cerca de 34% em tamanho bruto e 30% em gzip.
- Social: 15 posts por página; interações consultadas somente para o lote; comentários limitados a 100 por abertura.
- Futuro: converter GIFs para WebM/MP4 ou WebP animado somente após teste de compatibilidade.

## 8. PWA

Manifest alinhado à marca atual. Service worker network-first com cache `viveci-v2`, limpeza de versões antigas e armazenamento apenas de respostas válidas. Não existe sincronização offline; Supabase continua necessário para dados e o produto não deve prometer treino offline completo.

## 9. Social

Adequado para beta controlado após migrations: Amigos, Discover cronológico, post com foto/treino, métricas opt-in, like, comentário, seguir, perfil público mínimo, bloqueio, denúncia e exclusão própria. Não existem vídeo, notificações, contas privadas, ranking, XP, tempo real ou painel de moderação.

## 10. Testes

- 110 testes unitários: aprovados.
- 3 testes E2E públicos: login, recuperação e proteção de rota aprovados no Chrome local.
- TypeScript/build: aprovado.
- Lint de `src`: aprovado.
- Build após otimização: aprovado.
- Fluxos autenticados e Supabase remoto: exigem checklist manual; não foram declarados como testados remotamente.

## 11. Ações manuais

1. Rotacionar a chave secreta comprometida no Supabase.
2. Aplicar migrations 09, 10 e 11 na ordem.
3. Publicar `excluir-conta` e configurar seus segredos apenas no ambiente da função.
4. Configurar URLs de recuperação/redirecionamento do Auth.
5. Migrar fotos legadas conforme `sql/MIGRACAO_FOTOS_BETA.md`.
6. Testar policies, bloqueio, plano, Storage e exclusão com duas contas.
7. Executar todo o `BETA_CHECKLIST.md` em ambiente de homologação.
8. Providenciar revisão jurídica dos rascunhos de privacidade e termos.

## 12. Checklist beta com 3–5 usuários

Cada participante deve criar conta, concluir onboarding, criar rotina, iniciar treino, registrar séries, finalizar, interpretar recomendação, abrir Corpo, registrar alimentação, consultar Evolução e publicar no Social. Registrar onde travou, dúvidas de próxima ação, excesso de informação, bugs, tempo até o primeiro treino e retorno no dia seguinte. Não reutilizar dados pessoais reais na primeira rodada.

## 13. P0

- Rotação da chave secreta ainda não comprovada.
- Migrations de segurança/integridade ainda não comprovadas no Supabase remoto.
- Privacidade efetiva dos arquivos legados ainda depende da migração de Storage.
- Exclusão de conta ainda depende de deploy e teste da Edge Function.

## 14. P1

- Sem error tracking, logs centralizados, monitoramento e alertas de produção.
- Termos e Política de Privacidade aguardam revisão jurídica.
- Fluxos autenticados ainda precisam de E2E/manual no ambiente remoto.
- Moderação não possui painel operacional; denúncias apenas persistem.
- Layouts 375/390/430 e 1024/1280/1440 exigem rodada visual final em dispositivos reais.

## 15. GO / NO-GO

**NO-GO para beta com usuários reais neste momento.**

O código local é candidato tecnicamente consistente e todas as validações locais passam, mas os P0 dependentes do Supabase ainda não foram comprovados. O status muda para **GO para beta interno controlado** somente depois da rotação do segredo, migrations 09–11, migração das fotos, deploy/teste da exclusão e validação cruzada com duas contas. Não há evidência suficiente para beta fechado externo antes disso.
