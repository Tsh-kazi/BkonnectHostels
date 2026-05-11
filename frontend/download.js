const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\Bawiz\\Hostel\\frontend\\public\\images';

if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80', name: 'room-demo-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=80', name: 'room-demo-2.jpg' },
  { url: 'https://images.unsplash.com/photo-1598928506311-c55dd1b46328?w=1000&q=80', name: 'room-demo-3.jpg' },
  { url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1000&q=80', name: 'room-demo-4.jpg' },
  { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&q=80', name: 'hostel-demo-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1542314831-c6a4d14ecc97?w=1000&q=80', name: 'hostel-demo-2.jpg' },
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80', name: 'hero-bg.jpg' }
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Unsplash redirects heavily
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

(async () => {
  console.log("Starting downloads...");
  for (const img of images) {
    const dest = path.join(targetDir, img.name);
    try {
      await download(img.url, dest);
      console.log(`Downloaded ${img.name}`);
    } catch (e) {
      console.error(`Failed to download ${img.name}`, e);
    }
  }
  console.log("All done!");
})();
