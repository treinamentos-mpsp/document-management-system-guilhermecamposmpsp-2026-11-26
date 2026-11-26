const fs = require('node:fs/promises');
const path = require('node:path');

const backendDirectory = path.resolve(__dirname, '../..');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(backendDirectory, 'storage');

function resolveStoragePath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(storageDirectory, resolvedPath);

  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    const error = new Error('O caminho do arquivo está fora do armazenamento local.');
    error.statusCode = 500;
    error.code = 'STORAGE_ERROR';
    throw error;
  }

  return resolvedPath;
}

async function removeFile(filePath) {
  await fs.unlink(resolveStoragePath(filePath));
}

async function ensureAccessible(filePath) {
  try {
    await fs.access(resolveStoragePath(filePath));
  } catch (cause) {
    const error = new Error('Não foi possível acessar o arquivo armazenado.');
    error.statusCode = 500;
    error.code = 'STORAGE_ERROR';
    error.cause = cause;
    throw error;
  }
}

module.exports = { removeFile, ensureAccessible };
