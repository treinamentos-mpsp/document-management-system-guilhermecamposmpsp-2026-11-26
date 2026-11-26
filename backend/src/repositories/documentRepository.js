const fs = require('node:fs/promises');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
}

function findAll() {
  return [...documents.values()];
}

function findById(id) {
  return documents.get(id) || null;
}

function deleteById(id) {
  return documents.delete(id);
}

async function removeFile(filePath) {
  await fs.unlink(filePath);
}

module.exports = { save, findAll, findById, deleteById, removeFile };