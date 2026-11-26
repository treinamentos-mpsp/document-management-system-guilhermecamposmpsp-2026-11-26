const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const documentStorageService = require('../src/services/documentStorageService');

test('converte falha ao acessar arquivo em erro de armazenamento', async () => {
  const storageDirectory = process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, '../storage');
  await assert.rejects(
    documentStorageService.ensureAccessible(path.join(storageDirectory, `${crypto.randomUUID()}.missing`)),
    (error) => error.statusCode === 500
      && error.code === 'STORAGE_ERROR'
      && error.cause instanceof Error,
  );
});

test('rejeita caminhos fora do diretório de armazenamento', async () => {
  const storageDirectory = process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, '../storage');

  await assert.rejects(
    documentStorageService.ensureAccessible(path.resolve(storageDirectory, '../outside.pdf')),
    (error) => error.statusCode === 500 && error.code === 'STORAGE_ERROR',
  );
});
