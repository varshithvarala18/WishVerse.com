const MB = 1024 * 1024;

export const LIMITS = {
  imageMaxBytes: 15 * MB,
  maxPhotos: 30,
  videoMaxBytes: 50 * MB,
  maxVideos: 3,
  audioMaxBytes: 20 * MB,
  nameMax: 40,
  messageMin: 10,
  messageMax: 1500,
  captionMax: 120,
  descriptionMax: 400,
  maxHidden: 2,
};

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function canPlay(kind, type) {
  try {
    const el = document.createElement(kind);
    return el.canPlayType(type) !== '';
  } catch {
    return true;
  }
}

/**
 * Validate a picked file. Returns null when OK, or a friendly error string.
 * kind: "image" | "video" | "audio"
 */
export function checkFile(file, kind) {
  if (!file) return 'No file selected.';
  const name = file.name || 'This file';
  const type = (file.type || '').toLowerCase();

  if (kind === 'image') {
    if (!type.startsWith('image/')) return `“${name}” isn't an image. Try JPG, PNG or WebP.`;
    if (/heic|heif/.test(type)) return `“${name}” is HEIC, which browsers can't display. Export it as JPG first.`;
    if (file.size > LIMITS.imageMaxBytes)
      return `“${name}” is ${formatBytes(file.size)} — images must be 15 MB or smaller.`;
    return null;
  }
  if (kind === 'video') {
    if (!type.startsWith('video/')) return `“${name}” isn't a video file.`;
    if (file.size > LIMITS.videoMaxBytes)
      return `“${name}” is ${formatBytes(file.size)} — videos must be 50 MB or smaller.`;
    if (!canPlay('video', type)) return `“${name}” (${type}) can't be played in this browser. Try MP4 or WebM.`;
    return null;
  }
  if (kind === 'audio') {
    if (!type.startsWith('audio/')) return `“${name}” isn't an audio file.`;
    if (file.size > LIMITS.audioMaxBytes)
      return `“${name}” is ${formatBytes(file.size)} — music must be 20 MB or smaller.`;
    if (!canPlay('audio', type)) return `“${name}” (${type}) can't be played in this browser. Try MP3 or M4A.`;
    return null;
  }
  return 'Unsupported file.';
}

/**
 * Validates one wizard step.
 * Returns { errors: { field: message }, warnings: [message] }
 */
export function validateStep(stepId, draft) {
  const errors = {};
  const warnings = [];

  switch (stepId) {
    case 'person': {
      const name = (draft.name || '').trim();
      if (!name) errors.name = 'Please enter the birthday person’s name.';
      else if (name.length > LIMITS.nameMax) errors.name = `Name must be ${LIMITS.nameMax} characters or fewer.`;
      if ((draft.senderName || '').trim().length > LIMITS.nameMax)
        errors.senderName = `Keep the “From” name under ${LIMITS.nameMax} characters.`;
      if (!draft.birthdayDate) errors.birthdayDate = 'Please pick the birthday date.';
      else if (Number.isNaN(new Date(`${draft.birthdayDate}T00:00:00`).getTime()))
        errors.birthdayDate = 'That date doesn’t look right.';
      break;
    }
    case 'message': {
      const msg = (draft.message || '').trim();
      if (!msg) errors.message = 'Write a birthday message — it’s the heart of the surprise 💌';
      else if (msg.length < LIMITS.messageMin) errors.message = `Message should be at least ${LIMITS.messageMin} characters.`;
      else if ((draft.message || '').length > LIMITS.messageMax)
        errors.message = `Message must be ${LIMITS.messageMax} characters or fewer.`;
      break;
    }
    case 'photos': {
      if (!draft.photos?.length) warnings.push('Tip: adding at least one photo makes the surprise much more personal 📸');
      break;
    }
    case 'memories': {
      (draft.memories || []).forEach((m, i) => {
        if (!(m.caption || '').trim()) errors[`memory-${m.id}`] = `Memory ${i + 1} needs a caption.`;
      });
      break;
    }
    case 'theme': {
      if (!draft.theme) errors.theme = 'Pick a theme.';
      break;
    }
    case 'extras': {
      const ex = draft.extras || {};
      (ex.hiddenSurprises || []).forEach((h, i) => {
        if (h.type === 'message' && !(h.text || '').trim())
          errors[`hidden-${i}`] = `Hidden surprise ${i + 1} needs a message.`;
        if ((h.type === 'photo' || h.type === 'video') && !h.mediaId)
          errors[`hidden-${i}`] = `Hidden surprise ${i + 1} needs a ${h.type}.`;
      });
      if (ex.quiz?.enabled) {
        if (!(ex.quiz.question || '').trim()) errors.quizQuestion = 'Write the quiz question.';
        (ex.quiz.options || []).forEach((o, i) => {
          if (!(o || '').trim()) errors[`quizOption${i}`] = `Option ${i + 1} is empty.`;
        });
        if (!(ex.quiz.rewardText || '').trim()) errors.quizReward = 'Add a reward message for the right answer.';
      }
      if (ex.memoryLock?.enabled) {
        if (!(ex.memoryLock.secretWord || '').trim()) errors.lockWord = 'Set a secret word.';
        if (!(ex.memoryLock.text || '').trim() && !ex.memoryLock.mediaId)
          errors.lockContent = 'Add a locked message or photo.';
      }
      if (ex.friendshipMeter?.enabled && !(ex.friendshipMeter.label || '').trim())
        errors.meterLabel = 'Give the meter a label.';
      break;
    }
    default:
      break;
  }
  return { errors, warnings };
}

/** Index of the first step (from stepIds) that has errors, or -1. */
export function firstInvalidStep(stepIds, draft, upTo = stepIds.length) {
  for (let i = 0; i < Math.min(upTo, stepIds.length); i += 1) {
    if (Object.keys(validateStep(stepIds[i], draft).errors).length) return i;
  }
  return -1;
}
