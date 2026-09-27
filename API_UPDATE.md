# 📘 Guía de Integración Frontend — EasyDocs API (v3.3.0)

Esta guía contiene todas las especificaciones, formatos de petición, ejemplos en JavaScript (`fetch` y `axios`), y soluciones a los errores más comunes al conectar un Frontend (React, Vue, Vite, Next.js, etc.) con **EasyDocs API**.

---

## 🌐 Configuración Base

- **URL Base Local:** `http://127.0.0.1:5000` (o `http://localhost:5000`)
- **Prefijo de Endpoints:** Todos los endpoints de la API comienzan con `/api/`
- **CORS:** Habilitado para todos los orígenes en desarrollo.

---

## ⚠️ Los 4 Errores Más Comunes en el Frontend

Antes de ver los endpoints, revisa si tu frontend tiene alguno de estos errores frecuentes:

### 1. ❌ Especificar manualmente `'Content-Type': 'multipart/form-data'`
- **Error:** Al enviar `FormData` con `fetch` o `axios`, si agregas manualmente `'Content-Type': 'multipart/form-data'`, eliminas el `boundary` que el navegador genera automáticamente. Flask no podrá leer `request.files` y devolverá `400 Bad Request (No file)`.
- **Solución:** **NUNCA** pongas el header `Content-Type` cuando envíes un objeto `FormData`. Deja que el navegador lo establezca solo.

### 2. ❌ Intentar hacer `response.json()` en descargas de archivos
- **Error:** Si solicitas un PDF o DOCX, la API devuelve un archivo binario (`blob`), no un JSON. Hacer `response.json()` arrojará `SyntaxError: Unexpected token in JSON`.
- **Solución:** Verifica siempre `if (!response.ok)`. Si hay error, lee `response.json()`; si es exitoso, lee `response.blob()`.

### 3. ❌ Olvidar el prefijo `/api`
- **Error:** Llamar a `/upload-zip` o `/download/pdf`.
- **Solución:** Las rutas correctas son `/api/upload-zip` y `/api/download/pdf`.

### 4. ❌ Nombres incorrectos de campos en el formulario
- La clave del archivo ZIP **debe** llamarse `"file"`.
- El tipo de documento para Word **debe** ser `"word"` (en `/api/upload-zip`) o `"docx"` (en `/api/download/docx`).

---

## 📡 Endpoints de la API

---

### 1. Previsualizar Contenido del ZIP (`/api/preview-zip`)
Inspecciona qué archivos contiene el ZIP y cuáles son soportados sin llamar a los modelos de IA.

- **Método:** `POST`
- **URL:** `http://localhost:5000/api/preview-zip`
- **Content-Type:** `multipart/form-data`
- **Parámetros (`FormData`):**
  - `file`: Archivo `.zip` (requerido).

#### Ejemplo con JavaScript (`fetch`):
```javascript
async function previewZip(fileInput) {
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file); // ⚠️ La clave DEBE ser "file"

  try {
    const response = await fetch("http://localhost:5000/api/preview-zip", {
      method: "POST",
      body: formData,
      // ⚠️ ¡NO agregues el header Content-Type aquí!
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error:", data.error, data.codigo_error);
      alert(`Error: ${data.error}`);
      return;
    }

    console.log("Archivos encontrados:", data);
    // data es un Array: [{ file: "main.py", language: "py", valid: true, size: "1.2kb" }]
    return data;
  } catch (error) {
    console.error("Error de red:", error);
  }
}
```

---

### 2. Subir ZIP y Generar Documentación (`/api/upload-zip`)
Procesa el código dentro del ZIP mediante IA y genera la documentación consolidada.

- **Método:** `POST`
- **URL:** `http://localhost:5000/api/upload-zip`
- **Content-Type:** `multipart/form-data`
- **Parámetros (`FormData`):**
  - `file`: Archivo `.zip` (requerido).
  - `doc_type`: Tipo de documento: `"markdown"` | `"pdf"` | `"word"` | `"multifile"` (opcional, default: `"markdown"`).
  - `extra_requirements`: Instrucciones adicionales para la IA (opcional, string).
  - `language`: Idioma destino: `"es"` o `"en"` (opcional, string).

