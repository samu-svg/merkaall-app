@echo off
cd /d "%~dp0.."

echo.
echo === Merkaall - Build PRODUCTION Android (AAB para Google Play) ===
echo Perfil: production ^| Formato: .aab ^| Package: com.Merkaall
echo.
echo NAO use o APK do perfil preview na Play Console.
echo.

node node_modules\eas-cli\bin\run whoami >nul 2>&1
if errorlevel 1 (
  echo Faca login: npm run eas:login
  exit /b 1
)

node node_modules\eas-cli\bin\run build --platform android --profile production %*
