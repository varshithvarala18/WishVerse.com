import { createClient } from '@supabase/supabase-js';
import { randomId } from './slug.js';
import { StorageError } from './errors.js';

/*
 * Online sharing via Supabase (see supabase/setup.sql).
 * Records    -> table "surprises", reached only through RPC functions.
 * Media      -> public bucket "wishverse-media" at "<slug>/<mediaId>" (+ "-thumb").
 * Edit keys  -> localStorage "wishverse:cloudKeys" = { [slug]: { key, publishedAt } }.
 *               Only the browser holding a slug's key can update/delete it online.
 *
 * Published records reference media as "cloud:<path>", or "cloud:<path>|t"
 * when a thumbnail was uploaded too.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'wishverse-media';
const KEYS_KEY = 'wishverse:cloudKeys';
const CLOUD_PREFIX = 'cloud:';
const THUMB_FLAG = '|t';

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

const supabase = cloudEnabled ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }) : null;

const offline = () => new StorageError('Couldn’t reach the WishVerse server. Check your internet connection and try again.');

/* ---------------- media ids ---------------- */

export const isCloudMedia = (id) => typeof id === 'string' && id.startsWith(CLOUD_PREFIX);

export function cloudMediaId(path, hasThumb) {
  return `${CLOUD_PREFIX}${path}${hasThumb ? THUMB_FLAG : ''}`;
}

export function cloudMediaUrl(id, { thumb = false } = {}) {
  if (!supabase || !isCloudMedia(id)) return null;
  let path = id.slice(CLOUD_PREFIX.length);
  const hasThumb = path.endsWith(THUMB_FLAG);
  if (hasThumb) path = path.slice(0, -THUMB_FLAG.length);
  if (thumb && hasThumb) path += '-thumb';
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ---------------- edit keys ---------------- */

function readKeys() {
  try {
    return JSON.parse(localStorage.getItem(KEYS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeKeys(keys) {
  try {
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
  } catch {
    /* ignore – worst case the surprise can't be edited online from here */
  }
}

/** { key, publishedAt } for a slug this browser published, or null. */
export function getCloudEntry(slug) {
  return readKeys()[slug] || null;
}

function keyFor(slug) {
  return getCloudEntry(slug)?.key || randomId(32);
}

function markPublished(slug, key) {
  writeKeys({ ...readKeys(), [slug]: { key, publishedAt: new Date().toISOString() } });
}

function forget(slug) {
  const keys = readKeys();
  delete keys[slug];
  writeKeys(keys);
}

/* ---------------- uploads / records ---------------- */

/** Uploads one blob. Paths are never reused for different content, so "already exists" is success. */
export async function uploadBlob(path, blob, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: contentType || blob.type || undefined,
    cacheControl: '31536000',
    upsert: false,
  });
  if (!error) return;
  if (String(error.statusCode) === '409' || /exists|duplicate/i.test(error.message)) return;
  if (/size|too large|413/i.test(error.message)) throw new StorageError('A file is too big to upload (max 50 MB).');
  if (/mime|type/i.test(error.message)) throw new StorageError('One of the files isn’t a supported image, video or audio type.');
  throw offline();
}

export async function saveRecord(slug, data) {
  const key = keyFor(slug);
  const { error } = await supabase.rpc('save_surprise', { p_slug: slug, p_data: data, p_key: key });
  if (error) {
    if (error.code === '42501') throw new StorageError('This surprise was published from another browser, so it can’t be updated from here.');
    throw offline();
  }
  markPublished(slug, key);
}

/** The published record for a slug, or null if there is none. */
export async function fetchRecord(slug) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_surprise', { p_slug: slug });
  if (error) throw offline();
  return data || null;
}

/** Deletes the online record (if this browser owns it) and then its files. */
export async function deleteRecord(slug, mediaIds) {
  const entry = getCloudEntry(slug);
  if (!supabase || !entry) return;
  const { error } = await supabase.rpc('delete_surprise', { p_slug: slug, p_key: entry.key });
  if (error) throw offline();
  const paths = mediaIds.flatMap((id) => [`${slug}/${id}`, `${slug}/${id}-thumb`]);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  forget(slug);
}
