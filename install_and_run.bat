@echo off
echo ==========================================
echo Starting Hostel Booking System Setup...
echo ==========================================

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ==========================================
echo Setup Complete! Starting both servers...
echo ==========================================
echo The frontend will open in your browser shortly.
echo Keep this window open to keep the servers running.

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

pause
