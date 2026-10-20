@echo off
title Sistema La Bodega Verde
echo ============================================================
echo   Iniciando La Bodega Verde (Backend NestJS + Frontend Next.js)
echo ============================================================
echo.

echo Iniciando Backend en puerto 3001...
start "Backend - NestJS (Port 3001)" cmd /k "cd /d "%~dp0prisma" && npm run start:dev"

timeout /t 3 /nobreak >nul

echo Limpiando cache previa y arrancando Frontend en puerto 3000...
start "Frontend - Next.js (Port 3000)" cmd /k "cd /d "%~dp0frontend" && if exist .next rmdir /s /q .next && npm run dev"

echo.
echo ============================================================
echo   Servicios en ejecucion:
echo   - Backend API:    http://localhost:3001
echo   - Frontend Web:   http://localhost:3000
echo ============================================================
echo.
pause
