# Merkaall — App mobile (Expo)

Cliente iOS/Android que consome as **mesmas promoções** do site (`promoçõesPro`) via Supabase.

## Pré-requisitos

- Node.js 18+
- [Expo Go](https://expo.dev/go) no celular (para testar) ou emulador Android/iOS

## Configuração

1. Copie as credenciais do site:

```bash
copy .env.example .env
```

2. Preencha `.env` com os mesmos valores do `.env.local` do projeto web:

| Site (Next.js) | App (Expo) |
|----------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

**Nunca** coloque `SUPABASE_SERVICE_ROLE_KEY` no app.

## Desenvolvimento (Expo Go — precisa do `expo start`)

No **Cursor**, abra um terminal **cmd** (não PowerShell — a política de execução pode bloquear `npx`):

```cmd
cd C:\Users\doura\Projects\merkaall-app
npm install
scripts\start-dev.cmd
```

- Escaneie o QR com **Expo Go** (Android/iOS) — o QR só aparece em terminal interativo
- Se der *"There was a problem running the requested app"*, o celular não alcança o Metro na porta 8081 (firewall). Opções:
  1. **Firewall (recomendado para LAN):** PowerShell como Administrador:
     ```powershell
     New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
     ```
  2. **Tunnel (sem firewall):** `scripts\start-tunnel.cmd` — aguarde a URL `exp://…` aparecer
  3. **URL manual no Expo Go:** `exp://SEU_IP_LAN:8081` (ex.: `exp://10.20.20.135:8081`)
- Ou pressione `a` (Android emulator) / `i` (iOS simulator no Mac)

## Instalar no celular (sem Expo Go / sem `expo start`)

Gera um app **standalone** (APK no Android; IPA interno ou TestFlight no iOS) com o JavaScript embutido. Depois de instalado, o app abre sozinho — só precisa de internet e do Supabase.

### 1. Conta Expo e EAS

```bash
npm install
npx eas login
```

Complete o login no navegador quando o terminal abrir o link.

**Importante:** entrar em [expo.dev](https://expo.dev) no site **não** autentica o CLI. Confirme com `npx eas whoami`.

Alternativa sem prompt interativo: crie um **Access Token** em [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens), coloque no `.env` como `EXPO_TOKEN=...` (não commite).

Depois rode o script que faz **init + variáveis no EAS** (lê o `.env` local):

```bash
npm run eas:setup
```

Para já disparar o build de teste (Android + iOS):

```bash
npm run eas:setup:build
```

Equivalente manual: `npx eas init` e `eas env:create` (ver `eas.env.example`).

### 2. Variáveis no build (obrigatório)

O `.env` local **não** entra no build na nuvem. Crie as mesmas variáveis no EAS (veja `eas.env.example`):

```bash
npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://SEU-PROJETO.supabase.co" --environment preview --environment production --visibility plaintext

npx eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "SUA_ANON_KEY" --environment preview --environment production --visibility sensitive
```

Use os mesmos valores do `.env.local` do site (`NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`).

### 3. Build de teste (Android + iOS)

```bash
npm run build:preview
```

Ou por plataforma:

```bash
npm run build:preview:android
npm run build:preview:ios
```

Acompanhe em [expo.dev](https://expo.dev) → seu projeto → **Builds**.

### 4. Instalar no Android

1. Quando o build terminar, baixe o **APK** pelo link do EAS (enquanto **Availability** estiver **Available** — artifacts expiram após ~30 dias).
2. Envie ao celular (Drive, cabo, etc.) e instale.
3. Se pedir, permita instalação de fontes desconhecidas.

**Distribuir pelo site:** copie o APK para `promoçõesPro/public/downloads/merkaall.apk` e faça deploy na Vercel. Usuários baixam em **`/download`**. Alternativa: URL em `NEXT_PUBLIC_ANDROID_APK_URL` no site.

### 5. Instalar no iPhone

> **No MacBook?** Veja o guia dedicado: [`docs/ios-macbook/GUIA-IOS-MACBOOK.md`](docs/ios-macbook/GUIA-IOS-MACBOOK.md) — cobre Simulador, credenciais Apple, push (APNs), TestFlight e App Store. Setup no Mac: `npm run ios:setup` (usa `scripts/ios-setup.sh`). Simulador sem conta Apple paga: `npm run build:preview:ios:sim` (perfil `ios-simulator`).

O **primeiro build iOS** precisa rodar no **seu terminal** (modo interativo), para a Expo criar certificados Apple:

```bash
npm run build:preview:ios
```

Responda às perguntas (Apple ID, equipe, etc.). Depois disso, builds seguintes podem usar `--non-interactive`.

Requer **Apple Developer** (conta paga). Duas formas comuns:

**A) Distribuição interna (perfil `preview`)**

1. Registre o iPhone:

   ```bash
   npx eas device:create
   ```

2. Rode `npm run build:preview:ios` de novo (se o primeiro build foi antes de registrar o aparelho).
3. Abra o link do build no EAS e instale no iPhone (perfil de desenvolvedor pode ser necessário em Ajustes).

**B) TestFlight (perfil `production` + loja)**

1. `npm run build:production` (iOS).
2. `npm run submit:stores` (ou envio manual no App Store Connect).
3. Convide testadores no TestFlight.

### 6. Publicar nas lojas (produção)

```bash
npm run build:production
npm run submit:stores
```

Android gera **AAB** (Google Play); iOS vai para App Store Connect.

| Script | O que faz |
|--------|-----------|
| `npm run build:preview` | APK + IPA interno (teste) |
| `npm run build:production` | AAB + build de loja |
| `npm run submit:stores` | Envia builds às lojas |

### Erros comuns

| Erro | Solução |
|------|---------|
| PowerShell encerra no `eas:setup` com texto do npm | Corrigido no script; ou rode os comandos `eas env:create` manualmente |
| `EXPO_PUBLIC_*` com visibility `secret` | Use `sensitive` ou `plaintext` |
| iOS: *non-interactive mode… credentials* | Rode `npm run build:preview:ios` no seu terminal (sem `--non-interactive`) |

Painel de builds: [expo.dev — Merkaall](https://expo.dev/accounts/samueldourado.mendes/projects/promocaopro-mobile/builds) (slug Expo: `merkaall-mobile`)

## Estrutura

```
lib/types.ts       — tipo Promocao (igual ao web)
lib/supabase.ts    — cliente + buscarPromocoes()
hooks/usePromocoesFeed.ts — lista + Realtime
components/        — card e filtro por categoria
App.tsx            — tela principal
```

## Abrir no Cursor

**File → Open Folder** → `c:\promocaopro-mobile`

O scraper e o site continuam em `c:\promoçõesPro` — este projeto só lê o banco.

## Deep link (detalhe da promoção)

Abrir uma oferta direto no app: `merkaall://promo/{uuid-da-promocao}` (também `?id={uuid}`).

## Galeria de fotos no detalhe

Coluna `fotos_urls` (array de text) na tabela `promocoes`. Migração aplicada via `supabase_fotos_migration.sql`.

**Preencher galeria no banco (projeto web `promoçõesPro`):**

```bash
cd scraper
python backfill_fotos_urls.py
python backfill_fotos_urls.py --loja "Shopee"
python backfill_fotos_urls.py --limit 50
```

Novos scrapes gravam `fotos_urls` em todas as lojas: ML (ofertas), AliExpress (`product_small_image_urls` + scrape), Shopee (página do produto com `SHOPEE_FETCH_GALLERY=true`). O backfill atualiza registros antigos.

## Feed gotejado (drip) — promoções soltadas aos poucos

O feed é tempo real (estilo grupo de WhatsApp): assim que uma linha entra na tabela `promocoes`, ela aparece no topo. Para o feed parecer "sempre vivo", as promoções são publicadas **uma a uma, em intervalos variados** (5–8 min por padrão) em vez de despejadas em lote.

Migração: `supabase_feed_drip_migration.sql` (rodar uma vez no SQL Editor). Ela cria:

- `promocoes_fila` — fila de espera (mesmos campos que o scraper preenche);
- `feed_drip_control` — linha única para ajustar o ritmo (`gap_min_minutos`, `gap_max_minutos`, `lote_por_ciclo`, `descartar_apos_horas`, `ativo`);
- `publicar_proxima_promo()` — publica a promo **mais recente** da fila (com piso de qualidade, ignorando ofertas expiradas), descarta o que ficou encalhado e reagenda o próximo disparo com intervalo aleatório;
- job `pg_cron` `drip-feed-promos` (roda a cada minuto; a função decide se é hora de publicar).

**Mudança necessária no scraper (`c:\promoçõesPro`):** em vez de inserir o produto final em `promocoes`, inserir em `promocoes_fila` (ou chamar a RPC `enfileirar_promocao(...)`). O `pg_cron` cuida de mover para `promocoes` no ritmo configurado. Envie para a fila apenas o que já passou pela aprovação/IA.

Ajustar o ritmo:

```sql
-- intervalo 3–10 min
UPDATE public.feed_drip_control SET gap_min_minutos = 3, gap_max_minutos = 10 WHERE id = 1;
-- pausar / retomar
UPDATE public.feed_drip_control SET ativo = false WHERE id = 1;
-- publicar já
UPDATE public.feed_drip_control SET proxima_publicacao_em = now() WHERE id = 1;
```
