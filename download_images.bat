@echo off
echo ==============================================
echo BkonnectHomes - Image Downloader
echo ==============================================

if not exist "frontend\public\images" (
    mkdir "frontend\public\images"
    echo [+] Created frontend\public\images folder
)

echo.
echo Downloading Room Demo 1...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80' -OutFile 'frontend\public\images\room-demo-1.jpg'"
echo [✓] Downloaded room-demo-1.jpg

echo.
echo Downloading Room Demo 2...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=80' -OutFile 'frontend\public\images\room-demo-2.jpg'"
echo [✓] Downloaded room-demo-2.jpg

echo.
echo Downloading Room Demo 3...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1598928506311-c55dd1b46328?w=1000&q=80' -OutFile 'frontend\public\images\room-demo-3.jpg'"
echo [✓] Downloaded room-demo-3.jpg

echo.
echo Downloading Room Demo 4...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1000&q=80' -OutFile 'frontend\public\images\room-demo-4.jpg'"
echo [✓] Downloaded room-demo-4.jpg

echo.
echo Downloading Hostel Exterior 1...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80' -OutFile 'frontend\public\images\hostel-demo-1.jpg'"
echo [✓] Downloaded hostel-demo-1.jpg

echo.
echo Downloading Hostel Exterior 2...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1542314831-c6a4d14ecc97?w=1000&q=80' -OutFile 'frontend\public\images\hostel-demo-2.jpg'"
echo [✓] Downloaded hostel-demo-2.jpg

echo.
echo Downloading Hero Background...
powershell -Command "Invoke-WebRequest -Uri 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80' -OutFile 'frontend\public\images\hero-bg.jpg'"
echo [✓] Downloaded hero-bg.jpg

echo.
echo All images downloaded successfully! You can close this window.
pause
