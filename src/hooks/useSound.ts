import { useRef, useCallback, useState } from 'react';
import { publicAsset } from '../assets';
import { UserSettings } from '../types';

export async function safePlay(media: HTMLMediaElement) {
  try {
    await media.play();
    return true;
  } catch (err) {
    console.warn('[Audio] autoplay blocked or playback failed', err);
    return false;
  }
}

export function useSound(settings: UserSettings) {
  const themeAudioRef = useRef<HTMLAudioElement>(null);
  const correctAudioRef = useRef<HTMLAudioElement>(null);
  const wrongAudioRef = useRef<HTMLAudioElement>(null);
  const timesUpAudioRef = useRef<HTMLAudioElement>(null);
  const wonAudioRef = useRef<HTMLAudioElement>(null);
  const lostAudioRef = useRef<HTMLAudioElement>(null);
  const welcomeAudioRef = useRef<HTMLAudioElement>(null);

  const themeAudioSrc = publicAsset('theme.mp3');
  const correctAudioSrc = publicAsset('correct.mp3');
  const wrongAudioSrc = publicAsset('wrong.mp3');
  const timesUpAudioSrc = publicAsset('times-up.mp3');
  const wonAudioSrc = publicAsset('won.mp3');
  const lostAudioSrc = publicAsset('lost.mp3');
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const tryPlay = useCallback(async (audioRef: React.RefObject<HTMLAudioElement | null>, resetTime = false) => {
    if (!audioRef.current) {
      return false;
    }

    if (resetTime) {
      audioRef.current.currentTime = 0;
    }

    const played = await safePlay(audioRef.current);
    setAudioNeedsInteraction(!played);
    return played;
  }, []);

  const playSfx = useCallback((audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (settings.soundEnabled && settings.sfxEnabled && audioRef.current) {
      void tryPlay(audioRef, true);
    }
  }, [settings.soundEnabled, settings.sfxEnabled, tryPlay]);

  const playMusic = useCallback((audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (settings.soundEnabled && settings.musicEnabled && audioRef.current) {
      void tryPlay(audioRef);
    }
  }, [settings.soundEnabled, settings.musicEnabled, tryPlay]);

  const enableAudioFromGesture = useCallback(async () => {
    if (!settings.soundEnabled) {
      setAudioNeedsInteraction(false);
      return false;
    }

    let played = false;

    if (settings.musicEnabled) {
      if (themeAudioRef.current) {
        themeAudioRef.current.volume = 0.3;
      }
      played = await tryPlay(themeAudioRef);
    }

    if (!played && settings.musicEnabled && welcomeAudioRef.current) {
      welcomeAudioRef.current.volume = 1.0;
      played = await tryPlay(welcomeAudioRef, true);
    }

    setAudioNeedsInteraction(!played);
    return played;
  }, [settings.musicEnabled, settings.soundEnabled, tryPlay]);

  return {
    themeAudioRef,
    correctAudioRef,
    wrongAudioRef,
    timesUpAudioRef,
    wonAudioRef,
    lostAudioRef,
    welcomeAudioRef,
    themeAudioSrc,
    correctAudioSrc,
    wrongAudioSrc,
    timesUpAudioSrc,
    wonAudioSrc,
    lostAudioSrc,
    audioNeedsInteraction,
    playSfx,
    playMusic,
    tryPlay,
    enableAudioFromGesture,
    setAudioNeedsInteraction,
  };
}
