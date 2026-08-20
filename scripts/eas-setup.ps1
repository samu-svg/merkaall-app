# Configura EAS (init + variáveis) e opcionalmente dispara o build preview.
# Uso: npx eas login   (uma vez, no navegador)
#      .\scripts\eas-setup.ps1
#      .\scripts\eas-setup.ps1 -Build

param(
    [switch]$Build
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Read-DotEnvValue([string]$Name) {
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) {
        throw "Arquivo .env ausente. Copie .env.example e preencha EXPO_PUBLIC_SUPABASE_*."
    }
    foreach ($line in Get-Content $envFile) {
        if ($line -match "^\s*#") { continue }
        if ($line -match "^\s*$Name\s*=\s*(.+)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    throw "Variável $Name não encontrada em .env"
}

function Import-ExpoTokenFromEnvFile {
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) { return }
    foreach ($line in Get-Content $envFile) {
        if ($line -match "^\s*#") { continue }
        if ($line -match "^\s*EXPO_TOKEN\s*=\s*(.+)\s*$") {
            $token = $Matches[1].Trim().Trim('"').Trim("'")
            if ($token) {
                $env:EXPO_TOKEN = $token
                Write-Host ">> EXPO_TOKEN carregado do .env"
            }
            return
        }
    }
}

Import-ExpoTokenFromEnvFile

Write-Host ">> Verificando login EAS..."
$whoami = npx eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "CLI ainda sem sessao. Faca UM dos dois:" -ForegroundColor Yellow
    Write-Host "  1) No terminal: npx eas login  (e confirme no navegador)" -ForegroundColor Cyan
    Write-Host "  2) Token em https://expo.dev/settings/access-tokens" -ForegroundColor Cyan
    Write-Host "     Adicione no .env: EXPO_TOKEN=seu_token" -ForegroundColor Cyan
    Write-Host "     Depois: npm run eas:setup" -ForegroundColor Cyan
    exit 1
}
Write-Host "   Logado como: $whoami"

$supabaseUrl = Read-DotEnvValue "EXPO_PUBLIC_SUPABASE_URL"
$supabaseKey = Read-DotEnvValue "EXPO_PUBLIC_SUPABASE_ANON_KEY"
if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    throw "EXPO_PUBLIC_SUPABASE_ANON_KEY vazio no .env"
}

Write-Host ">> Vinculando projeto EAS (eas init)..."
npx eas init --non-interactive --force
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

function Set-EasEnv([string]$Name, [string]$Value, [string]$Visibility) {
    Write-Host ">> Variável EAS: $Name"
    $output = npx eas env:create `
        --name $Name `
        --value $Value `
        --environment preview `
        --environment production `
        --visibility $Visibility `
        --scope project `
        --non-interactive `
        --force 2>&1
    $output | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Aviso: eas env:create retornou $LASTEXITCODE (variável pode já existir)." -ForegroundColor DarkYellow
    }
}

Set-EasEnv "EXPO_PUBLIC_SUPABASE_URL" $supabaseUrl "plaintext"
Set-EasEnv "EXPO_PUBLIC_SUPABASE_ANON_KEY" $supabaseKey "sensitive"

Write-Host ""
Write-Host "EAS configurado." -ForegroundColor Green
Write-Host "  app.json deve conter extra.eas.projectId"
Write-Host ""

if ($Build) {
    Write-Host ">> Iniciando build preview (Android + iOS)..."
    Write-Host "   iOS interno exige Apple Developer; registre o iPhone com: npx eas device:create"
    npx eas build --platform all --profile preview --non-interactive
    exit $LASTEXITCODE
}

Write-Host "Próximo passo:" -ForegroundColor Cyan
Write-Host "  .\scripts\eas-setup.ps1 -Build"
Write-Host "  ou: npm run build:preview"
