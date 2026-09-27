import { apiClient } from '../../core/api-client.js';
import { createFileDrop } from '../../components/file-drop.js';
import { renderZipPreview } from './zip-preview.js';
import { downloadBlob, getFilename, setLoading, setVisible, showMessage } from '../../core/ui.js';

export function initZipFlow() {
  const elements = {
    input: document.getElementById('input-zip'),
    dropZone: document.getElementById('drop-zone'),
    filename: document.getElementById('nombre-archivo'),
    previewButton: document.getElementById('btn-preview'),
    previewLabel: document.getElementById('btn-preview-text'),
    previewSpinner: document.getElementById('spinner-preview'),
    fileList: document.getElementById('lista-archivos'),
    options: document.getElementById('opciones-zip'),
    processButton: document.getElementById('btn-procesar-zip'),
    processLabel: document.getElementById('btn-procesar-text'),
    processSpinner: document.getElementById('spinner-zip'),
    docTypeSelect: document.getElementById('select-doc-type'),
    languageSelect: document.getElementById('select-idioma-zip'),
    extraInput: document.getElementById('input-extra'),
    message: document.getElementById('msg-zip')
  };

  if (elements.languageSelect) {
    elements.languageSelect.value = (navigator.language || 'es').startsWith('en') ? 'en' : 'es';
  }

  let selectedFile = null;

  createFileDrop({
    input: elements.input,
    dropZone: elements.dropZone,
    filenameElement: elements.filename,
    messageElement: elements.message,
    validate(file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        showMessage(elements.message, 'Solo se permiten archivos .zip', 'error');
        return false;
      }
      if (file.size > 15 * 1024 * 1024) {
        showMessage(elements.message, 'El archivo ZIP supera el tamaño máximo permitido de 15 MB.', 'error');
        return false;
      }
      return true;
    },
    onFile(file) {
      selectedFile = file;
      elements.previewButton.disabled = false;
      setVisible(elements.fileList, false);
      setVisible(elements.options, false);
    }
  });

  elements.previewButton.addEventListener('click', async () => {
    if (!selectedFile) return;

    const language = elements.languageSelect ? elements.languageSelect.value : (navigator.language || 'es').split('-')[0];
    setLoading(elements.previewButton, elements.previewLabel, elements.previewSpinner, true);
    setVisible(elements.message, false);

    try {
      const data = await apiClient.previewZip(selectedFile, language);
      renderZipPreview(elements.fileList, data);
      setVisible(elements.options, true);
    } catch (error) {
      showMessage(elements.message, `Error: ${error.message}`, 'error');
    } finally {
      setLoading(elements.previewButton, elements.previewLabel, elements.previewSpinner, false);
    }
  });

  elements.processButton.addEventListener('click', async () => {
    if (!selectedFile) return;

    const docType = elements.docTypeSelect.value;
    const language = elements.languageSelect ? elements.languageSelect.value : (navigator.language || 'es').split('-')[0];
    const extra = elements.extraInput.value.trim();
    setLoading(elements.processButton, elements.processLabel, elements.processSpinner, true);
    setVisible(elements.message, false);

    try {
      const blob = await apiClient.generateFromZip(selectedFile, docType, extra, language);
      const filename = getFilename(docType);
      downloadBlob(blob, filename);
      showMessage(elements.message, `¡Documentación generada! Descargando ${filename}...`, 'success');
    } catch (error) {
      showMessage(elements.message, `Error: ${error.message}`, 'error');
    } finally {
      setLoading(elements.processButton, elements.processLabel, elements.processSpinner, false);
    }
  });
}
