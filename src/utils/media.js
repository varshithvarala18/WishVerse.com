import { createStore, get, set, del, delMany, keys } from 'idb-keyval';
import { processImage } from './imageResize.js';
import { randomId } from './slug.js';
import { toStorageError } from './errors.js';
import { isCloudMedia, cloudMediaUrl } from './cloud.js';

/*
 * Media lives in IndexedDB database "wishverse-media", object store "media".
 * key = mediaId, value = { blob, thumbBlob, type, name, kind }
 *
 * Ids starting with "draft-" belong to the wizard draft and are promoted to
 * permanent "m-" ids when a surprise is created. Ids starting with "demo:" are
 * static files served from /public/demo. Ids starting with "cloud:" are files
 * of a surprise opened from its online link (see cloud.js).
 */
const store = createStore('wishverse-media', 'media');

export const DRAFT_PREFIX = 'draft-';

export function newMediaId(prefix = 'm') {
  return `${prefix}-${randomId(12)}`;
}

export const isDemoMedia = (id) => typeof id === 'string' && id.startsWith('demo:');
export const isDraftMedia = (id) => typeof id === 'string' && id.startsWith(DRAFT_PREFIX);

export function demoMediaUrl(id) {
  return `${import.meta.env.BASE_URL}demo/${id.slice(5)}`;
}

/** Plain URL for demo / online media (nothing to revoke), or null for IndexedDB media. */
export function staticMediaUrl(id, { thumb = false } = {}) {
  if (isDemoMedia(id)) return demoMediaUrl(id);
  if (isCloudMedia(id)) return cloudMediaUrl(id, { thumb });
  return null;
}

async function safeSet(key, value) {
  try {
    await set(key, value, store);
  } catch (err) {
    throw toStorageError(err, 'this file');
  }
}

/** Stores a File. Images are resized + thumbnailed first. Returns the new mediaId. */
export async function putMedia(file, { draft = true } = {}) {
  const kind = (file.type || '').split('/')[0] || 'file';
  let blob = file;
  let thumbBlob = null;
  if (kind === 'image') {
    const processed = await processImage(file);
    blob = processed.blob;
    thumbBlob = processed.thumbBlob;
  }
  const id = newMediaId(draft ? 'draft' : 'm');
  await safeSet(id, { blob, thumbBlob, type: blob.type || file.type, name: file.name || 'file', kind });
  return id;
}

export async function putMediaRecord(id, record) {
  await safeSet(id, record);
  return id;
}

export async function getMediaRecord(id) {
  if (!id || isDemoMedia(id) || isCloudMedia(id)) return null;
  try {
    return (await get(id, store)) || null;
  } catch {
    return null;
  }
}

/**
 * Returns a fresh URL for the media (object URL for IndexedDB blobs – the caller
 * must revoke it – or a static path for demo media). Null if not found.
 */
export async function getMediaUrl(mediaId, { thumb = false } = {}) {
  if (!mediaId) return null;
  const direct = staticMediaUrl(mediaId, { thumb });
  if (direct) return direct;
  const rec = await getMediaRecord(mediaId);
  if (!rec) return null;
  const blob = thumb && rec.thumbBlob ? rec.thumbBlob : rec.blob;
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteMedia(mediaId) {
  if (!mediaId || isDemoMedia(mediaId)) return;
  try {
    await del(mediaId, store);
  } catch {
    /* ignore – nothing more we can do */
  }
}

export async function deleteManyMedia(ids) {
  const list = (ids || []).filter((id) => id && !isDemoMedia(id));
  if (!list.length) return;
  try {
    await delMany(list, store);
  } catch {
    /* ignore */
  }
}

/** Copies a media entry to a new permanent id. Returns the new id. */
export async function copyMedia(id) {
  const rec = await getMediaRecord(id);
  if (!rec) return id;
  const newId = newMediaId('m');
  await safeSet(newId, rec);
  return newId;
}

/** Deletes every "draft-" media entry. */
export async function deleteDraftMedia() {
  try {
    const all = await keys(store);
    const drafts = all.filter((k) => isDraftMedia(String(k)));
    if (drafts.length) await delMany(drafts, store);
  } catch {
    /* ignore */
  }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(blob);
  });
}

export async function base64ToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}
