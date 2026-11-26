const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const documentRepository = require('../repositories/documentRepository');

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

async function create(file) {
  const document = {
    id: crypto.randomUUID(),
    originalName: sanitizeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: process.env.DEFAULT_OWNER_ID || 'demo-user',
    filePath: file.path,
    contentType: file.mimetype,
  };

  try {
    documentRepository.save(document);
  } catch (error) {
    try {
      await documentRepository.removeFile(file.path);
    } catch (cleanupError) {
      error.cleanupError = cleanupError;
    }
    throw error;
  }

  return toPublicDocument(document);
}

async function list() {
  const documents = documentRepository.findAll();
  return documents
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

async function getForDownload(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    const error = new Error('Documento não encontrado.');
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  try {
    await fs.access(document.filePath);
  } catch (cause) {
    const error = new Error('Não foi possível acessar o arquivo armazenado.');
    error.statusCode = 500;
    error.code = 'STORAGE_ERROR';
    error.cause = cause;
    throw error;
  }

  return document;
}

module.exports = { create, list, getForDownload };