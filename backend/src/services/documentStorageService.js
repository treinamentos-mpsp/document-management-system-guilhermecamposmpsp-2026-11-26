const fs = require('node:fs/promises');

async function removeFile(filePath) {
  await fs.unlink(filePath);
}

async function ensureAccessible(filePath) {
  try {
    await fs.access(filePath);
  } catch (cause) {
    const error = new Error('Não foi possível acessar o arquivo armazenado.');
    error.statusCode = 500;
    error.code = 'STORAGE_ERROR';
    error.cause = cause;
    throw error;
  }
}

module.exports = { removeFile, ensureAccessible };
