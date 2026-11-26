const crypto = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const documentPresenter = require('./documentPresenter');
const documentStorageService = require('./documentStorageService');

async function create(file) {
  const document = {
    id: crypto.randomUUID(),
    originalName: documentPresenter.sanitizeOriginalName(file.originalname),
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
      await documentStorageService.removeFile(file.path);
    } catch (cleanupError) {
      error.cleanupError = cleanupError;
    }
    throw error;
  }

  return documentPresenter.toPublicDocument(document);
}

async function list() {
  const documents = documentRepository.findAll();
  return documents
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(documentPresenter.toPublicDocument);
}

async function getForDownload(id) {
  const document = documentRepository.findById(id);
  if (!document) {
    const error = new Error('Documento não encontrado.');
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  await documentStorageService.ensureAccessible(document.filePath);
  return document;
}

module.exports = { create, list, getForDownload };