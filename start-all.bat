@echo off
echo ==========================================
echo   🔥 Flamboys Roasting Kit - Local Dev 🔥
echo ==========================================
echo.
echo Starting all services...
echo.

echo 1. Starting API (NestJS)...
start "API SERVER (Port 4000)" cmd /k "cd apps/api && pnpm start:dev"

echo 2. Starting Web Admin (Next.js)...
start "WEB ADMIN (Port 3000)" cmd /k "cd apps/web && pnpm run dev"

echo 3. Starting Mobile (Expo)...
start "MOBILE APP (Expo)" cmd /k "cd apps/mobile && npx expo start -c"

echo.
echo ✅ All systems go! 
echo Check the popup windows for logs.
echo.
pause
