import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const blob = await downloadDocument(document.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      onError(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      className="download-button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={`Baixar ${document.originalName}`}
    >
      <span aria-hidden="true">↓</span>
      <span>{isDownloading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}