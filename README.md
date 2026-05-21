# PromoçãoPro — App mobile (Expo)

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

## Instalar e rodar

```bash
cd c:\promocaopro-mobile
npm install
npx expo start
```

- Escaneie o QR com **Expo Go** (Android/iOS)
- Ou pressione `a` (Android emulator) / `i` (iOS simulator no Mac)

## Estrutura

```
lib/types.ts       — tipo Promocao (igual ao web)
lib/supabase.ts    — cliente + buscarPromocoes()
hooks/usePromocoesFeed.ts — lista + Realtime
components/        — card e filtro por categoria
App.tsx            — tela principal
```

## Publicar nas lojas (fase seguinte)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

## Abrir no Cursor

**File → Open Folder** → `c:\promocaopro-mobile`

O scraper e o site continuam em `c:\promoçõesPro` — este projeto só lê o banco.
