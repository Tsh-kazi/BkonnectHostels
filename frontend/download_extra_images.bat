@echo off
echo Downloading 10 additional high-quality demo images...

mkdir public\images 2>nul

curl -L "https://picsum.photos/seed/hostel1/800/600" -o public\images\extra-demo-1.jpg
echo [1/10] Downloaded extra-demo-1.jpg
curl -L "https://picsum.photos/seed/hostel2/800/600" -o public\images\extra-demo-2.jpg
echo [2/10] Downloaded extra-demo-2.jpg
curl -L "https://picsum.photos/seed/hostel3/800/600" -o public\images\extra-demo-3.jpg
echo [3/10] Downloaded extra-demo-3.jpg
curl -L "https://picsum.photos/seed/hostel4/800/600" -o public\images\extra-demo-4.jpg
echo [4/10] Downloaded extra-demo-4.jpg
curl -L "https://picsum.photos/seed/hostel5/800/600" -o public\images\extra-demo-5.jpg
echo [5/10] Downloaded extra-demo-5.jpg
curl -L "https://picsum.photos/seed/hostel6/800/600" -o public\images\extra-demo-6.jpg
echo [6/10] Downloaded extra-demo-6.jpg
curl -L "https://picsum.photos/seed/hostel7/800/600" -o public\images\extra-demo-7.jpg
echo [7/10] Downloaded extra-demo-7.jpg
curl -L "https://picsum.photos/seed/hostel8/800/600" -o public\images\extra-demo-8.jpg
echo [8/10] Downloaded extra-demo-8.jpg
curl -L "https://picsum.photos/seed/hostel9/800/600" -o public\images\extra-demo-9.jpg
echo [9/10] Downloaded extra-demo-9.jpg
curl -L "https://picsum.photos/seed/hostel10/800/600" -o public\images\extra-demo-10.jpg
echo [10/10] Downloaded extra-demo-10.jpg

echo.
echo All images have been downloaded successfully!
pause
