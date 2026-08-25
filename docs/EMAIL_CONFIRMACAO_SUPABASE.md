# E-mail de confirmação do VIVECI

O modelo pronto está em
`supabase/email-templates/confirmacao-cadastro.html`.

## Aplicar no Supabase

1. Abra o projeto **Viveci APP** no painel do Supabase.
2. Entre em **Authentication → Email Templates → Confirm signup**.
3. Use o assunto: `Confirme seu cadastro no VIVECI`.
4. Cole todo o HTML do arquivo de modelo no campo de mensagem.
5. Salve e envie um e-mail de teste.

## URLs de autenticação

Em **Authentication → URL Configuration**, configure a URL oficial publicada
como **Site URL** e inclua os domínios de desenvolvimento/preview necessários
em **Redirect URLs**. O cadastro envia `window.location.origin` como destino,
então o link volta para a mesma origem em que a conta foi criada.

O botão do modelo deve continuar usando `{{ .ConfirmationURL }}`. Essa variável
é preenchida pelo Supabase com o link único e seguro de confirmação.
