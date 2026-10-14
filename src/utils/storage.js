import { makeSlug, randomId } from './slug.js';
import { StorageError, toStorageError } from './errors.js';
import { DEFAULT_THEME, THEMES } from './themes.js';
import {
  isDemoMedia,
  isDraftMedia,
  copyMedia,
  deleteManyMedia,
  deleteDraftMedia,
  getMediaRecord,
  putMediaRecord,
  newMediaId,
  blobToBase64,
  base64ToBlob,
} from './media.js';
import { cloudEnabled, cloudMediaId, deleteRecord, fetchRecord, getCloudEntry, saveRecord, uploadBlob } from './cloud.js';

/*
 * Text data -> localStorage (small, structured)
 * Media     -> IndexedDB (see media.js). Records only keep mediaIds.
 * Online    -> optional copy in Supabase so links open on any device (see cloud.js).
 */
const SURPRISES_KEY = 'wishverse:surprises';
const DRAFT_KEY = 'wishverse:draft';
const EXPORT_FORMAT = 'wishverse';
const EXPORT_VERSION = 1;

export const CELEBRATION_KEYS = ['confetti', 'balloons', 'fireworks', 'crackers', 'hearts', 'sparkles', 'cake', 'gift', 'stars'];

export function defaultCelebrations(on = true) {
  return Object.fromEntries(CELEBRATION_KEYS.map((k) => [k, on]));
}

export function defaultExtras() {
  return {
    hiddenSurprises: [],
    quiz: { enabled: false, question: '', options: ['', '', '', ''], correctIndex: 0, rewardText: '' },
    memoryLock: { enabled: false, secretWord: '', hint: '', mediaId: null, text: '' },
    friendshipMeter: { enabled: true, label: 'Friendship Level' },
  };
}

/** Fills in any missing fields so older/imported records never crash the UI. */
export function normalizeSurprise(raw = {}) {
  const ex = raw.extras || {};
  const base = defaultExtras();
  const quiz = { ...base.quiz, ...(ex.quiz || {}) };
  quiz.options = [0, 1, 2, 3].map((i) => String((ex.quiz?.options || [])[i] ?? ''));
  quiz.correctIndex = Math.min(3, Math.max(0, Number(quiz.correctIndex) || 0));
  return {
    ...raw,
    name: String(raw.name || ''),
    birthdayDate: String(raw.birthdayDate || ''),
    senderName: String(raw.senderName || ''),
    message: String(raw.message || ''),
    theme: THEMES.some((t) => t.id === raw.theme) ? raw.theme : DEFAULT_THEME,
    photos: Array.isArray(raw.photos) ? raw.photos.filter((p) => p && p.mediaId) : [],
    memories: Array.isArray(raw.memories)
      ? raw.memories.filter(Boolean).map((m) => ({
          id: m.id || randomId(8),
          mediaId: m.mediaId || null,
          caption: m.caption || '',
          date: m.date || '',
          description: m.description || '',
        }))
      : [],
    videos: Array.isArray(raw.videos) ? raw.videos.filter((v) => v && v.mediaId) : [],
    music: raw.music && raw.music.mediaId ? { mediaId: raw.music.mediaId, fileName: raw.music.fileName || 'song' } : null,
    celebrations: { ...defaultCelebrations(true), ...(raw.celebrations || {}) },
    extras: {
      hiddenSurprises: Array.isArray(ex.hiddenSurprises) ? ex.hiddenSurprises.slice(0, 2) : [],
      quiz,
      memoryLock: { ...base.memoryLock, ...(ex.memoryLock || {}) },
      friendshipMeter: { ...base.friendshipMeter, ...(ex.friendshipMeter || {}) },
    },
  };
}

/* ---------------- low-level localStorage helpers ---------------- */

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value, what) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    throw toStorageError(err, what);
  }
}

function readAll() {
  const list = readJson(SURPRISES_KEY, []);
  return Array.isArray(list) ? list : [];
}

function writeAll(list) {
  writeJson(SURPRISES_KEY, list, 'your surprise');
}

/* ---------------- public CRUD API ---------------- */

