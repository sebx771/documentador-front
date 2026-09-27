# 📄 EasyDocs — Documentador de código

Frontend del **Documentador automático con IA**. Pega código suelto, sube un archivo o un proyecto ZIP completo y obtén documentación generada en Markdown, PDF, Word o un set de archivos Markdown por módulo.

> Frontend vanilla (HTML + CSS + JS sin frameworks ni build tools). Consume la API en `https://documentador-api.vercel.app/api`.

---

## ✨ Funcionalidades

| Pestaña | Entrada | Salida |
|---------|---------|--------|
| **Código suelto** | Texto pegado | `.md` / `.pdf` / `.docx` |
| **Archivo ZIP** | Proyecto `.zip` | `.md` / `.pdf` / `.docx` / `.zip` multifile |
| **Archivo suelto** | Archivo de código | `.md` / `.pdf` / `.docx` |

El flujo ZIP además incluye **previsualización del contenido** (lista de archivos con lenguaje, validez y tamaño) antes de generar la documentación.

### Tipos de documentación

| `doc_type` | Formato devuelto |
|------------|------------------|
| `markdown` | `.md` consolidado |
| `pdf` | `.pdf` consolidado |
| `word` | `.docx` consolidado |
| `multifile` | `.zip` con un `.md` por chunk/módulo |

> `multifile` solo está disponible en el flujo ZIP (`POST /api/upload-zip`), introducido en la API v3.0.0. Ver [API_UPDATE.md](./API_UPDATE.md).

---

## 🚀 Ejecución

No requiere instalación ni build:

```bash
# Opción 1: servidor estático local
python3 -m http.server 8080 --directory front
# → http://localhost:8080

# Opción 2: abrir directo en el navegador
# (abrir front/index.html)
```

### Requisitos

- Navegador moderno con soporte de `fetch`, `FormData` y `URL.createObjectURL`.

---

## 🛠️ Configuración

La URL base de la API se define en `front/js/config/api-config.js`:

```js
const API_BASE = 'https://documentador-api.vercel.app/api';
```

Cámbiala por tu entorno local (ej: `http://localhost:5000/api`).

---

## 🔌 Integración con la API

| Método | Endpoint | Formato | Uso en frontend |
|--------|----------|---------|-----------------|
| `POST` | `/api/download/<file_type>` | `application/json` | Código suelto y archivo suelto (`pdf`, `markdown`, `docx`) |
| `POST` | `/api/preview-zip` | `multipart/form-data` | Previsualizar contenido del ZIP |
| `POST` | `/api/upload-zip` | `multipart/form-data` | Generar documentación del proyecto ZIP |

### Flujo ZIP

1. Seleccionar/arrastrar archivo `.zip` (validación de extensión y tamaño máx 15 MB en cliente).
2. `POST /api/preview-zip` → lista de archivos renderizada como tarjetas.
3. Elegir `doc_type`, requisitos adicionales (opcional) y generar:
   `POST /api/upload-zip` con `multipart/form-data`:
   - `file` — el ZIP (límite 15 MB)
   - `doc_type` — `markdown` \| `pdf` \| `word` \| `multifile`
   - `extra_requirements` — texto libre (opcional)
   - `language` — ISO del navegador (`navigator.language`, ej: `es`)
4. La respuesta es binaria → se descarga con `downloadBlob()`.

### Flujos de Código y Archivo Suelto

1. Ingresar código o cargar archivo individual (mínimo 10 caracteres, máx 15 MB).
2. `POST /api/download/<file_type>` con `application/json`:
   - `code` — string del código fuente
   - `extra` — instrucciones adicionales (opcional)
   - `language` — ISO del navegador (ej: `es`)
3. Respuesta binaria → descarga del archivo generado (`.pdf`, `.md`, `.docx`).

### Cabeceras de Idioma (`Accept-Language`)

Todas las peticiones a la API envían la cabecera estándar `Accept-Language: es` o `Accept-Language: en` (según la selección del usuario o configuración del navegador), además de enviar el parámetro correspondiente en el payload/FormData para máxima compatibilidad con el backend.

### Manejo de errores

Los errores de la API llegan como JSON: `{ "codigo_error": "...", "error": "...", "retry_after": ... }`.
El frontend muestra alertas enriquecidas con el código de error correspondiente (`VALIDATION_ERROR`, `BAD_REQUEST`, `PAYLOAD_TOO_LARGE`, `RATE_LIMIT_EXCEEDED`, `PROCESSING_ERROR`), notificando los segundos a esperar en caso de rate limiting (429). Ver [API_UPDATE.md](./API_UPDATE.md).

---

## 📁 Estructura

```
documentador-front/
├── README.md
├── API_UPDATE.md           # Guía y especificación EasyDocs API v3.3.0
└── front/
    ├── index.html          # Estructura (3 paneles + tabs)
    ├── index.css           # Estilos y tema oscuro
    └── js/
        ├── app/
        │   └── main.js     # Punto de entrada e inicialización
        ├── config/
        │   └── api-config.js # Configuración de la API
        ├── core/
        │   ├── api-client.js # Cliente HTTP y contratos de API
        │   └── ui.js       # Utilidades visuales y descargas
        ├── components/
        │   └── file-drop.js # Interacción reutilizable de archivos
        ├── navigation/
        │   └── tabs.js     # Navegación entre paneles
        └── features/
            ├── code/code-flow.js # Flujo de código pegado
            ├── zip/             # Flujo y preview de ZIP
            └── file/file-flow.js # Flujo de archivo suelto
```

### Arquitectura del JS

```
main.js       → Inicializa tabs y flujos
api-client.js → fetch, serialización y errores de API
ui.js         → Visibilidad, estados de carga y descargas
file-drop.js  → Selección y drag & drop reutilizable
code-flow.js  → Código suelto → /api/download/<file_type>  (JSON)
zip-flow.js   → ZIP → /api/preview-zip + /api/upload-zip   (multipart)
file-flow.js  → Archivo suelto → /api/download/<file_type> (multipart)
```

---

## 📝 Notas

- Los endpoints de descarga **no devuelven JSON** exitoso: devuelven binario (`response.blob()`). No se debe parsear con `.json()`.
- El nombre del archivo descargado se genera en cliente. Para `multifile` usa `documentacion_multifile_YYYYMMDD_HHmm.zip`; para el resto `documentacion_YYYY-MM-DD.<ext>`.
- La extensión se deriva de `docType` mediante `getExtension()` (`word → .docx`).
