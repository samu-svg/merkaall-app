# Guia iOS — Merkaall no MacBook

Passo a passo para desenvolver, testar e publicar o app **Merkaall** (Expo SDK ~54, React Native 0.81) a partir de um Mac. O projeto usa **managed workflow** (sem pasta `ios/` no repositório) e builds na nuvem via **EAS Build**.

---

## 1. Visão geral

| O que | Onde roda |
|-------|-----------|
| Compilar o `.ipa` / `.app` | **Nuvem (EAS)** — não precisa de Mac |
| Dev rápido no Simulador | **Mac** — `expo start` + Simulador |
| Credenciais Apple / certificados | **Mac ou navegador** — primeiro build iOS interativo |
| TestFlight / App Store | **Mac útil, não obrigatório** — submit via EAS CLI |

**Resumo:** você pode gerar builds iOS de qualquer máquina com `eas build`. O MacBook é especialmente útil para:

- Rodar o **Simulador iOS** localmente (dev e testes visuais)
- Responder prompts interativos de **credenciais Apple** no primeiro build
- Registrar dispositivos, TestFlight e envio à App Store com mais conforto
- Instalar builds `.app` de simulador arrastando para o Simulador

**Identificadores do projeto:**

| Campo | Valor |
|-------|-------|
| Nome do app | Merkaall |
| Slug Expo | `promocaopro-mobile` |
| Owner Expo | `samueldourado.mendes` |
| Project ID EAS | `4e7e5529-6b50-45ff-92ba-9bcf7d02663b` |
| Bundle ID iOS | `com.merkaall.app` |
| Scheme (deep link) | `merkaall://promo/{uuid}` |

---

## 2. Pré-requisitos no Mac

### 2.1 Xcode e ferramentas de linha de comando

1. Instale **Xcode** pela App Store (versão recente compatível com iOS 18+).
2. Abra o Xcode uma vez e aceite a licença.
3. Instale as Command Line Tools (se ainda não tiver):

```bash
xcode-select --install
```

4. Aceite a licença via terminal (se necessário):

```bash
sudo xcodebuild -license accept
```

5. Abra o Simulador: **Xcode → Open Developer Tool → Simulator**, ou:

```bash
open -a Simulator
```

### 2.2 Homebrew, Node e dependências

```bash
# Homebrew (se não tiver): https://brew.sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node LTS (escolha uma opção)
brew install node@22
# ou via nvm: https://github.com/nvm-sh/nvm
# nvm install --lts && nvm use --lts

# Watchman (recomendado pelo React Native)
brew install watchman

# EAS CLI (global) ou use npx eas em cada comando
npm install -g eas-cli
```

> **CocoaPods:** em managed workflow com EAS, você **não** precisa instalar CocoaPods localmente para builds na nuvem. Só seria relevante se rodar `npx expo prebuild` e compilar nativamente no Mac.

### 2.3 Contas necessárias