export function getAllBirthdays() {
  return readAll()
    .map(normalizeSurprise)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getBirthday(slug) {
  if (!slug) return null;
  const rec = readAll().find((b) => b.slug === slug);
  return rec ? normalizeSurprise(rec) : null;
}

export function saveBirthday(birthday) {
  const list = readAll();
  if (list.some((b) => b.slug === birthday.slug)) {
    throw new StorageError('A surprise with this link already exists.');
  }
  list.push(birthday);
  writeAll(list);
  return birthday;
}

export function updateBirthday(slug, data) {
  const list = readAll();
  const idx = list.findIndex((b) => b.slug === slug);
  if (idx === -1) throw new StorageError('That surprise no longer exists in this browser.');
  const updated = { ...list[idx], ...data, slug, id: list[idx].id, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  writeAll(list);
  return updated;
}

export async function deleteBirthday(slug) {
  const list = readAll();
  const rec = list.find((b) => b.slug === slug);
  if (!rec) return;
  await deleteRecord(slug, collectMediaIds(rec));
  writeAll(list.filter((b) => b.slug !== slug));
  await deleteManyMedia(collectMediaIds(rec));
}

/** All (non-demo) media ids referenced by a record, unique. */
export function collectMediaIds(rec) {
  if (!rec) return [];
  const ids = new Set();
  const add = (id) => id && !isDemoMedia(id) && ids.add(id);
  (rec.photos || []).forEach((p) => add(p.mediaId));
  (rec.memories || []).forEach((m) => add(m.mediaId));
  (rec.videos || []).forEach((v) => add(v.mediaId));
  add(rec.music?.mediaId);
  (rec.extras?.hiddenSurprises || []).forEach((h) => add(h.mediaId));
  add(rec.extras?.memoryLock?.mediaId);
  return [...ids];
}

/** Returns a copy of rec with every mediaId replaced via map (old -> new). */
export function remapMediaIds(rec, map) {
  const m = (id) => (id && map.has(id) ? map.get(id) : id);
  return {
    ...rec,
    photos: (rec.photos || []).map((p) => ({ ...p, mediaId: m(p.mediaId) })),
    memories: (rec.memories || []).map((x) => ({ ...x, mediaId: m(x.mediaId) })),
    videos: (rec.videos || []).map((v) => ({ ...v, mediaId: m(v.mediaId) })),
    music: rec.music ? { ...rec.music, mediaId: m(rec.music.mediaId) } : null,
    extras: {
      ...rec.extras,
      hiddenSurprises: (rec.extras?.hiddenSurprises || []).map((h) => ({ ...h, mediaId: m(h.mediaId) })),
      memoryLock: { ...rec.extras?.memoryLock, mediaId: m(rec.extras?.memoryLock?.mediaId) },
    },
  };
}

/* ---------------- online sharing ---------------- */

export { cloudEnabled };

/** 'off' (not configured) | 'local' (never published) | 'stale' (edited since) | 'online' */
export function publishStatus(rec) {
  if (!cloudEnabled) return 'off';
  const entry = rec && getCloudEntry(rec.slug);
  if (!entry) return 'local';
  return String(rec.updatedAt || '') > entry.publishedAt ? 'stale' : 'online';
}

const publishing = new Map();

/**
 * Uploads a saved surprise and its media so its link opens on any device.
 * onProgress(done, total) reports media uploads. Concurrent calls share one run.
 */
export function publishBirthday(slug, onProgress) {
  if (!publishing.has(slug)) {
    const run = doPublish(slug, onProgress).finally(() => publishing.delete(slug));
    publishing.set(slug, run);
  }
  return publishing.get(slug);
}

async function doPublish(slug, onProgress) {
  const rec = getBirthday(slug);
  if (!rec) throw new StorageError('That surprise was not found in this browser.');
  const ids = collectMediaIds(rec);
  const map = new Map();
  let done = 0;
  onProgress?.(done, ids.length);
  for (const id of ids) {
    const m = await getMediaRecord(id);
    if (m?.blob) {
      await uploadBlob(`${slug}/${id}`, m.blob, m.type);
      if (m.thumbBlob) await uploadBlob(`${slug}/${id}-thumb`, m.thumbBlob);
      map.set(id, cloudMediaId(`${slug}/${id}`, !!m.thumbBlob));
    }
    onProgress?.(++done, ids.length);
  }
  await saveRecord(slug, remapMediaIds(rec, map));
}

/** A surprise from this browser, or else its online copy. Null if neither exists. */
export async function findBirthday(slug) {
  const local = getBirthday(slug);
  if (local) return local;
  const remote = await fetchRecord(slug);
  return remote ? normalizeSurprise(remote) : null;
}

/* ---------------- draft ---------------- */

export function emptyDraft() {
  return normalizeSurprise({
    name: '',
    birthdayDate: '',
    senderName: '',
    message: '',
    theme: DEFAULT_THEME,
    photos: [],
    memories: [],
    videos: [],
    music: null,
    celebrations: defaultCelebrations(true),
    extras: defaultExtras(),
    step: 0,
    editingSlug: null,
  });
}

export function saveDraft(draft) {
  writeJson(DRAFT_KEY, { ...draft, savedAt: new Date().toISOString() }, 'your draft');
}

export function getDraft() {
  const d = readJson(DRAFT_KEY, null);
  if (!d || typeof d !== 'object') return null;
  return { ...normalizeSurprise(d), step: Number(d.step) || 0, editingSlug: d.editingSlug || null };
}

/** Removes the draft text and all draft-only media. */
export async function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
  await deleteDraftMedia();
}

function stripDraftFields(d) {
  const { step, editingSlug, savedAt, ...rest } = d;
  return rest;
}

/**
 * Turns the wizard draft into a saved surprise:
 * copies draft media to permanent ids, saves (or updates) the record,
 * removes media no longer used, clears the draft. Returns the saved record.
 */
export async function commitDraft(draft) {
  const ids = collectMediaIds(draft);
  const map = new Map();
  try {
    for (const id of ids) {
      if (isDraftMedia(id)) map.set(id, await copyMedia(id));
    }
  } catch (err) {
    await deleteManyMedia([...map.values()]);
    throw toStorageError(err, 'your photos');
  }

  const clean = normalizeSurprise(stripDraftFields(remapMediaIds(draft, map)));
  clean.name = clean.name.trim();
  clean.senderName = clean.senderName.trim();
  const now = new Date().toISOString();
  let record;

  try {
    const existing = draft.editingSlug ? getBirthday(draft.editingSlug) : null;
    if (existing) {
      record = updateBirthday(existing.slug, { ...clean, createdAt: existing.createdAt });
      const keep = new Set(collectMediaIds(record));
      await deleteManyMedia(collectMediaIds(existing).filter((id) => !keep.has(id)));
    } else {
      let id = randomId(6);
      let slug = makeSlug(clean.name, id);
      while (getBirthday(slug)) {
        id = randomId(6);
        slug = makeSlug(clean.name, id);
      }
      record = saveBirthday({ ...clean, id, slug, createdAt: now, updatedAt: now });
    }
  } catch (err) {
    await deleteManyMedia([...map.values()]);
    throw toStorageError(err, 'your surprise');
  }

  await clearDraft();
  return normalizeSurprise(record);
}

/* ---------------- export / import ---------------- */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Downloads "<slug>.wishverse" – a single JSON file with base64-embedded media. */
export async function exportBirthday(slug) {
  const rec = getBirthday(slug);
  if (!rec) throw new StorageError('That surprise was not found in this browser.');
  const media = {};
  for (const id of collectMediaIds(rec)) {
    const m = await getMediaRecord(id);
    if (!m?.blob) continue;
    media[id] = {
      type: m.type,
      name: m.name,
      kind: m.kind,
      data: await blobToBase64(m.blob),
      thumb: m.thumbBlob ? await blobToBase64(m.thumbBlob) : null,
    };
  }
  const payload = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    surprise: rec,
    media,
  };
  const filename = `${rec.slug}.wishverse`;
  downloadBlob(new Blob([JSON.stringify(payload)], { type: 'application/json' }), filename);
  return filename;
}

