import { checkFile } from '../../utils/validation.js';
import { putMedia } from '../../utils/media.js';
import { errorMessage } from '../../utils/errors.js';

export const STEPS = [
  { id: 'person', title: 'Birthday Person', icon: '🎂' },
  { id: 'message', title: 'Message', icon: '💌' },
  { id: 'photos', title: 'Photos', icon: '📸' },
  { id: 'memories', title: 'Memories', icon: '🧡' },
  { id: 'videos', title: 'Videos', icon: '🎬' },
  { id: 'music', title: 'Music', icon: '🎵' },
  { id: 'theme', title: 'Theme', icon: '🎨' },
  { id: 'celebrations', title: 'Celebrations', icon: '🎉' },
  { id: 'extras', title: 'Extras', icon: '🔐' },
  { id: 'review', title: 'Preview & Create', icon: '🎁' },
];

export const STEP_IDS = STEPS.map((s) => s.id);

export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * Validates and stores picked files one by one (images get resized).
 * Calls onAdded(mediaId, file) for each stored file. Returns how many were added.
 */
export async function uploadFiles(files, kind, { max = Infinity, existing = 0, label = 'files', toast, onAdded }) {
  const room = max - existing;
  if (room <= 0) {
    toast.error(`You can add up to ${max} ${label}.`);
    return 0;
  }
  let list = files;
  if (files.length > room) {
    toast.info(`Only ${room} more ${label} fit (max ${max}) — the rest were skipped.`);
    list = files.slice(0, room);
  }
  let added = 0;
  for (const file of list) {
    const err = checkFile(file, kind);
    if (err) {
      toast.error(err);
      continue;
    }
    try {
      const id = await putMedia(file);
      onAdded(id, file);
      added += 1;
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return added;
}

export const SAMPLE_MESSAGES = [
  (n) =>
    `Happy Birthday ${n}! 🎉\n\nAnother year of you being absolutely wonderful. Thank you for every laugh, every late-night talk and every adventure we've shared.\n\nMay this year bring you everything you've been wishing for — and a few surprises you never saw coming. Keep shining! ❤️`,
  (n) =>
    `Dear ${n},\n\nOn your special day I just want you to know how much you mean to me. You make ordinary days feel magical and hard days feel lighter.\n\nHere's to more memories, more cake and more of your beautiful smile. Happy Birthday! 🎂✨`,
  (n) =>
    `HAPPY BIRTHDAY ${n.toUpperCase()}! 🥳\n\nYou're officially one year more awesome. Thank you for being the best friend anyone could ask for — chaotic, kind and completely irreplaceable.\n\nLet's make this year the best one yet! 🎈`,
];
