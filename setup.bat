@echo off
echo Starting Swahit Project Setup...
echo ==================================

echo.
echo [1/3] Cleaning up corrupted npm installations...
if exist node_modules rmdir /s /q node_modules
if exist apps\backend\node_modules rmdir /s /q apps\backend\node_modules
if exist apps\frontend\node_modules rmdir /s /q apps\frontend\node_modules

echo.
echo [2/3] Installing dependencies using pnpm workspace...
call pnpm install

echo.
echo [3/3] Adding new production dependencies (logging, caching) to backend...
call pnpm add nestjs-pino pino-http pino-pretty cache-manager-redis-yet --filter backend

echo.
echo ==================================
echo Setup Complete! 
echo You can now use start.bat to run the project.
pause
