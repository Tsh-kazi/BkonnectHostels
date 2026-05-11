@echo off
echo ==========================================
echo Setting up FULL PRODUCTION Codebase
echo ==========================================

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
call npm install

echo.
echo [2/3] Setting up SQLite Database via Prisma...
call npx prisma generate
call npx prisma db push
call npm run prisma:seed
cd ..

echo.
echo [3/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ==========================================
echo Setup Complete! Starting both servers...
echo ==========================================

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

pause
