const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const documentStorageService = require('../src/services/documentStorageService');

test('converte falha ao acessar arquivo em erro de armazenamento', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-storage-test-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  await assert.rejects(
    documentStorageService.ensureAccessible(path.join(directory, 'missing.pdf')),
    (error) => error.statusCode === 500
      && error.code === 'STORAGE_ERROR'
      && error.cause instanceof Error,
  );
});
