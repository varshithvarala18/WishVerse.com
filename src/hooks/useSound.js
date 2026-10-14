import { useContext } from 'react';
import { MusicContext } from '../context/MusicContext.jsx';

const noop = () => {};
const SILENT = {
  playing: false,
  started: false,
  current: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  source: 'melody',
  label: '',
  play: noop,
  pause: noop,
  toggle: noop,
  stop: noop,
  seek: noop,
  setVolume: noop,
  toggleMute: noop,
  duck: noop,
  unduck: noop,
  swell: noop,
};

/** Access the music player (play/pause/seek/duck/swell). Safe outside a provider. */
export default function useSound() {
  return useContext(MusicContext) || SILENT;
}
