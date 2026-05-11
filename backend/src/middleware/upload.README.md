# Upload Middleware Documentation

## Overview

This middleware handles file uploads for payment receipts using Multer. It provides file type validation, size limits, and automatic filename generation.

## Features

- **File Type Validation**: Accepts only JPEG, PNG, and PDF files
- **Size Limit**: Maximum file size of 5MB
- **Automatic Filename Generation**: Format `{transactionId}_{timestamp}.{ext}`
- **Directory Management**: Automatically creates upload directory if it doesn't exist
- **Error Handling**: Comprehensive error messages for validation failures

## Usage

### Basic Usage

```javascript
const { upload, handleMulterError } = require('./middleware/upload');

// Single file upload
router.post('/transactions/:id/receipt', 
  authenticate,
  upload.single('receipt'),
  handleMulterError,
  async (req, res) => {
    // req.file contains the uploaded file
    // req.file.filename contains the generated filename
    // req.file.path contains the full path to the file
  }
);
```

### Configuration

The middleware is configured with the following settings:

- **Storage Location**: `/backend/uploads/receipts/`
- **Accepted MIME Types**: 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `application/pdf`
- **File Size Limit**: 5MB (5,242,880 bytes)
- **Filename Format**: `{transactionId}_{timestamp}.{ext}`

### Error Responses

#### File Too Large (400)
```json
{
  "error": "File too large",
  "message": "Receipt file must be under 5MB",
  "maxSize": 5242880
}
```

#### Invalid File Type (400)
```json
{
  "error": "Invalid file type",
  "message": "Only JPEG, PNG, and PDF files are accepted",
  "acceptedTypes": ["image/jpeg", "image/png", "application/pdf"]
}
```

#### Upload Failed (500)
```json
{
  "error": "Upload failed",
  "message": "Failed to save receipt file. Please try again."
}
```

## File Structure

```
backend/
├── uploads/
│   └── receipts/
│       ├── .gitkeep
│       └── {transactionId}_{timestamp}.{ext}
└── src/
    └── middleware/
        └── upload.js
```

## Security Considerations

1. **File Type Validation**: Only specific MIME types are accepted
2. **Size Limits**: Prevents large file uploads that could consume disk space
3. **Filename Sanitization**: Generated filenames prevent path traversal attacks
4. **Directory Isolation**: Files are stored in a dedicated directory

## Requirements Satisfied

- **Requirement 3.2**: Accept image files (JPEG, PNG)
- **Requirement 3.3**: Accept PDF files
- **Requirement 3.4**: Validate files under 5MB
- **Requirement 3.5**: Store receipt files securely

## Future Enhancements

- Virus scanning integration
- Cloud storage support (S3, Azure Blob)
- Image compression and optimization
- Thumbnail generation for images
