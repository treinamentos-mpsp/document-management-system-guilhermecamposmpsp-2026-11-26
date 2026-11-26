import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, onDownloadError }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos…</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <div>
          <h3>Nenhum documento ainda</h3>
          <p>Os arquivos enviados aparecerão aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="document-type" aria-hidden="true">
            {document.originalName.split('.').pop().slice(0, 4).toUpperCase()}
          </span>
          <div className="document-info">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>{formatFileSize(document.size)} <span>·</span> {formatDate(document.uploadedAt)}</p>
          </div>
          <span className="document-owner">{document.owner}</span>
          <DownloadButton document={document} onError={onDownloadError} />
        </li>
      ))}
    </ul>
  );
}