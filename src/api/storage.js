  // Unified storage API — picks Supabase when configured, otherwise localStorage.
  // Pages import from here only; no frontend changes required.

  import { isSupabaseConfigured } from "./supabaseClient";
  import * as local from "./storageLocal";
  import * as remote from "./storageSupabase";

  const backend = isSupabaseConfigured() ? remote : local;

  if (!isSupabaseConfigured() && import.meta.env.DEV) {
    console.info(
      "[Portivo] Supabase not configured — using localStorage. " +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable the cloud backend."
    );
  }

  export const getContainers = backend.getContainers;
  export const getContainer = backend.getContainer;
  export const addContainer = backend.addContainer;
  export const updateContainer = backend.updateContainer;
  export const importContainers = backend.importContainers;
  export const getImportHistory = backend.getImportHistory;
  export const addImportHistory = backend.addImportHistory;
  export const deleteImport = backend.deleteImport;
  export const onChange = backend.onChange;