#### Ejemplo con JavaScript (`fetch`):
```javascript
async function generateDocsFromZip(file, docType = "pdf", extraReqs = "", lang = "es") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType); // "markdown", "pdf", o "word"
  formData.append("extra_requirements", extraReqs);
  formData.append("language", lang);

  try {
    const response = await fetch("http://localhost:5000/api/upload-zip", {
      method: "POST",
      body: formData,
    });

    // 1. Si la API devolvió error (400, 413, 429, 500)
    if (!response.ok) {
      const errorJson = await response.json();
      console.error("Error de API:", errorJson);
      alert(`Error [${errorJson.codigo_error}]: ${errorJson.error}`);
      return;
    }

    // 2. Si la petición fue exitosa, recibimos un archivo binario para descargar
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Obtener nombre del archivo o usar default
    const extension = docType === "pdf" ? "pdf" : docType === "word" ? "docx" : "md";
    link.download = `documentacion.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    console.log("¡Documentación descargada con éxito!");
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}
```

---

### 3. Documentar Fragmento de Código Directo (`/api/download/<file_type>`)
Genera documentación para un string de código fuente directo.

- **Método:** `POST`
- **URL:** `http://localhost:5000/api/download/<file_type>`
  - `<file_type>`: `"pdf"` | `"markdown"` | `"docx"`
- **Content-Type:** `application/json`
- **Body (`JSON`):**
  - `code`: Código fuente como string (mínimo 10 caracteres, requerido).
  - `extra`: Requerimientos adicionales (opcional, string).
  - `language`: Idioma destino: `"es"` o `"en"` (opcional, string).

#### Ejemplo con JavaScript (`fetch`):
```javascript
async function documentCodeSnippet(sourceCode, fileType = "markdown") {
  try {
    const response = await fetch(`http://localhost:5000/api/download/${fileType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: sourceCode,
        extra: "Enfócate en explicar la complejidad algorítmica y endpoints",
        language: "es",
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json();
      alert(`Error: ${errorJson.error}`);
      return;
    }

    // Descarga del archivo generado
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `doc_${fileType}.${fileType === "markdown" ? "md" : fileType}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error:", error);
  }
}
```

---

## 🛡️ Manejo de Errores y Códigos de Estado

La API responde siempre con códigos HTTP estándar y formato JSON en caso de error:

| Código HTTP | `codigo_error` | Causa | Cómo manejarlo en el Frontend |
|---|---|---|---|
| **400** | `VALIDATION_ERROR` | ZIP corrupto, contiene más de 300 archivos, excede 40 MB descomprimido o rutas `../` | Mostrar `error` al usuario para que verifique el archivo ZIP |
| **400** | `BAD_REQUEST` | El cuerpo de la petición está vacío o el código tiene menos de 10 caracteres | Validar que el usuario haya escrito código antes de enviar |
| **413** | `PAYLOAD_TOO_LARGE` | El archivo subido excede el límite máximo de **15 MB** | Avisar al usuario: *"El archivo supera el tamaño máximo permitido de 15 MB"* |
| **429** | `RATE_LIMIT_EXCEEDED` | Se superó el límite de la demo (**10 req/min** en IA, **30 req/min** en preview) | Leer `retry_after` del JSON o cabecera `Retry-After` y mostrar: *"Por favor espera X segundos para tu próxima solicitud"* |
| **500** | `PROCESSING_ERROR` | Fallo interno en los proveedores de IA o consolidación | Notificar que intente nuevamente en unos instantes |

---

## 📦 Ejemplo Completo en React / Vite

```jsx
import React, { useState } from "react";

export function DocumentationGenerator() {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Por favor selecciona un archivo .zip");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    formData.append("language", "es");

    try {
      const response = await fetch("http://localhost:5000/api/upload-zip", {
        method: "POST",
        body: formData, // ¡Sin headers manuales!
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al procesar el archivo");
      }

      // Descargar archivo resultante
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documentacion.${docType === "word" ? "docx" : docType === "pdf" ? "pdf" : "md"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Generar Documentación</h2>

      {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}

      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <select value={docType} onChange={(e) => setDocType(e.target.value)}>
        <option value="markdown">Markdown (.md)</option>
        <option value="pdf">PDF (.pdf)</option>
        <option value="word">Word (.docx)</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? "Procesando con IA..." : "Generar Documentación"}
      </button>
    </form>
  );
}
```
