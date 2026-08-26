# APK Android do VIVECI

O aplicativo Android usa Capacitor e mantém a mesma interface e lógica da
versão web. O pacote é `com.viveci.app`, com Android mínimo 7.0 (API 24) e alvo
Android 16 (API 36).

## Gerar o APK de teste

Com JDK 21 e Android SDK 36 configurados:

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

O arquivo será criado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

O APK debug é assinado automaticamente com uma chave de desenvolvimento e
serve apenas para instalação e testes. Ele não deve ser publicado na Play
Store. Para publicação, gerar um Android App Bundle (`.aab`) release e guardar
a chave de assinatura fora do repositório.

## Instalar no celular

1. Envie o APK para o celular por cabo, nuvem ou aplicativo de mensagens.
2. Abra o arquivo no Android.
3. Se solicitado, permita a instalação de aplicativos dessa fonte.
4. Toque em **Instalar** e depois em **Abrir**.

O app precisa de internet para autenticação e dados do Supabase. Fotos e câmera
são solicitadas pelo seletor nativo apenas quando o usuário inicia esses fluxos.
