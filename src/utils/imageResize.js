let webpSupport = null;

function supportsWebp() {
  if (webpSupport !== null) return webpSupport;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't read “${file.name || 'this image'}”. It may be corrupted or in an unsupported format.`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed.'))),
      type,
      quality
    );
  });
}

async function drawScaled(img, maxSize, quality) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error('This image has no size — it may be corrupted.');
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  const type = supportsWebp() ? 'image/webp' : 'image/jpeg';
  if (type === 'image/jpeg') {
    // JPEG has no alpha – paint a white background so transparent PNGs don't turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, cw, ch);
  const blob = await canvasToBlob(canvas, type, quality);
  canvas.width = canvas.height = 0; // free memory early (iOS)
  return blob;
}

/** Downscale to maxSize on the long edge and re-encode (WebP, or JPEG fallback). */
export async function resizeImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  const img = await loadImage(file);
  return drawScaled(img, maxSize, quality);
}

/** Returns { blob (≤1600px), thumbBlob (≤400px) } */
export async function processImage(file) {
  const img = await loadImage(file);
  const blob = await drawScaled(img, 1600, 0.82);
  const thumbBlob = await drawScaled(img, 400, 0.78);
  return { blob, thumbBlob };
}
