-- Portivo — proper file storage for groupage documents
--
-- Documents were previously stored as base64 text embedded directly in
-- the containers.groupages JSONB column. That meant every page loading
-- a container — including pages that never show documents at all —
-- downloaded the full binary content of every attached file. This
-- migration creates a real Storage bucket instead; going forward, only
-- a short path reference is stored in the JSONB, and the actual file
-- bytes live in Storage, fetched only when someone actually opens or
-- downloads a document.
--
-- Run this in the Supabase SQL Editor. Existing documents (already
-- saved as inline base64) are left as-is and continue to work — the
-- app checks for either format at read time — but will not be
-- migrated to the bucket automatically.

insert into storage.buckets (id, name, public)
values ('container-documents', 'container-documents', false)
on conflict (id) do nothing;

drop policy if exists "container_documents_select_authenticated" on storage.objects;
create policy "container_documents_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'container-documents');

drop policy if exists "container_documents_insert_authenticated" on storage.objects;
create policy "container_documents_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'container-documents');

drop policy if exists "container_documents_update_authenticated" on storage.objects;
create policy "container_documents_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'container-documents')
  with check (bucket_id = 'container-documents');

drop policy if exists "container_documents_delete_authenticated" on storage.objects;
create policy "container_documents_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'container-documents');
