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

module.exports = { save, findAll, findById, deleteById };