# 🎁 WishVerse – Turn a Birthday Wish into an Experience

A **frontend-only** birthday surprise builder. Create a cinematic, staged birthday experience with photos, memories, videos, music, a typed love letter, fireworks, a cake you can blow out, quizzes, secret-word memories and hidden gifts. It all runs in the browser. There's no backend, no account and no cloud storage.

---

## 1. Install & run

Requirements: **Node.js 18+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Dev server with hot reload           |
| `npm run build`   | Production build into `dist/`        |
| `npm run preview` | Serves the production build locally  |

> When you deploy `dist/` to a static host, configure an SPA fallback (all routes → `index.html`) so deep links like `/surprise/...` work.

### Dependencies

| Package            | Why                                           |
| ------------------ | --------------------------------------------- |
| `react`, `react-dom` | UI (React 18)                               |
| `react-router-dom` | Routing (v6)                                  |
| `framer-motion`    | Stage transitions and UI motion               |
| `idb-keyval`       | Tiny promise wrapper around IndexedDB (media) |
| `vite`, `@vitejs/plugin-react` | Dev server and build (dev only)   |

There are no UI kits. Styling is plain CSS with CSS variables.

### Online sharing (optional)

Without setup, a surprise link only opens in the browser that created it. To make links open on any device:

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run `supabase/setup.sql`.
3. Copy `.env.example` to `.env.local` and fill in the **Project URL** and **anon public** key from **Project Settings → API**. On Vercel/Netlify, add the same two variables in the project settings and redeploy.

After creating a surprise, WishVerse uploads it, and the success screen shows when the link is live. Surprises made earlier get a **Publish online** button on the Dashboard. Only the browser that published a surprise can update or delete the online copy.

---

## 2. Project structure

```text
wishverse/
├── index.html                 Google Fonts, favicon, root element
├── package.json · vite.config.js
├── public/
│   ├── favicon.svg
│   └── demo/                  Original SVG illustrations used by the demo
└── src/
    ├── main.jsx               React root + BrowserRouter
    ├── App.jsx                Providers, navbar, lazy routes
    ├── index.css              Theme tokens (8 themes), buttons, forms, toasts, modal, shared UI
    ├── styles/                Home.css · Wizard.css · Experience.css · Dashboard.css
    ├── components/
    │   ├── Navbar, Hero, HowItWorks, Features, Toast, Modal, StepProgress, FileDropzone
    │   ├── SuccessScreen, MediaImage (img/video from IndexedDB)
    │   ├── Experience stages: Countdown, MysteryIntro, GiftBox, BirthdayReveal, MemoryGallery,
    │   │   PhotoMosaic, BirthdayLetter, FriendshipMeter, CelebrationPanel, BirthdayCake,
    │   │   BirthdayQuiz, MemoryLock, GiftSurprise, FinalCelebration, MusicPlayer
    │   ├── Effects: ConfettiAnimation, FireworksAnimation, CrackerAnimation, BalloonAnimation,
    │   │   HeartAnimation, SparkleAnimation, StarsBackground
    │   └── wizard/            One component per step + LivePreview, Field, Switch, steps.js
    ├── pages/                 Home, CreateSurprise, Preview, Dashboard, Surprise, Demo, NotFound,
    │                          SurpriseExperience (shared stage engine)
    ├── context/               ToastContext, EffectsContext, MusicContext
    ├── hooks/                 useLocalStorage, useCountdown, useSound, useMediaUrl,
    │                          useReducedMotion, useTimers
    ├── utils/                 storage, media, slug, animations, themes, imageResize,
    │                          validation, melody, clipboard, errors
    └── data/demoData.js       Built-in demo surprise ("Priya")
```

---

## 3. How storage works

All data stays on the device, split into two stores:

| What                                    | Where                                                | Why |
| --------------------------------------- | ---------------------------------------------------- | --- |
| Text and settings (names, message, theme, captions, toggles…) | `localStorage` → key `wishverse:surprises` (array of records) | Small, structured, synchronous |
| Wizard draft text                       | `localStorage` → key `wishverse:draft`               | Survives refreshes and `/preview` |
| Images, videos, audio                   | **IndexedDB** database `wishverse-media`, store `media` | localStorage is ~5 MB and strings only |

