const { test } = require('node:test');
const assert = require('node:assert/strict');
const documentPresenter = require('../src/services/documentPresenter');

test('sanitiza nomes de arquivo e aplica fallback para nomes vazios', () => {
  assert.strictEqual(documentPresenter.sanitizeOriginalName('../report\\final.pdf'), '.._report_final.pdf');
  assert.strictEqual(documentPresenter.sanitizeOriginalName('\u0000 \u007f'), 'document');
});

test('expõe apenas metadados públicos do documento', () => {
  const result = documentPresenter.toPublicDocument({
    id: 'document-id',
    originalName: 'report.pdf',
    size: 12,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    owner: 'demo-user',
    filePath: '/private/report.pdf',
    contentType: 'application/pdf',
  });

  assert.deepStrictEqual(result, {
    id: 'document-id',
    originalName: 'report.pdf',
    size: 12,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    owner: 'demo-user',
  });
});
