import { API_BASE } from '../config/api-config.js';

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();

    if (response.status === 429) {
      const retryAfter = data.retry_after || response.headers.get('Retry-After');
      if (retryAfter) {
        return `Por favor espera ${retryAfter} segundos para tu próxima solicitud.`;
      }
      return data.error || 'Límite de solicitudes alcanzado. Espera un momento antes de reintentar.';
    }

    if (response.status === 413) {
      return data.error || 'El archivo supera el tamaño máximo permitido de 15 MB.';
    }

    if (data.codigo_error && data.error) {
      return `[${data.codigo_error}] ${data.error}`;
    }

    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function requestBlob(url, options, fallbackMessage) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackMessage));
  }

  return response.blob();
}

async function requestJson(url, options, fallbackMessage) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackMessage));
  }

  return response.json();
}

function createFormData(fields) {
  const formData = new FormData();

  Object.entries(fields).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(name, value);
    }
  });

  return formData;
}

function resolveLanguage(lang) {
  const code = (lang || (typeof navigator !== 'undefined' ? navigator.language : 'es') || 'es')
    .split('-')[0]
    .toLowerCase();
  return code === 'en' ? 'en' : 'es';
}

export const apiClient = {
  generateFromCode(code, format, extra, language) {
    const fileType = format === 'word' ? 'docx' : format;
    const lang = resolveLanguage(language);
    const payload = {
      code,
      language: lang
    };

    if (extra) {
      payload.extra = extra;
    }

    return requestBlob(`${API_BASE}/download/${fileType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': lang
      },
      body: JSON.stringify(payload)
    }, 'Error al generar la documentación');
  },

  previewZip(file, language) {
    const lang = resolveLanguage(language);
    const formData = createFormData({ file });

    return requestJson(`${API_BASE}/preview-zip`, {
      method: 'POST',
      headers: {
        'Accept-Language': lang
      },
      body: formData
    }, 'Error al previsualizar el ZIP');
  },

  generateFromZip(file, docType, extra, language) {
    const lang = resolveLanguage(language);
    const formData = createFormData({
      file,
      doc_type: docType,
      extra_requirements: extra,
      language: lang
    });

    return requestBlob(`${API_BASE}/upload-zip`, {
      method: 'POST',
      headers: {
        'Accept-Language': lang
      },
      body: formData
    }, 'Error al procesar el ZIP');
  },

  async generateFromFile(file, format, extra, language) {
    const code = await file.text();

    if (!code || code.trim().length < 10) {
      throw new Error('El archivo seleccionado contiene menos de 10 caracteres.');
    }

    return this.generateFromCode(code, format, extra, language);
  }
};
