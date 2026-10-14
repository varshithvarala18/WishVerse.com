/*
 * Each theme's colors/fonts are CSS variables in index.css under [data-theme="id"].
 * Here we keep the metadata + particle palettes used by the canvas effects.
 */
export const THEMES = [
  {
    id: 'romantic',
    name: 'Romantic',
    emoji: '❤️',
    description: 'Deep roses, soft pinks and handwritten love.',
    particles: ['#ff8fb1', '#ffc2d4', '#ff4d6d', '#ffd1dc', '#ffffff', '#c9184a'],
  },
  {
    id: 'friendship',
    name: 'Friendship',
    emoji: '💙',
    description: 'Ocean blues with sunny yellow highlights.',
    particles: ['#6cc4ff', '#a8dcff', '#ffd166', '#ffffff', '#3a86ff', '#06d6a0'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    emoji: '✨',
    description: 'Champagne, warm charcoal and serif grace.',
    particles: ['#e8d5b0', '#f6ead2', '#c9b8ff', '#ffffff', '#bfa87a'],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    emoji: '🎬',
    description: 'Midnight purples, golden glow, movie magic.',
    particles: ['#f5c46b', '#ff6b97', '#ffdf9e', '#9b8cff', '#ffffff', '#5ce1e6'],
  },
  {
    id: 'cute',
    name: 'Cute',
    emoji: '🧸',
    description: 'Pastel candy colors and bubbly letters.',
    particles: ['#ff8fab', '#ffc6ff', '#bde0fe', '#ffd6a5', '#caffbf', '#c2185b'],
  },
  {
    id: 'luxury',
    name: 'Luxury',
    emoji: '👑',
    description: 'Black and gold, regal and refined.',
    particles: ['#d4af37', '#f3e5ab', '#fff8dc', '#b8860b', '#ffffff'],
  },
  {
    id: 'party',
    name: 'Colorful Party',
    emoji: '🎉',
    description: 'Neon brights — it’s a party!',
    particles: ['#ffd60a', '#4cc9f0', '#f72585', '#7209b7', '#06d6a0', '#ff9e00'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '🤍',
    description: 'Clean white space with a touch of red.',
    particles: ['#111111', '#be123c', '#9ca3af', '#f43f5e', '#d4d4d4'],
  },
];

export const DEFAULT_THEME = 'cinematic';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
}

/** Particle colors for whichever theme is active on <html>. */
export function currentParticleColors() {
  const id = document.documentElement.getAttribute('data-theme');
  return getTheme(id).particles;
}

/** Applies a theme to <html> and returns a function that restores the previous one. */
export function applyRootTheme(id) {
  const root = document.documentElement;
  const prev = root.getAttribute('data-theme') || DEFAULT_THEME;
  root.setAttribute('data-theme', getTheme(id).id);
  return () => root.setAttribute('data-theme', prev);
}
