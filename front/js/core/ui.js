export function setVisible(element, visible) {
  element.classList.toggle('hidden', !visible);
}

export function showMessage(element, text, type = 'info') {
  element.textContent = text;
  element.className = `message message--${type}`;
  setVisible(element, true);
}

export function setLoading(button, label, spinner, loading) {
  button.disabled = loading;
  setVisible(label, !loading);
  setVisible(spinner, loading);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const EXTENSIONS = {
  pdf: 'pdf',
  word: 'docx',
  docx: 'docx',
  markdown: 'md',
  multifile: 'zip'
};

export function getFilename(docType) {
  const extension = EXTENSIONS[docType] || 'md';

  if (docType === 'multifile') {
    const now = new Date();
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part, index) => index === 0 ? part : String(part).padStart(2, '0'))
      .join('');
    const time = [now.getHours(), now.getMinutes()]
      .map(part => String(part).padStart(2, '0'))
      .join('');
    return `documentacion_multifile_${date}_${time}.${extension}`;
  }

  const date = new Date().toISOString().slice(0, 10);
  return `documentacion_${date}.${extension}`;
}
