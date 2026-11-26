const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const express = require('express');
const documentController = require('../controllers/documentController');

const router = express.Router();
const backendDirectory = path.resolve(__dirname, '../..');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(backendDirectory, 'storage');

const mimeTypesByExtension = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

const configuredMimeTypes = process.env.ALLOWED_FILE_TYPES
  ? process.env.ALLOWED_FILE_TYPES.split(',').map((type) => type.trim()).filter(Boolean)
  : Object.values(mimeTypesByExtension);
const allowedMimeTypes = new Set(configuredMimeTypes);
const supportedMimeTypes = new Set(Object.values(mimeTypesByExtension));

if ([...allowedMimeTypes].some((type) => !supportedMimeTypes.has(type))) {
  throw new Error('ALLOWED_FILE_TYPES contém um tipo não suportado.');
}

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);
if (!Number.isFinite(maxUploadSizeMb) || maxUploadSizeMb <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_MB deve ser um número positivo.');
}

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, storageDirectory),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadSizeMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = mimeTypesByExtension[extension];

    if (!expectedMimeType || !allowedMimeTypes.has(expectedMimeType) || file.mimetype !== expectedMimeType) {
      const error = new Error('O tipo de arquivo não é permitido.');
      error.statusCode = 415;
      error.code = 'FILE_TYPE_NOT_ALLOWED';
      return callback(error);
    }

    callback(null, true);
  },
});

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;