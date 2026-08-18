# Validação da exclusão de conta — Etapa 35

## Resultado

**BLOCKED — validação remota adiada pelo proprietário.**

A função local `supabase/functions/excluir-conta/index.ts` foi auditada, mas
este documento não afirma que ela foi publicada nem executada no projeto
remoto.

## Auditoria local

- A identidade é obtida do JWT pelo `auth.getUser()`; não existe `user_id`
  aceito do corpo da requisição.
- A chave `SUPABASE_SERVICE_ROLE_KEY` é lida somente no ambiente da Edge
  Function e não é retornada ao cliente.
- Os buckets `midia-publica`, `progresso-privado` e `Fotos` são percorridos de
  forma paginada e removidos em lotes de até 100 objetos.
- A remoção do Auth usa exclusivamente `user.id` autenticado.
- Erros retornam mensagem genérica e não registram JWT, segredo ou conteúdo
  sensível.
- O frontend só declara sucesso quando a função responde sem erro.

## Evidência local

- O E2E cobre confirmação explícita com `EXCLUIR`, envio único e falha sem
  sucesso falso.
- O código exige que Storage seja removido antes de Auth/Postgres para evitar
  declarar exclusão completa quando ainda há arquivos.

## Evidência remota ainda obrigatória

Nada abaixo foi executado nesta etapa:

1. publicar a Edge Function no projeto remoto;
2. usar uma conta descartável com dados em Auth, banco e nos três buckets;
3. exportar e validar o JSON antes da exclusão;
4. excluir pela interface;
5. confirmar falha de login e ausência de dados/arquivos;
6. confirmar que os dados de uma segunda conta continuam intactos;
7. revisar os logs remotos sem expor dados sensíveis.

Até essas evidências existirem, publicação, exclusão integral, Auth, banco e
Storage permanecem com status **não comprovado**.
