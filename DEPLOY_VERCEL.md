# VIVECI — publicação na Vercel

## Configuração do projeto

- **Root Directory:** raiz do repositório (não selecionar `landing/`).
- **Framework Preset:** Vite.
- **Build Command:** `npm run build`.
- **Output Directory:** `dist`.
- **Install Command:** `npm install`.

O arquivo `vercel.json` mantém essas opções versionadas e direciona rotas do
React, como `/social`, `/treino` e `/perfil`, para `index.html`. Arquivos
estáticos continuam sendo servidos diretamente.

## Variáveis de ambiente

Cadastrar em **Project Settings → Environment Variables**, nos ambientes
Production e Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Usar somente a chave pública/anon do Supabase. Nunca cadastrar `service_role`,
secret key ou outro segredo administrativo em variável iniciada com `VITE_`,
porque essas variáveis fazem parte do JavaScript enviado ao navegador.

Depois de criar ou alterar variáveis, iniciar um novo deploy. A Vercel não
aplica novas variáveis retroativamente a builds já concluídos.

## Supabase Auth

Em **Authentication → URL Configuration**:

1. Definir **Site URL** como o domínio principal da Vercel.
2. Adicionar o domínio principal e os domínios de preview autorizados em
   **Redirect URLs**.
3. Manter `http://localhost:5173/**` apenas para desenvolvimento local.

Não registrar tokens ou links de recuperação reais neste documento.

## Verificação depois do deploy

1. Abrir `/login` diretamente e atualizar a página.
2. Entrar com uma conta de teste maior de 18 anos.
3. Atualizar diretamente `/treino`, `/social`, `/nutricao`, `/corpo` e
   `/perfil/configuracoes`; nenhuma rota deve retornar 404.
4. Testar recuperação de senha usando uma conta descartável.
5. Confirmar que avatar, post social e Body Scan carregam conforme a
   privacidade configurada.
6. Conferir o console do navegador e os logs do deploy antes de liberar o beta.

Se o build falhar, registrar a mensagem do log sem copiar valores de variáveis
de ambiente.
