-- Liman Anbari chat attachment storage.
-- Uses the existing Firebase Auth JWT. Keep the bucket private.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'liman-chat-files',
  'liman-chat-files',
  false,
  15728640,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed', 'application/vnd.rar', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ]::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Liman chat members can download files" on storage.objects;
drop policy if exists "Liman chat members can upload their files" on storage.objects;
drop policy if exists "Liman senders can delete their files" on storage.objects;

create policy "Liman chat members can download files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'liman-chat-files'
  and (select auth.jwt()->>'iss') = 'https://securetoken.google.com/limananbari'
  and coalesce((select auth.jwt()->>'sub'), '') <> ''
  and (storage.foldername(name))[1] = 'chats'
  and (
    split_part((storage.foldername(name))[2], '__', 1) = (select auth.jwt()->>'sub')
    or split_part((storage.foldername(name))[2], '__', 2) = (select auth.jwt()->>'sub')
  )
);

create policy "Liman chat members can upload their files"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'liman-chat-files'
  and (select auth.jwt()->>'iss') = 'https://securetoken.google.com/limananbari'
  and coalesce((select auth.jwt()->>'sub'), '') <> ''
  and (storage.foldername(name))[1] = 'chats'
  and (
    split_part((storage.foldername(name))[2], '__', 1) = (select auth.jwt()->>'sub')
    or split_part((storage.foldername(name))[2], '__', 2) = (select auth.jwt()->>'sub')
  )
  and left(
    storage.filename(name),
    char_length((select auth.jwt()->>'sub')) + 1
  ) = (select auth.jwt()->>'sub') || '_'
);

create policy "Liman senders can delete their files"
on storage.objects
for delete
to anon, authenticated
using (
  bucket_id = 'liman-chat-files'
  and (select auth.jwt()->>'iss') = 'https://securetoken.google.com/limananbari'
  and coalesce((select auth.jwt()->>'sub'), '') <> ''
  and (storage.foldername(name))[1] = 'chats'
  and (
    split_part((storage.foldername(name))[2], '__', 1) = (select auth.jwt()->>'sub')
    or split_part((storage.foldername(name))[2], '__', 2) = (select auth.jwt()->>'sub')
  )
  and left(
    storage.filename(name),
    char_length((select auth.jwt()->>'sub')) + 1
  ) = (select auth.jwt()->>'sub') || '_'
);
