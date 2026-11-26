const path = require('node:path');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function sanitizeOriginalName(originalName) {
  const safeName = path.basename(originalName.replace(/[\\/]/g, '_'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return safeName || 'document';
}

module.exports = { toPublicDocument, sanitizeOriginalName };
