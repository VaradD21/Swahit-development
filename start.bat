@echo off
echo Starting Swahit Project...
echo ==========================

:: Start the backend in a new command prompt window
echo Starting Backend...
start cmd /k "pnpm --filter backend run start:dev"

:: Start the frontend in a new command prompt window
echo Starting Frontend...
start cmd /k "pnpm --filter frontend run dev"

echo Both frontend and backend have been started in separate windows!
echo Close this window if you wish; the servers will keep running in their respective windows.
pause
