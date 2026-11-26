const API_PREFIX = '/api';

async function getError(response) {
  try {
    const body = await response.json();
    const error = new Error(body?.error?.message || 'Não foi possível concluir a solicitação.');
    error.code = body?.error?.code;
    error.status = response.status;
    return error;
  } catch {
    return new Error('Não foi possível concluir a solicitação.');
  }
}

async function request(path, options) {
  const response = await fetch(`${API_PREFIX}${path}`, options);
  if (!response.ok) throw await getError(response);
  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}