@echo off
cd /d "%~dp0.."
echo.
echo === Merkaall - Expo Go (LAN) ===
echo Celular e PC devem estar na MESMA rede Wi-Fi.
echo.
set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  if not defined IP set "IP=%%a"
)
if defined IP set "IP=%IP: =%"
if defined IP (
  echo Se o QR nao funcionar, digite no Expo Go ^(Enter URL^):
  echo   exp://%IP%:8081
  echo.
)
echo Se aparecer "There was a problem running the requested app", libere a porta 8081
echo no Firewall ^(PowerShell como Administrador^):
echo   New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
echo.
echo Alternativa sem firewall: scripts\start-tunnel.cmd
echo.
node node_modules\expo\bin\cli start --lan %*
