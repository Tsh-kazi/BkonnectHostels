const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate filename: transactionId_timestamp.ext
    const transactionId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${transactionId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Accept only JPEG, PNG, and PDF files
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are accepted.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Receipt file must be under 5MB',
        maxSize: 5242880
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  } else if (err) {
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and PDF files are accepted',
        acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf']
      });
    }
    return res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to save receipt file. Please try again.'
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError
};
