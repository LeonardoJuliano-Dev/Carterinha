@echo off
title Carterinha - Compilar APK Android
echo ========================================================
echo  CARTERINHA - A GERAR APK STANDALONE ANDROID VIA EAS
echo ========================================================
echo.
cd /d "%~dp0"
set PATH=C:\Program Files\Git\cmd;%PATH%
set EAS_NO_VCS=1

call npx eas-cli build -p android --profile preview

echo.
pause
