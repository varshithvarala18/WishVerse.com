const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** "Priya Sharma!" -> "priya-sharma" (ASCII only, max 40 chars). */
export function slugify(input) {
  const slug = String(input || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug || 'someone';
}

/** Cryptographically random lowercase id, e.g. "k3f9a2". */
export function randomId(length = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('');
}

/** slugify(name) + "-birthday-" + id */
export function makeSlug(name, id) {
  return `${slugify(name)}-birthday-${id}`;
}

export function surpriseUrl(slug) {
  return `${window.location.origin}/surprise/${slug}`;
}