| Conta | Obrigatória para |
|-------|------------------|
| [expo.dev](https://expo.dev) | Builds EAS, credenciais, env vars |
| Apple ID (grátis) | Simulador local com `expo start` |
| **Apple Developer Program (paga, ~US$ 99/ano)** | iPhone físico (distribuição interna), TestFlight, App Store |

> Para **Simulador** e **profile `ios-simulator`**, **não** é necessária conta Apple Developer paga.

---

## 3. Clonar e preparar o projeto

```bash
git clone <URL_DO_REPOSITORIO> promocaopro-mobile
cd promocaopro-mobile
npm install
cp .env.example .env
```

Edite o `.env` e preencha (mesmos valores do backend/site Merkaall):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xtgnqttklwsyecrutmut.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_anon_aqui>
```

**Importante:**

- Use apenas a **anon key** (`EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- **NUNCA** coloque a **service role key** no app mobile — ela bypassa RLS e não deve sair do servidor.
- O `.env` local serve para **desenvolvimento**. Builds EAS usam variáveis criadas na nuvem (seção 5).

Opcional — token para CI/automação sem login interativo:

```bash
# https://expo.dev/settings/access-tokens
EXPO_TOKEN=<seu_token>
```

---

## 4. Rodar no Simulador (dev rápido, sem build de loja)

Este fluxo usa o **runtime de desenvolvimento** do Expo (equivalente conceitual ao Expo Go, mas com o bundle do seu projeto).

```bash
# Terminal 1 — Metro bundler
npx expo start

# No menu do Expo, pressione:
#   i  → abrir no Simulador iOS
```

Atalho via npm:

```bash
npm run ios
# equivalente a: expo start --ios
```

O Simulador deve abrir automaticamente. Se não abrir:

```bash
open -a Simulator
npx expo start
# pressione i
```

**O que você testa aqui:** UI, navegação, Supabase, deep links `merkaall://...`, fluxo geral.

**O que NÃO é idêntico ao app de loja:** assinatura de push em build standalone, Universal Links HTTPS (`https://merkaall.com/promo/...`) e alguns comportamentos nativos finos — para isso use build EAS (seções 6–7).

---

## 5. Login EAS + setup de variáveis

### 5.1 Login

```bash
npx eas login
# ou
npm run eas:login
```

Confirme no navegador. Verifique:

```bash
npx eas whoami
```

### 5.2 Script de setup (`scripts/ios-setup.sh`)

Equivalente macOS do `scripts/eas-setup.ps1` (Windows). O script:

1. Verifica login EAS (`eas whoami`)
2. Lê `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` do `.env`
3. Executa `eas init --non-interactive --force` (vincula o `projectId` em `app.json`)
4. Cria/atualiza variáveis EAS para ambientes **preview** e **production**:
   - `EXPO_PUBLIC_SUPABASE_URL` (visibility: `plaintext`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (visibility: `sensitive`)

```bash
chmod +x scripts/ios-setup.sh
./scripts/ios-setup.sh
```

Com build preview iOS logo em seguida:

```bash
./scripts/ios-setup.sh --build
# ou: ./scripts/ios-setup.sh -b
```

> **Reforço:** variáveis do `.env` local **não** entram automaticamente no build remoto. Elas precisam existir no EAS (`eas env:create` ou via script acima).

Verifique variáveis no dashboard: [expo.dev](https://expo.dev) → projeto **promocaopro-mobile** → **Environment variables**.

---

## 6. Build para o Simulador (sem conta Apple paga)

Profile **`ios-simulator`** em `eas.json` (estende `preview`, com `ios.simulator: true`). Gera um `.app` para Simulador, **sem** certificado Apple Developer.

```bash
eas build --platform ios --profile ios-simulator
```

Acompanhe no terminal ou em [expo.dev/builds](https://expo.dev/accounts/samueldourado.mendes/projects/promocaopro-mobile/builds).

### Instalar no Simulador

1. Baixe o artefato (`.tar.gz` contendo o `.app`).
2. Extraia:

```bash
tar -xzf *.tar.gz
```

3. Com o Simulador aberto, **arraste** o arquivo `.app` para a janela do Simulador.

Ou via linha de comando:

```bash
# Listar simuladores bootados
xcrun simctl list devices booted

# Instalar (substitua SIMULATOR_UDID e caminho do .app)
xcrun simctl install booted ./caminho/para/Merkaall.app

# Abrir o app
xcrun simctl launch booted com.merkaall.app
```

**Ideal para:** testar o app **standalone** (bundle próprio, não Expo Go) no Mac, sem pagar Apple Developer.

---

## 7. Build para iPhone físico (distribuição interna)

Requer **Apple Developer Program** pago.

### 7.1 Primeiro build — modo interativo

O **primeiro** build iOS deve ser **interativo** para a Expo criar certificados, provisioning profile e (opcionalmente) APNs Key:

```bash
npm run build:preview:ios
# equivalente a: eas build --platform ios --profile preview
```

Responda quando solicitado:

- Apple ID
- Equipe (Team ID)
- Deixe o EAS **gerenciar credenciais** (recomendado)

Profile `preview` em `eas.json`: `distribution: internal` — instalação via link EAS, não pela App Store.

### 7.2 Registrar o iPhone

```bash
npx eas device:create
```

Siga as instruções (QR code / UDID). Depois dispare um **novo** build preview para incluir o dispositivo no profile.

### 7.3 Instalar no aparelho

1. Abra o link do build no [dashboard EAS](https://expo.dev/builds).
2. Instale no iPhone (Safari → instalar perfil / app interno conforme instruções da Expo).

---

## 8. Push notifications no iOS

O app usa `expo-notifications` (`lib/push.ts`):

- Obtém **Expo Push Token** via `Notifications.getExpoPushTokenAsync({ projectId })`
- Salva na tabela Supabase `device_push_tokens`
- A Edge Function `supabase/functions/send-push` envia via **Expo Push API** (`https://exp.host/--/api/v2/push/send`)

`app.json` já inclui:

- Plugin `expo-notifications`
- `UIBackgroundModes: ["remote-notification"]`

### Configurar APNs no EAS

Durante o **primeiro build iOS interativo**, escolha deixar a Expo **gerar/gerenciar a APNs Key**.

Para revisar ou recriar depois:

```bash
npx eas credentials
# selecione: iOS → production ou preview → Push Notifications
```

### Testar push

1. Instale um build standalone (preview ou production) em dispositivo **físico** — push no Simulador é limitado.
2. Abra o app e aceite permissão de notificação (registra token em `device_push_tokens`).
3. Envie push de teste: [expo.dev/notifications](https://expo.dev/notifications) (cole o Expo Push Token).
4. Para fluxo completo, dispare a Edge Function `send-push` no Supabase (com promoção válida).

---

## 9. TestFlight + App Store

### 9.1 Build de produção

```bash
npm run build:production
# eas build --platform all --profile production
```

Profile `production`: `distribution: store`, `channel: production`, `autoIncrement: true`.

Somente iOS:

```bash
eas build --platform ios --profile production
```

### 9.2 App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com).
2. Crie o app com bundle ID **`com.merkaall.app`**.
3. Preencha metadados, screenshots e classificação etária.
4. Ícones e splash já estão em `assets/` (`icon.png`, `splash-full.png`, etc.).

### 9.3 Enviar para a loja

```bash
npm run submit:stores
# eas submit --platform all --profile production
```

Para evitar prompts, configure `submit.production.ios` no `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "seu@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

> Substitua pelos valores reais da sua conta Apple — **não** commite senhas.

### 9.4 TestFlight

Após o submit, o build aparece em **TestFlight** no App Store Connect. Convide testadores internos/externos. `ITSAppUsesNonExemptEncryption: false` já está em `app.json` (declaração de criptografia simplificada).

---

## 10. Deep links / Universal Links

### Custom scheme (já configurado)

- Scheme: `merkaall`
- Exemplo: `merkaall://promo/550e8400-e29b-41d4-a716-446655440000`

Teste no Simulador:

```bash
xcrun simctl openurl booted "merkaall://promo/550e8400-e29b-41d4-a716-446655440000"
```

### Universal Links (HTTPS)

`app.json` declara:

```json
"associatedDomains": ["applinks:merkaall.com"]
```

Para funcionar em produção, hospede **`apple-app-site-association`** (sem extensão) em:

```
https://merkaall.com/.well-known/apple-app-site-association
```

Conteúdo de exemplo (substitua `TEAMID` pelo Apple Team ID):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.merkaall.app",
        "paths": ["/promo/*"]
      }
    ]
  }
}
```

Requisitos:

- HTTPS válido
- `Content-Type: application/json`
- Sem redirect na URL do arquivo
- Links HTTPS: `https://merkaall.com/promo/{uuid}`

O parser de deep link está em `lib/deepLink.ts` (paths `/promo/{uuid}`).

---

## 11. Erros comuns no Mac

| Erro / sintoma | Causa provável | Solução |
|----------------|----------------|---------|
| `Authentication with Apple Developer Portal failed` / `non-interactive credentials` | Primeiro build iOS sem sessão interativa | Rode `npm run build:preview:ios` **no terminal** (sem `--non-interactive`); responda Apple ID e equipe |
| `You haven't agreed to the Xcode license` | Licença Xcode não aceita | `sudo xcodebuild -license accept` |
| Simulador não abre ao pressionar `i` | Xcode/Simulator não instalado ou path errado | Instale Xcode; `open -a Simulator`; `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| `EMFILE: too many open files` | Limite de file watchers | Instale watchman: `brew install watchman` |
| Metro trava ou hot reload lento | Watchman ausente ou cache | `brew install watchman`; `npx expo start -c` |
| `eas: command not found` | EAS CLI não no PATH | `npm install -g eas-cli` ou use `npx eas ...` |
| Build falha por env var ausente | Variáveis não criadas no EAS | `./scripts/ios-setup.sh` ou `eas env:list` |
| Node incompatível | Versão muito antiga/instável | Use Node 20+ ou 22 LTS (`node -v`) |
| Push não chega no device | Sem APNs Key ou token inválido | `eas credentials` → Push; teste em [expo.dev/notifications](https://expo.dev/notifications) |
| Universal Link abre Safari, não o app | AASA ausente ou Team ID errado | Verifique `/.well-known/apple-app-site-association` e `appID` |
| `Network request failed` no Simulador | URL Supabase errada no `.env` | Confira `EXPO_PUBLIC_SUPABASE_*` no `.env` local |

---

## 12. Referência rápida de comandos

| Ação | Comando |
|------|---------|
| Instalar dependências | `npm install` |
| Dev no Simulador | `npm run ios` ou `npx expo start` → `i` |
| Login EAS | `npx eas login` |
| Ver usuário logado | `npx eas whoami` |
| Setup EAS + env vars | `./scripts/ios-setup.sh` |
| Setup + build preview iOS | `./scripts/ios-setup.sh --build` |
| Build Simulador (sem Apple paga) | `eas build --platform ios --profile ios-simulator` |
| Build iPhone interno | `npm run build:preview:ios` |
| Registrar iPhone | `npx eas device:create` |
| Credenciais Apple/APNs | `npx eas credentials` |
| Build produção (loja) | `npm run build:production` |
| Submit App Store / Play | `npm run submit:stores` |
| Listar env vars EAS | `npx eas env:list` |
| Abrir Simulador | `open -a Simulator` |
| Instalar .app no Simulador | `xcrun simctl install booted ./Merkaall.app` |
| Testar deep link | `xcrun simctl openurl booted "merkaall://promo/UUID"` |
| Limpar cache Metro | `npx expo start -c` |

---

## Links úteis

- Dashboard Expo: [expo.dev/accounts/samueldourado.mendes/projects/promocaopro-mobile](https://expo.dev/accounts/samueldourado.mendes/projects/promocaopro-mobile)
- Documentação EAS Build: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- Push notifications Expo: [docs.expo.dev/push-notifications/overview](https://docs.expo.dev/push-notifications/overview/)
- Testar push: [expo.dev/notifications](https://expo.dev/notifications)
- Universal Links: [docs.expo.dev/linking/ios-universal-links](https://docs.expo.dev/linking/ios-universal-links/)
