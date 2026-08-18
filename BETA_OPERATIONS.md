# Operação mínima do beta fechado

Este procedimento é operacional, não aconselhamento jurídico ou profissional.

## Convites e acesso

- Não enviar convites enquanto qualquer P0 do release gate estiver aberto.
- Depois do GO, convidar apenas participantes identificados pelo responsável do
  produto e compatíveis com a política de idade ainda a definir.
- Manter uma lista controlada de convites e revogar o acesso pelo Supabase Auth
  quando necessário.
- Não usar contas pessoais para testes de segurança ou exclusão.

## Registro de problemas

Registrar data, área, passos para reproduzir, impacto e versão. Não incluir senha,
JWT, chave, foto corporal ou outro dado sensível em tickets. Problemas de acesso
indevido, Body Scan, exclusão ou segredo exposto têm prioridade P0.

## Incidente

1. detectar e confirmar o escopo sem ampliar o acesso;
2. limitar o impacto, pausando convites ou o beta quando necessário;
3. preservar somente a evidência necessária, com acesso restrito;
4. corrigir e validar a fronteira afetada;
5. avaliar quais usuários e dados foram afetados;
6. documentar decisões, ações e evidências sem registrar segredos.

O responsável pelo produto deve buscar orientação adequada quando a natureza do
incidente exigir. Este roteiro não substitui análise jurídica ou de segurança.

## Pausa e revogação

- Suspender novos convites imediatamente diante de P0 confirmado.
- Revogar sessões/contas afetadas pelo painel administrativo, preservando apenas
  evidência necessária.
- Não reabrir o beta até repetir os testes remotos relacionados e registrar PASS.

## Exclusão e privacidade

- Solicitações devem usar o canal oficial ainda pendente de definição.
- Enquanto `excluir-conta` não estiver publicada e testada, tratar a solicitação
  manualmente por operador autorizado e registrar cada origem de dado verificada.
- Não declarar exclusão concluída sem confirmar Auth, banco e Storage.
- Relatos de privacidade devem ser registrados sem copiar o conteúdo sensível.

