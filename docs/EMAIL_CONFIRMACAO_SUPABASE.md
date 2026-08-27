# E-mails de autenticação do VIVECI

Os modelos prontos estão em:

- `supabase/email-templates/confirmacao-cadastro.html` — confirmação do cadastro;
- `supabase/email-templates/recuperacao-senha.html` — recuperação de senha.

## Aplicar no Supabase

1. Abra o projeto **Viveci APP** no painel do Supabase.
2. Entre em **Authentication → Email Templates → Confirm signup**.
3. Use o assunto: `Confirme seu cadastro no VIVECI`.
4. Cole todo o HTML do arquivo de modelo no campo de mensagem.
5. Salve e envie um e-mail de teste.

Depois, abra **Reset password**, use o assunto
`Redefina sua senha do VIVECI`, cole todo o HTML de
`recuperacao-senha.html`, salve e envie um teste.

## URLs de autenticação

Em **Authentication → URL Configuration**, configure a URL oficial publicada
como **Site URL** e inclua os domínios de desenvolvimento/preview necessários
em **Redirect URLs**. O cadastro envia `window.location.origin` como destino,
então o link volta para a mesma origem em que a conta foi criada.

O cadastro retorna para `/login?email-confirmado=1`. O aplicativo valida se o
Supabase realmente confirmou o usuário, mostra a mensagem de sucesso uma vez e
remove o marcador da URL.

Os botões dos dois modelos devem continuar usando `{{ .ConfirmationURL }}`.
Essa variável é preenchida pelo Supabase com o link único e seguro de cada ação.
Nunca substitua essa variável por um endereço fixo.