- A record only stores **media IDs**, never images or base64 data. Each IndexedDB entry is `{ blob, thumbBlob, type, name, kind }`.
- **Images are resized before saving.** They're scaled to at most 1600 px on the long edge and re-encoded as WebP (JPEG fallback) at quality 0.82, and a 400 px thumbnail is generated for grids, the film strip and the mosaic (`utils/imageResize.js`).
- **Blob URLs are never saved.** `useMediaUrl(mediaId)` reads the Blob from IndexedDB, creates a fresh `URL.createObjectURL`, and revokes it on unmount.
- **Draft media** uses `draft-…` IDs. On **CREATE SURPRISE** they're copied to permanent `m-…` IDs, the record is saved and the draft is cleared, along with any orphaned draft media. On **SAVE CHANGES** (edit mode), media you removed gets deleted.
- Every write is wrapped in `try/catch`. A `QuotaExceededError` shows a friendly "storage is full" toast (`utils/errors.js`).
- **File limits** (validated with toasts):

  | Type   | Max size (before compression) | Max count |
  | ------ | ----------------------------- | --------- |
  | Images | 15 MB                         | 30        |
  | Videos | 50 MB                         | 3         |
  | Audio  | 20 MB                         | 1         |

  Wrong MIME types, HEIC images and formats the browser can't play are rejected.

The public API is in `src/utils/storage.js`:

```js
saveBirthday(birthday)  getBirthday(slug)  getAllBirthdays()
updateBirthday(slug, data)  deleteBirthday(slug)   // also deletes its media
saveDraft(draft)  getDraft()  clearDraft()
commitDraft(draft)                                  // draft -> saved surprise
exportBirthday(slug)  importBirthday(file)
```

and `src/utils/media.js`: `putMedia(file) → mediaId`, `getMediaUrl(mediaId)`, `deleteMedia(mediaId)`.

> 🔐 **Secret words and quiz answers are stored as plain text** in localStorage. That's fine for a fun surprise, but don't use it to protect anything truly private.

---

## 4. Routing

| Route             | Page |
| ----------------- | ---- |
| `/`               | Landing page |
| `/create`         | 10-step wizard (also shows the success screen after creating) |
| `/edit/:slug`     | Same wizard, prefilled. The button becomes **SAVE CHANGES** and the slug stays the same |
| `/preview`        | Full experience from the current draft (no countdown) with a top bar |
| `/dashboard`      | Surprises saved in this browser, plus Import |
| `/surprise/:slug` | The live experience (countdown gate before the birthday) |
| `/demo`           | Full experience with built-in data. It's never gated or saved |
| `*`               | NotFound (also used for unknown slugs) |

Every page is loaded lazily with `React.lazy` + `Suspense`.

---

## 5. The experience engine

`pages/SurpriseExperience.jsx` builds a list of stages from the data and plays them one at a time with `AnimatePresence`:

```text
0 Countdown → 1 Mystery intro → 2 Gift box (music starts) → 3 Reveal → 4 Memories → 5 Mosaic
→ 6 Letter → 7 Friendship meter → 8 Celebration panel → 9 Cake → 10 Quiz / Memory lock
→ 11 Hidden surprises → 12 Finale
```

- Stages with no content are skipped (no photos, no message, extras off, cake toggle off…).
- The countdown is computed from the birthday's **month/day only**. Feb 29 falls back to Feb 28 in non-leap years. The surprise opens on the day and for 7 days afterwards. A **"Creator? Open anyway"** link lets you test it early.
- After the gift box, a floating **MusicPlayer** and a **Skip** button are always available.
- The **📸 Memories** button in the celebration panel opens the gallery and then comes back to the panel.

---

## 6. How the animations work

All effects live in **one global overlay** (`EffectsContext`). It's `position: fixed` with `pointer-events: none`. Any component can call:

```js
const { fire, flashScreen } = useEffects();
fire('confetti', { count: 200, direction: 'left' });
```

Each call bumps that effect's `trigger` counter, so effects can fire again and again. Inside an experience, `setEnabled(celebrations)` blocks any effect the creator switched off.

| Component | Technique |
| --------- | --------- |
| `ConfettiAnimation` | Canvas particles (rects, circles, strips) with gravity, drag, wobble and a fade. Props: `count, duration, intensity, direction ("burst" \| "rain" \| "left" \| "right"), trigger` |
| `FireworksAnimation` | Canvas rockets launched with the velocity needed to reach a target height. They burst into ring, burst or willow shells using additive blending, with radial flashes. Capped at about 400 live sparks |
| `CrackerAnimation` | The same engine in `mode="crackers"`: low, fast ground-level bursts with flashes |
| `BalloonAnimation` | SVG balloons animated with Framer Motion (rise and sway), 8–15 per trigger, removed once off-screen |
| `HeartAnimation` | SVG hearts that rise, rotate slightly and fade |
| `SparkleAnimation` | Canvas four-point stars that twinkle (sine alpha) |
| `StarsBackground` | A canvas starfield that fills its parent. It pauses when the tab is hidden |

