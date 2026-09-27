import { apiClient } from '../../core/api-client.js';
import { downloadBlob, getFilename, setLoading, setVisible, showMessage } from '../../core/ui.js';

export function initCodeFlow() {
  const elements = {
    codeInput: document.getElementById('input-codigo'),
    formatSelect: document.getElementById('select-formato'),
    languageSelect: document.getElementById('select-idioma-codigo'),
    extraInput: document.getElementById('input-extra-codigo'),
    button: document.getElementById('btn-descargar'),
    buttonLabel: document.getElementById('btn-descargar-text'),
    spinner: document.getElementById('spinner-codigo'),
    message: document.getElementById('msg-codigo')
  };

  if (elements.languageSelect) {
    elements.languageSelect.value = (navigator.language || 'es').startsWith('en') ? 'en' : 'es';
  }

  elements.button.addEventListener('click', async () => {
    const code = elements.codeInput.value.trim();
    const format = elements.formatSelect.value;
    const language = elements.languageSelect ? elements.languageSelect.value : (navigator.language || 'es').split('-')[0];
    const extra = elements.extraInput.value.trim();

    if (!validateCode(code, elements.message)) return;

    setLoading(elements.button, elements.buttonLabel, elements.spinner, true);
    setVisible(elements.message, false);

    try {
      const blob = await apiClient.generateFromCode(code, format, extra, language);
      const filename = getFilename(format);
      downloadBlob(blob, filename);
      showMessage(elements.message, `¡Documentación generada! Descargando ${filename}...`, 'success');
    } catch (error) {
      showMessage(elements.message, `Error: ${error.message}`, 'error');
    } finally {
      setLoading(elements.button, elements.buttonLabel, elements.spinner, false);
    }
  });
}

function validateCode(code, messageElement) {
  if (!code) {
    showMessage(messageElement, 'Pega tu código antes de generar.', 'error');
    return false;
  }

  if (code.length < 10) {
    showMessage(messageElement, 'El código debe tener al menos 10 caracteres.', 'error');
    return false;
  }

  return true;
}
