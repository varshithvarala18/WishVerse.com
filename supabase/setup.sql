-- WishVerse online sharing – run once in Supabase → SQL Editor → New query → Run.
--
-- Surprise records live in public.surprises; photos/videos/music live in the
-- public "wishverse-media" storage bucket under "<slug>/...".
-- The table itself is closed to the browser: everything goes through the
-- functions below, so nobody can list other people's surprises, and only the
-- browser holding a surprise's secret edit key can change or delete it.

create table if not exists public.surprises (
  slug          text primary key check (slug ~ '^[a-z0-9-]{3,80}$'),
  data          jsonb not null,
  edit_key_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.surprises enable row level security;
revoke all on public.surprises from anon, authenticated;

create or replace function public.get_surprise(p_slug text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select data from public.surprises where slug = p_slug;
$$;

create or replace function public.surprise_exists(p_slug text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.surprises where slug = p_slug);
$$;

create or replace function public.save_surprise(p_slug text, p_data jsonb, p_key text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  h text := encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex');
begin
  if length(coalesce(p_key, '')) < 24 then
    raise exception 'invalid edit key';
  end if;
  if pg_column_size(p_data) > 512000 then
    raise exception 'surprise is too large';
  end if;

  insert into public.surprises (slug, data, edit_key_hash)
  values (p_slug, p_data, h)
  on conflict (slug) do update
    set data = excluded.data, updated_at = now()
    where public.surprises.edit_key_hash = h;

  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.delete_surprise(p_slug text, p_key text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.surprises
  where slug = p_slug
    and edit_key_hash = encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex');
end;
$$;

grant execute on function public.get_surprise(text), public.surprise_exists(text),
  public.save_surprise(text, jsonb, text), public.delete_surprise(text, text)
  to anon, authenticated;

-- Storage: public read by exact URL (no listing), 50 MB per file, media types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wishverse-media', 'wishverse-media', true, 52428800, array['image/*', 'video/*', 'audio/*'])
on conflict (id) do nothing;

drop policy if exists "wishverse upload" on storage.objects;
create policy "wishverse upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'wishverse-media');

-- Files can only be removed once their surprise record has been deleted
-- (delete_surprise checks the edit key), so the creator can clean up.
drop policy if exists "wishverse cleanup read" on storage.objects;
create policy "wishverse cleanup read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'wishverse-media' and not public.surprise_exists((storage.foldername(name))[1]));

drop policy if exists "wishverse cleanup delete" on storage.objects;
create policy "wishverse cleanup delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'wishverse-media' and not public.surprise_exists((storage.foldername(name))[1]));
