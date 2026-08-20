@echo off
cd /d "%~dp0.."
echo.
echo === Merkaall - Expo Go (TUNNEL) ===
echo Funciona mesmo com firewall ou Wi-Fi diferente. Pode demorar ~30s.
echo Aguarde a URL exp:// aparecer abaixo e escaneie o QR no terminal.
echo.
node node_modules\expo\bin\cli start --tunnel %*
