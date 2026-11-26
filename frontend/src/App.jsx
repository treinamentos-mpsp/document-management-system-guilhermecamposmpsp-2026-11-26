import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    listDocuments()
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRefresh() {
    setIsLoading(true);
    setErrorMessage('');
    setNotice('');

    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(file) {
    setIsUploading(true);
    setErrorMessage('');
    setNotice('');

    try {
      const document = await uploadDocument(file);
      setDocuments((currentDocuments) => [
        document,
        ...currentDocuments.filter((item) => item.id !== document.id),
      ]);
      setNotice(`${document.originalName} foi enviado.`);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span> / ARQUIVO</span></span>
        </a>
        <span className="storage-indicator"><span aria-hidden="true" /> ARMAZENAMENTO LOCAL</span>
      </header>

      <main className="workspace" id="inicio">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">GESTÃO DOCUMENTAL <span>／</span> 01</p>
            <h1 id="page-title">Seus documentos<span className="heading-period">.</span></h1>
          </div>
          <p className="page-summary">Um espaço simples para guardar e acessar seus arquivos.</p>
        </section>

        {errorMessage && (
          <div className="feedback feedback-error" role="alert">
            <span>{errorMessage}</span>
            <button type="button" className="feedback-dismiss" onClick={() => setErrorMessage('')} aria-label="Fechar aviso">×</button>
          </div>
        )}
        {notice && (
          <div className="feedback feedback-success" role="status">
            <span>{notice}</span>
            <button type="button" className="feedback-dismiss" onClick={() => setNotice('')} aria-label="Fechar aviso">×</button>
          </div>
        )}

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading upload-heading">
            <div>
              <p className="section-kicker">ADICIONAR AO ACERVO</p>
              <h2 id="upload-title">Enviar documento</h2>
            </div>
            <span className="file-policy">PDF <i>·</i> DOCX <i>·</i> TXT <b>/</b> ATÉ 10 MB</span>
          </div>
          <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
        </section>

        <section className="library-section" aria-labelledby="library-title">
          <div className="section-heading library-heading">
            <div className="library-title-group">
              <div>
                <p className="section-kicker">ARQUIVOS DISPONÍVEIS</p>
                <h2 id="library-title">Acervo</h2>
              </div>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>
            <button type="button" className="refresh-button" onClick={handleRefresh} disabled={isLoading}>
              <span aria-hidden="true">↻</span> Atualizar
            </button>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownloadError={(error) => setErrorMessage(error.message)}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>DMS <i>·</i> DOCUMENT MANAGEMENT SYSTEM</span>
        <span>ARQUIVOS LOCAIS <i>／</i> METADADOS EM MEMÓRIA</span>
      </footer>
    </div>
  );
}