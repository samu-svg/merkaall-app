@echo off
cd /d "%~dp0.."

echo.
echo === Merkaall - Build preview Android (EAS) ===
echo Versao: 1.0.3 (versionCode 4)
echo.

node node_modules\eas-cli\bin\run whoami >nul 2>&1
if errorlevel 1 (
  echo Faca login primeiro:
  echo   node node_modules\eas-cli\bin\run login
  echo.
  echo Ou adicione EXPO_TOKEN no .env
  exit /b 1
)

node node_modules\eas-cli\bin\run build --platform android --profile preview %*
