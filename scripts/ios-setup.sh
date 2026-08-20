#!/usr/bin/env bash
# Configura EAS (init + variáveis) para iOS e opcionalmente dispara o build preview.
# Uso: npx eas login   (uma vez, no navegador)
#      ./scripts/ios-setup.sh
#      ./scripts/ios-setup.sh --build
#      ./scripts/ios-setup.sh -b

set -euo pipefail

YELLOW='\033[33m'
CYAN='\033[36m'
GREEN='\033[32m'
DARK_YELLOW='\033[33m'
NC='\033[0m'

BUILD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--build)
      BUILD=true
      shift
      ;;
    -h|--help)
      echo "Uso: $0 [-b|--build]"
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      echo "Uso: $0 [-b|--build]" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/.env"

read_dotenv_value() {
  local name="$1"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${YELLOW}Arquivo .env ausente. Copie .env.example e preencha EXPO_PUBLIC_SUPABASE_*.${NC}" >&2
    exit 1
  fi

  local value
  value="$(
    grep -E "^[[:space:]]*${name}[[:space:]]*=" "$ENV_FILE" 2>/dev/null \
      | grep -Ev '^[[:space:]]*#' \
      | head -1 \
      | sed -E "s/^[[:space:]]*${name}[[:space:]]*=[[:space:]]*//" \
      | sed -E 's/^["'\''](.*)["'\'']$/\1/' \
      | sed 's/[[:space:]]*$//'
  )"

  if [[ -z "$value" ]]; then
    echo -e "${YELLOW}Variável ${name} não encontrada em .env${NC}" >&2
    exit 1
  fi

  echo "$value"
}

import_expo_token() {
  if [[ ! -f "$ENV_FILE" ]]; then
    return 0
  fi

  local token
  token="$(
    grep -E '^[[:space:]]*EXPO_TOKEN[[:space:]]*=' "$ENV_FILE" 2>/dev/null \
      | grep -Ev '^[[:space:]]*#' \
      | head -1 \
      | sed -E 's/^[[:space:]]*EXPO_TOKEN[[:space:]]*=[[:space:]]*//' \
      | sed -E 's/^["'\''](.*)["'\'']$/\1/' \
      | sed 's/[[:space:]]*$//'
  )"

  if [[ -n "$token" ]]; then
    export EXPO_TOKEN="$token"
    echo ">> EXPO_TOKEN carregado do .env"
  fi
}

set_eas_env() {
  local name="$1"
  local value="$2"
  local visibility="$3"
  local exit_code=0
  local output

  echo ">> Variável EAS: ${name}"
  set +e
  output="$(
    npx eas env:create \
      --name "$name" \
      --value "$value" \
      --environment preview \
      --environment production \
      --visibility "$visibility" \
      --scope project \
      --non-interactive \
      --force 2>&1
  )"
  exit_code=$?
  set -e

  if [[ -n "$output" ]]; then
    echo "$output"
  fi

  if [[ $exit_code -ne 0 ]]; then
    echo -e "   ${DARK_YELLOW}Aviso: eas env:create retornou ${exit_code} (variável pode já existir).${NC}"
  fi
}

import_expo_token

echo ">> Verificando login EAS..."
whoami_out=""
if whoami_out="$(npx eas whoami 2>&1)"; then
  echo "   Logado como: ${whoami_out}"
else
  echo ""
  echo -e "${YELLOW}CLI ainda sem sessão. Faça UM dos dois:${NC}"
  echo -e "  ${CYAN}1) No terminal: npx eas login  (e confirme no navegador)${NC}"
  echo -e "  ${CYAN}2) Token em https://expo.dev/settings/access-tokens${NC}"
  echo -e "     ${CYAN}Adicione no .env: EXPO_TOKEN=seu_token${NC}"
  echo -e "     ${CYAN}Depois: ./scripts/ios-setup.sh${NC}"
  exit 1
fi

supabase_url="$(read_dotenv_value "EXPO_PUBLIC_SUPABASE_URL")"
supabase_key="$(read_dotenv_value "EXPO_PUBLIC_SUPABASE_ANON_KEY")"

if [[ -z "${supabase_key// }" ]]; then
  echo -e "${YELLOW}EXPO_PUBLIC_SUPABASE_ANON_KEY vazio no .env${NC}" >&2
  exit 1
fi

echo ">> Vinculando projeto EAS (eas init)..."
npx eas init --non-interactive --force

set_eas_env "EXPO_PUBLIC_SUPABASE_URL" "$supabase_url" "plaintext"
set_eas_env "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$supabase_key" "sensitive"

echo ""
echo -e "${GREEN}EAS configurado.${NC}"
echo "  app.json deve conter extra.eas.projectId"
echo ""

if [[ "$BUILD" == true ]]; then
  echo ">> Iniciando build preview iOS..."
  echo -e "   ${YELLOW}O primeiro build iOS é interativo: o EAS pedirá credenciais Apple.${NC}"
  echo "   iOS interno exige Apple Developer; registre o iPhone com: npx eas device:create"
  npx eas build --platform ios --profile preview
  exit $?
fi

echo -e "${CYAN}Próximos passos:${NC}"
echo "  ./scripts/ios-setup.sh --build"
echo "  ou: npm run build:preview:ios"
echo "  simulador: eas build --platform ios --profile ios-simulator"
