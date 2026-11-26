const documentService = require('../services/documentService');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Envie um arquivo no campo file.');
      error.statusCode = 400;
      error.code = 'FILE_REQUIRED';
      throw error;
    }

    const document = await documentService.create(req.file);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentService.list();
    res.status(200).json({ documents });
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const document = await documentService.getForDownload(req.params.id);
    res.download(document.filePath, document.originalName, { headers: { 'Content-Type': document.contentType } }, (error) => {
      if (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, list, download };