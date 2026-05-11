@echo off
echo ==========================================
echo Setting up the SQLite Database
echo ==========================================

cd backend
echo Pushing schema to database...
call npx prisma db push

echo.
echo Seeding mock data...
call npx prisma db seed

echo.
echo Database setup complete! You can now browse the frontend.
pause
