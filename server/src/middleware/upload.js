// filepath: server/src/middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type '${file.mimetype}'. Only images are allowed.`), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type '${file.mimetype}'. Allowed: images, PDF, DOC, DOCX.`), false);
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Single file upload (images + documents) — max 50MB
const uploadSingle = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
}).single('file');

// Multiple file upload — max 10 files, 50MB each
const uploadMultiple = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
}).array('files', 10);

// PDF only — max 100MB
const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('pdf');

module.exports = { uploadSingle, uploadMultiple, uploadPDF };