/** Reads a .wishverse file and saves it as a surprise in this browser. Returns the record. */
export async function importBirthday(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new StorageError('That file isn’t a valid WishVerse export.');
  }
  if (!payload || payload.format !== EXPORT_FORMAT || !payload.surprise) {
    throw new StorageError('That file isn’t a WishVerse export (.wishverse).');
  }
  const src = normalizeSurprise(payload.surprise);
  if (!src.name) throw new StorageError('This export is missing the birthday person’s name.');

  const map = new Map();
  try {
    for (const [oldId, m] of Object.entries(payload.media || {})) {
      if (!m?.data) continue;
      const newId = newMediaId('m');
      await putMediaRecord(newId, {
        blob: await base64ToBlob(m.data),
        thumbBlob: m.thumb ? await base64ToBlob(m.thumb) : null,
        type: m.type,
        name: m.name,
        kind: m.kind || String(m.type || '').split('/')[0],
      });
      map.set(oldId, newId);
    }
    const rec = remapMediaIds(src, map);
    const id = randomId(6);
    const slug = src.slug && !getBirthday(src.slug) ? src.slug : makeSlug(src.name, id);
    const now = new Date().toISOString();
    const saved = saveBirthday({ ...rec, id, slug, createdAt: src.createdAt || now, updatedAt: now });
    return normalizeSurprise(saved);
  } catch (err) {
    await deleteManyMedia([...map.values()]);
    throw toStorageError(err, 'the imported surprise');
  }
}
