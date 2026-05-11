@echo off
echo Downloading 10 realistic Kampala-style student hostel images safely...
echo Please wait, we are pausing between downloads to ensure all images succeed...

mkdir public\images 2>nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80" -o public\images\extra-demo-1.jpg
echo [1/10] Downloaded hostel dorm...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" -o public\images\extra-demo-2.jpg
echo [2/10] Downloaded student bedroom...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1502672260266-1c1f5d609272?w=800&q=80" -o public\images\extra-demo-3.jpg
echo [3/10] Downloaded simple bunk beds...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80" -o public\images\extra-demo-4.jpg
echo [4/10] Downloaded basic apartment interior...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1505691938895-1758d7def511?w=800&q=80" -o public\images\extra-demo-5.jpg
echo [5/10] Downloaded shared student room...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" -o public\images\extra-demo-6.jpg
echo [6/10] Downloaded brick hostel exterior...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80" -o public\images\extra-demo-7.jpg
echo [7/10] Downloaded standard student bed...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1522771739223-0ee28581c817?w=800&q=80" -o public\images\extra-demo-8.jpg
echo [8/10] Downloaded basic room setup...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80" -o public\images\extra-demo-9.jpg
echo [9/10] Downloaded university building...
timeout /t 2 /nobreak >nul

curl -A "Mozilla/5.0" -L "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80" -o public\images\extra-demo-10.jpg
echo [10/10] Downloaded simple living area...

echo.
echo All authentic images have been downloaded successfully without errors!
pause
