# Erro de assinatura na Google Play (upload key)

## Sintoma

```
O APK ou Android App Bundle precisa ter o nome de pacote com.Merkaall
Seu Android App Bundle foi assinado com uma chave incorreta...
SHA1 esperado: 05:8C:EC:...
SHA1 enviado:  B7:3A:4A:...
```

## Causa

São **dois problemas distintos**:

| Problema | Detalhe |
|--------|---------|
| **Package name** | Builds antigos usavam `com.merkaall.app`. A Play exige `com.Merkaall`. Já corrigido no `app.json` — use só o **build production mais recente**. |
| **Chave de upload** | A Play Console foi criada com outra keystore (`05:8C:EC:…`). O EAS assina com uma keystore nova (`B7:3A:4A:…`). |

## Passo 1 — Use o AAB correto

Confirme no build EAS:

- **Profile:** `production`
- **Package:** `com.Merkaall`
- **Formato:** AAB (não APK)

Build mais recente (exemplo):  
https://expo.dev/accounts/samueldourado.mendes/projects/promocaopro-mobile/builds/2575ab97-a9cc-432c-b5b0-ca85d9509fc3

**Não envie** builds antigos com `com.merkaall.app`.

## Passo 2 — Redefinir a upload key na Play Console

1. Gere o certificado PEM da keystore do EAS:

   ```bash
   npm run play:export-upload-cert
   ```

   Isso cria `upload_certificate.pem` na raiz do projeto mobile.

2. No [Google Play Console](https://play.google.com/console):

   - Abra o app **Merkaall**
   - **Configuração** → **Integridade do app** → **Assinatura de apps**
   - **Solicitar redefinição da chave de upload**
   - Envie o arquivo `upload_certificate.pem`

3. Aguarde aprovação da Google (**1–3 dias úteis**).

4. Depois da aprovação:

   ```bash
   npm run build:production
   ```

   Envie o novo AAB na Play Console.

## Alternativa (se você tiver a keystore original)

Se ainda tiver o `.jks` com SHA1 `05:8C:EC:…` (Android Studio, backup antigo):

```bash
npx eas credentials -p android
```

→ production → Keystore → **Upload existing keystore**

Assim não precisa reset na Google.

## Fingerprints de referência

| Origem | SHA1 |
|--------|------|
| Play Console (esperado) | `05:8C:EC:B4:5B:4E:FA:1E:4F:48:E6:BC:58:91:AE:9F:F3:54:09:41` |
| EAS / build atual | `B7:3A:4A:24:91:9C:F4:F7:1E:2D:FE:12:01:7E:0D:05:A5:7C:0E:F9` |
