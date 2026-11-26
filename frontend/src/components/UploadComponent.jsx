import { useState } from 'react';

const acceptedTypes = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

export default function UploadComponent({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationMessage('');
    const form = event.currentTarget;

    if (!file) {
      setValidationMessage('Escolha um arquivo para enviar.');
      return;
    }

    if (await onUpload(file)) {
      setFile(null);
      form.reset();
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${file ? ' has-file' : ''}`}>
        <input
          className="file-input"
          type="file"
          name="file"
          accept={acceptedTypes}
          disabled={isUploading}
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setValidationMessage('');
          }}
        />
        <span className="file-picker-icon" aria-hidden="true">＋</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolher arquivo'}</strong>
          <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX ou TXT'}</small>
        </span>
        <span className="file-picker-action">Procurar</span>
      </label>
      <button className="upload-button" type="submit" disabled={isUploading}>
        {isUploading ? <><span className="button-spinner" aria-hidden="true" /> Enviando</> : <><span aria-hidden="true">↑</span> Enviar arquivo</>}
      </button>
      {validationMessage && <p className="field-error" role="alert">{validationMessage}</p>}
    </form>
  );
}