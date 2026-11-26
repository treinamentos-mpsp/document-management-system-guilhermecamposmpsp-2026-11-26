const crypto = require('node:crypto');
const path = require('node:path');

function sanitizeOriginalName(originalName) {
  const safeName = path.basename(originalName.replace(/[\\/]/g, '_'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return safeName || 'document';
}

function createDocumentMetadata(file, owner) {
  return {
    id: crypto.randomUUID(),
    originalName: sanitizeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    filePath: file.path,
    contentType: file.mimetype,
  };
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function sortNewestFirst(documents) {
  return [...documents].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
}

module.exports = { createDocumentMetadata, toPublicDocument, sortNewestFirst };