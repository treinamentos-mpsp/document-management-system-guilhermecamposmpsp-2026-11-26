const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const { once } = require('node:events');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async (context) => {
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedId;

  context.after(async () => {
    server.close();
    await once(server, 'close');

    if (uploadedId) {
      const storedDocument = documentRepository.findById(uploadedId);
      if (storedDocument) {
        documentRepository.deleteById(uploadedId);
        await fs.unlink(storedDocument.filePath);
      }
    }
  });

  const form = new FormData();
  form.append('file', new Blob(['document contents'], { type: 'application/pdf' }), 'report.pdf');
  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(uploadResponse.status, 201);

  const uploadedDocument = await uploadResponse.json();
  uploadedId = uploadedDocument.id;
  assert.deepStrictEqual(Object.keys(uploadedDocument).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.strictEqual(uploadedDocument.originalName, 'report.pdf');
  assert.strictEqual(uploadedDocument.owner, 'demo-user');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const listedDocuments = await listResponse.json();
  assert.strictEqual(listedDocuments.documents.length, 1);
  assert.strictEqual(listedDocuments.documents[0].id, uploadedId);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="report\.pdf"/);
  assert.strictEqual(await downloadResponse.text(), 'document contents');
});

test('retorna erros para upload ausente, tipo não permitido e documento inexistente', async (context) => {
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  context.after(() => {
    server.close();
    return once(server, 'close');
  });

  const emptyUpload = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });
  assert.strictEqual(emptyUpload.status, 400);
  assert.strictEqual((await emptyUpload.json()).error.code, 'FILE_REQUIRED');

  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['image'], { type: 'image/png' }), 'image.png');
  const invalidUpload = await fetch(`${baseUrl}/upload`, { method: 'POST', body: invalidForm });
  assert.strictEqual(invalidUpload.status, 415);
  assert.strictEqual((await invalidUpload.json()).error.code, 'FILE_TYPE_NOT_ALLOWED');

  const oversizedForm = new FormData();
  const oversizedFile = new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: 'application/pdf' });
  oversizedForm.append('file', oversizedFile, 'large.pdf');
  const oversizedUpload = await fetch(`${baseUrl}/upload`, { method: 'POST', body: oversizedForm });
  assert.strictEqual(oversizedUpload.status, 413);
  assert.strictEqual((await oversizedUpload.json()).error.code, 'FILE_TOO_LARGE');

  const missingDocument = await fetch(`${baseUrl}/documents/not-found/download`);
  assert.strictEqual(missingDocument.status, 404);
  assert.strictEqual((await missingDocument.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
