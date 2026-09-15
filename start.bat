@echo off
title Carterinha - Inicializador Completo
echo ========================================================
echo   A Iniciar Carterinha (Backend FastAPI + Mobile Expo)
echo ========================================================
echo.

echo [1/2] A iniciar o Microservico FastAPI na porta 8000...
start "Backend FastAPI (Porta 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] A iniciar o Frontend Expo Mobile na rede local...
cd mobile
call node ./scripts/start-lan.js
