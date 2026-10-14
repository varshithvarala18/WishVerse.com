import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useMediaUrl from '../hooks/useMediaUrl.js';
import { MelodyPlayer, MELODY_DURATION } from '../utils/melody.js';
import { useToast } from './ToastContext.jsx';

export const MusicContext = createContext(null);
/** Separate context for the fast-changing playback position (only MusicPlayer needs it). */
export const MusicTimeContext = createContext({ current: 0, duration: 0 });

/*
 * Plays the creator's song (HTMLAudioElement) or, if none / it fails, the
 * built-in synthesized melody. Never starts on its own: play() must be called
 * from a user gesture (the gift box click).
 */
export function MusicProvider({ music, children }) {
  const toast = useToast();
  const customUrl = useMediaUrl(music?.mediaId || null);
  const [failed, setFailed] = useState(false);
  const source = music?.mediaId && !failed ? 'custom' : 'melody';

  const audioRef = useRef(null);
  const melodyRef = useRef(null);
  const wantPlayRef = useRef(false);
  const duckRef = useRef(1);
  const swellRef = useRef(1);
  const swellTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(source === 'melody' ? MELODY_DURATION : 0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const volRef = useRef({ volume: 0.8, muted: false });
  volRef.current = { volume, muted };

  const getMelody = useCallback(() => {
    if (!melodyRef.current) melodyRef.current = new MelodyPlayer();
    return melodyRef.current;
  }, []);

  const applyVolume = useCallback(() => {
    const { volume: v, muted: m } = volRef.current;
    const eff = m ? 0 : Math.min(1, v * duckRef.current * swellRef.current);
    if (audioRef.current) audioRef.current.volume = eff;
    if (melodyRef.current) melodyRef.current.setVolume(eff);
  }, []);

  useEffect(applyVolume, [volume, muted, applyVolume]);

  // Create / tear down the <audio> element for the creator's song.
  useEffect(() => {
    if (source !== 'custom' || !customUrl) return undefined;
    const a = new Audio();
    a.preload = 'auto';
    a.loop = true;
    a.src = customUrl;
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onTime = () => setCurrent(a.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      toast.info('Couldn’t play the uploaded song here — playing the built-in birthday melody instead 🎵');
      setFailed(true);
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('error', onError);
    audioRef.current = a;
    applyVolume();
    if (wantPlayRef.current) a.play().catch(() => {});
    return () => {
      a.pause();
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('error', onError);
      a.removeAttribute('src');
      a.load();
      if (audioRef.current === a) audioRef.current = null;
    };
  }, [source, customUrl, applyVolume, toast]);

  // When we fall back to the melody after an error, continue playing if we were.
  useEffect(() => {
    if (source === 'melody') {
      setDuration(MELODY_DURATION);
      if (wantPlayRef.current) {
        const m = getMelody();
        applyVolume();
        m.play();
        setPlaying(true);
      }
    }
  }, [source, getMelody, applyVolume]);

  // Track the melody's position.
  useEffect(() => {
    if (source !== 'melody' || !playing) return undefined;
    const id = setInterval(() => {
      if (melodyRef.current) setCurrent(melodyRef.current.currentTime);
    }, 250);
    return () => clearInterval(id);
  }, [source, playing]);

  // Clean up the audio graph on unmount.
  useEffect(
    () => () => {
      clearTimeout(swellTimer.current);
      if (melodyRef.current) {
        melodyRef.current.destroy();
        melodyRef.current = null;
      }
    },
    []
  );

  const play = useCallback(() => {
    wantPlayRef.current = true;
    setStarted(true);
    if (source === 'custom') {
      const a = audioRef.current;
      if (a) {
        applyVolume();
        a.play().catch((err) => {
          if (err && err.name === 'NotAllowedError') {
            toast.info('Tap ▶ on the music player to start the song 🎵');
          } else {
            setFailed(true);
          }
        });
      }
      return;
    }
    try {
      const m = getMelody();
      applyVolume();
      m.play();
      setPlaying(true);
    } catch {
      toast.info('This browser can’t play the birthday melody.');
    }
  }, [source, applyVolume, getMelody, toast]);

  const pause = useCallback(() => {
    wantPlayRef.current = false;
    if (source === 'custom') audioRef.current?.pause();
    else if (melodyRef.current) {
      melodyRef.current.pause();
      setPlaying(false);
    }
  }, [source]);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const seek = useCallback(
    (t) => {
      if (source === 'custom' && audioRef.current) {
        audioRef.current.currentTime = t;
        setCurrent(t);
      } else if (source === 'melody') {
        getMelody().seek(t);
        setCurrent(t);
      }
    },
    [source, getMelody]
  );

  const stop = useCallback(() => {
    pause();
    seek(0);
    setStarted(false);
  }, [pause, seek]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const duck = useCallback(() => {
    duckRef.current = 0.15;
    applyVolume();
  }, [applyVolume]);

  const unduck = useCallback(() => {
    duckRef.current = 1;
    applyVolume();
  }, [applyVolume]);

  /** Finale: louder + slightly faster for `ms`, then restore. */
  const swell = useCallback(
    (ms = 8000) => {
      clearTimeout(swellTimer.current);
      swellRef.current = 1.35;
      if (audioRef.current) audioRef.current.playbackRate = 1.08;
      melodyRef.current?.setRate(1.08);
      applyVolume();
      swellTimer.current = setTimeout(() => {
        swellRef.current = 1;
        if (audioRef.current) audioRef.current.playbackRate = 1;
        melodyRef.current?.setRate(1);
        applyVolume();
      }, ms);
    },
    [applyVolume]
  );

  const label = source === 'custom' ? music?.fileName || 'Your song' : 'Happy Birthday (built-in melody)';

  const value = useMemo(
    () => ({
      playing,
      started,
      volume,
      muted,
      source,
      label,
      play,
      pause,
      toggle,
      stop,
      seek,
      setVolume,
      toggleMute,
      duck,
      unduck,
      swell,
    }),
    [playing, started, volume, muted, source, label, play, pause, toggle, stop, seek, setVolume, toggleMute, duck, unduck, swell]
  );

  const time = useMemo(() => ({ current, duration }), [current, duration]);

  return (
    <MusicContext.Provider value={value}>
      <MusicTimeContext.Provider value={time}>{children}</MusicTimeContext.Provider>
    </MusicContext.Provider>
  );
}
