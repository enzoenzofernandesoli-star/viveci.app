# Ativar notificações push do VIVECI

O código do aplicativo, o banco e a função de envio já estão preparados. Estes passos conectam o projeto ao Firebase Cloud Messaging (FCM). A credencial privada fica somente nos segredos do Supabase e nunca deve entrar no Git ou no APK.

## 1. Configurar o aplicativo Android no Firebase

1. Abra o [Firebase Console](https://console.firebase.google.com/) e crie ou selecione o projeto do VIVECI.
2. Adicione um aplicativo **Android** com o identificador exato `com.viveci.app`.
3. Baixe `google-services.json` e coloque em `android/app/google-services.json`.
4. Em **Configurações do projeto > Cloud Messaging**, confirme que a API Firebase Cloud Messaging HTTP v1 está ativada.

O arquivo `google-services.json` está ignorado pelo Git. Ele identifica o projeto Firebase, mas deve continuar fora do repositório.

## 2. Preparar o Supabase

1. Execute [25_notificacoes_push.sql](../sql/25_notificacoes_push.sql) no SQL Editor.
2. No Firebase, abra **Configurações do projeto > Contas de serviço** e gere uma nova chave privada JSON.
3. No Supabase, abra **Edge Functions > Secrets** e crie `FIREBASE_SERVICE_ACCOUNT`. O valor deve ser o conteúdo completo do JSON baixado.
4. Publique a função:

```powershell
supabase functions deploy enviar-push --no-verify-jwt
```

Não coloque o JSON da conta de serviço em `.env` público, no código ou no aplicativo. Depois de cadastrar o segredo, guarde o arquivo em local seguro ou apague a cópia baixada.

## 3. Criar o disparo automático

No Supabase, abra **Database > Webhooks** e crie:

- Nome: `enviar-notificacao-push`
- Tabela: `public.notificacoes_push`
- Evento: `INSERT`
- Tipo: Supabase Edge Function
- Função: `enviar-push`
- Método: `POST`
- Autorização: **Add auth header with service key**
- `Content-Type`: `application/json`

A função confere a chave de serviço antes de aceitar o webhook. Requisições públicas são recusadas.

## 4. Gerar e testar o APK

Sincronize o Android e gere um APK novo. Ao entrar pela primeira vez, permita notificações. Teste com dois usuários em dois celulares:

1. Envie uma mensagem individual com o app do destinatário fechado.
2. Envie uma mensagem em uma guilda.
3. Teste foto, áudio, convite e treino marcado.
4. Toque na notificação e confirme que a tela correta é aberta.

Também são gerados avisos para curtidas, comentários, novos seguidores e solicitações de entrada em guildas.
