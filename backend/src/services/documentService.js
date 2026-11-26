const fs = require('node:fs/promises');
const documentRepository = require('../repositories/documentRepository');
const { createDocumentMetadata, sortNewestFirst, toPublicDocument } = require('./documentMetadata');

async function create(file) {
  const document = createDocumentMetadata(file, process.env.DEFAULT_OWNER_ID || 'demo-user');

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
  return sortNewestFirst(documentRepository.findAll()).map(toPublicDocument);
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