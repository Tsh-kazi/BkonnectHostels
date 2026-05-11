const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

console.log('Downloading 10 additional high-quality demo images from Picsum...');

// Helper function to handle redirects
function downloadImage(url, filePath, filename) {
  https.get(url, (response) => {
    // Handle redirects (301, 302, 307, 308)
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      downloadImage(response.headers.location, filePath, filename);
    } 
    // Handle success
    else if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`✅ Success: ${filename} downloaded!`);
      });
    } 
    else {
      console.error(`❌ Failed: ${filename} returned status code ${response.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`❌ Network Error on ${filename}:`, err.message);
  });
}

// Download 10 images using random seeds from Picsum
for (let i = 1; i <= 10; i++) {
  const filename = `extra-demo-${i}.jpg`;
  const filePath = path.join(IMAGES_DIR, filename);
  
  // Use a specific seed for consistent beautiful images
  const url = `https://picsum.photos/seed/hostel${i}/800/600`;
  
  downloadImage(url, filePath, filename);
}