All canvas effects share `createCanvasRunner` (`utils/animations.js`):

- `devicePixelRatio` is capped at 2.
- The loop is time-based, so speed doesn't depend on frame rate.
- The loop **sleeps when nothing is alive** and is cancelled on unmount.

**Reduced motion and low-power devices:** `getParticleScale()` cuts particle counts by about 75% when `prefers-reduced-motion: reduce` is set. Counts also go down on small screens and on devices with `navigator.hardwareConcurrency <= 4`. CSS animations are disabled under reduced motion, and big motions turn into fades.

### Music

`MusicContext` plays the uploaded song through an `HTMLAudioElement`. If there's no song, or the browser can't play it, it uses a **"Happy Birthday" melody synthesized live with the Web Audio API** (`utils/melody.js`). The tune is public domain, and no audio file is bundled. The melody uses triangle and sine voices with envelopes, a bass line, a look-ahead scheduler, and supports seek, volume and rate.

- **Music never autoplays.** It starts from the click on the gift box.
- `useSound()` exposes `play`, `pause`, `seek`, `setVolume`, `toggleMute`, `duck()` / `unduck()` and `swell(ms)`.
- Videos call `duck()` while they play.
- The CELEBRATE EVERYTHING finale calls `swell()`: louder, and `playbackRate` 1.08 for a few seconds, then back to normal.

---

## 7. ⚠️ Links are local – use Export / Import

There's no server, so `/surprise/<slug>` **only works in the browser that created it.** The UI says this wherever a link is shown.

To show a surprise on another device:

1. On the Dashboard (or the success screen), click **⬇️ Export**. This downloads `<slug>.wishverse`, a single JSON file with all media embedded as base64.
2. Send the file to the other device. On that device, open WishVerse → **Dashboard → ⬆️ Import**.
3. The surprise is saved there with fresh media IDs. If the original slug is free it's kept, otherwise a new one is generated.

---

## 8. Customization

| What | Where |
| ---- | ----- |
| Name, message, photos, memories, music, theme, effects, extras | Use the wizard, no code needed. Use `/edit/:slug` to change a saved surprise |
| **Theme colors and fonts** | `src/index.css`: each theme is a `[data-theme='id']` block of CSS variables (`--bg`, `--primary`, `--accent`, `--text`, `--card`, `--font-display`, …) |
| Theme names and particle colors | `src/utils/themes.js` (`THEMES`) |
| Add a theme | Add an entry to `THEMES` and a matching `[data-theme='…']` block in `index.css` |
| Upload limits and text lengths | `LIMITS` in `src/utils/validation.js` |
| Sample letters | `SAMPLE_MESSAGES` in `src/components/wizard/steps.js` |
| Random wish lines (🎁 Gift button) | `WISH_LINES` in `src/utils/animations.js` |
| The melody | `MELODY` / `BASS` arrays and `BEAT` in `src/utils/melody.js` |
| **Demo data** | `src/data/demoData.js`. Demo images are `demo:<file>` IDs that point to `public/demo/<file>`. Add your own SVG/PNG there and reference it the same way |
| Stage order | `stages` in `src/pages/SurpriseExperience.jsx` |

---

## 9. Browser support

- Built for current **Chrome, Edge, Firefox and Safari** (desktop and mobile). It uses only standard APIs: IndexedDB, Canvas 2D, Web Audio and `URL.createObjectURL`.
- **Microphone "blow the candles"** is optional. It uses `getUserMedia` and a Web Audio RMS threshold. The **BLOW THE CANDLES** button always works, even without permission.
- **Web Share** is optional. Where it isn't supported, Share copies the link instead. **Clipboard** falls back to `execCommand('copy')` on insecure origins.
- Images are stored as **WebP** where the browser can encode it, otherwise JPEG.
- **Private / incognito mode** may limit or wipe storage. You'll see a toast if saving fails.
- HEIC photos (iPhone) can't be decoded by most browsers. Export them as JPG first.

---

## 10. Accessibility

- Semantic landmarks, a skip link and labels on every input.
- Visible focus rings, `role="switch"` toggles and radio-group theme picker with arrow keys.
- `aria-live` toasts and stage announcements. The letter's full text is given to screen readers while it types visually.
- Keyboard control of every stage (← → in the memory gallery).
- Contrast is tuned for WCAG AA in all 8 themes.
- `prefers-reduced-motion` support throughout.
- The app never uses `alert()` or `confirm()`. It uses a custom toast system and an accessible modal.

Made with 💖, so someone can say *"Wow! Someone created an entire experience just for me."*
