@echo off
title Carterinha - Modo Web
echo ========================================================
echo   A Iniciar Carterinha no Navegador Web (Local-First)
echo ========================================================
echo.

echo [1/2] A iniciar o Microservico FastAPI na porta 8000...
start "Backend FastAPI (Porta 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] A iniciar o Expo em modo Web...
cd mobile
call npx.cmd expo start --web
