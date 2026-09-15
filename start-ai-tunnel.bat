@echo off
title Carterinha - Iniciar Servidor de IA com Tunel Publico
echo ========================================================
echo   Carterinha - Iniciar Backend FastAPI + Tunel Publico
echo ========================================================
echo.

echo [1/2] A iniciar o Microservico FastAPI na porta 8000...
start "Backend FastAPI (Porta 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] A criar Tunel Publico gratuito na porta 8000...
echo.
echo =========================================================================
echo   Copie o link HTTPS que vai aparecer abaixo (ex: https://xxx.loca.lt)
echo   e cole-o no seu telemovel em: Mais -> Servidor de IA / Tunel
echo =========================================================================
echo.

npx --yes localtunnel --port 8000
