// Unified storage API — picks the standalone backend when configured,
  // otherwise localStorage. Pages import from here only; no frontend changes
  // required.

  import { isBackendConfigured } from "./backendClient";
  import * as local from "./storageLocal";
  import * as remote from "./storageBackend";

  const backend = isBackendConfigured() ? remote : local;

  if (!isBackendConfigured() && import.meta.env.DEV) {
    console.info(
      "[Portivo] Backend API not configured — using localStorage. " +
      "Add VITE_API_URL to .env (and run the backend/ app) to enable the real backend."
    );
  }

  export const getContainers = backend.getContainers;
  export const getContainer = backend.getContainer;
  export const addContainer = backend.addContainer;
  export const updateContainer = backend.updateContainer;
  export const deleteContainer = backend.deleteContainer;
  export const uploadDocument  = backend.uploadDocument;
  export const getDocumentUrl  = backend.getDocumentUrl;
  export const deleteDocument  = backend.deleteDocument;
  export const importContainers = backend.importContainers;
  export const getImportHistory = backend.getImportHistory;
  export const addImportHistory = backend.addImportHistory;
  export const deleteImport = backend.deleteImport;
  export const onChange = backend.onChange;