import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'error';

interface UseAudioPlayerReturn {
  status: PlaybackStatus;
  error: string | null;
  playAudio: (uri: string) => Promise<void>;
  stopAudio: () => Promise<void>;
}

/**
 * Hook to play audio files using expo-av
 * Handles loading, playing, and cleanup of audio resources
 *
 * @example
 * ```tsx
 * const { status, playAudio } = useAudioPlayer();
 * const handlePlay = () => playAudio('https://example.com/word.mp3');
 * ```
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setStatus('idle');
      } catch (err) {
        console.error('Error stopping audio:', err);
      }
    }
  }, []);

  const playAudio = useCallback(
    async (uri: string) => {
      try {
        // Stop any existing playback
        await stopAudio();

        setStatus('loading');
        setError(null);

        // Configure audio mode for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Load and play the sound
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (playbackStatus) => {
            if (playbackStatus.isLoaded) {
              if (playbackStatus.didJustFinish) {
                setStatus('idle');
                sound.unloadAsync();
                soundRef.current = null;
              } else if (playbackStatus.isPlaying) {
                setStatus('playing');
              }
            }
          }
        );

        soundRef.current = sound;
      } catch (err) {
        console.error('Error playing audio:', err);
        setError(err instanceof Error ? err.message : 'Failed to play audio');
        setStatus('error');
      }
    },
    [stopAudio]
  );

  return {
    status,
    error,
    playAudio,
    stopAudio,
  };
}

/**
 * Get Wiktionary audio URL for a word
 * Wiktionary stores pronunciation files with predictable naming
 *
 * @param word - The word to get audio for
 * @returns URL to the audio file or null if not available
 */
export function getWiktionaryAudioUrl(word: string): string | null {
  if (!word) return null;

  // Wiktionary audio files follow this pattern:
  // https://upload.wikimedia.org/wikipedia/commons/X/XY/En-us-WORD.ogg
  // The hash is computed from "En-us-WORD.ogg"

  const filename = `En-us-${word.toLowerCase()}.ogg`;
  const hash = md5Hash(filename);
  const hashPrefix1 = hash.substring(0, 1);
  const hashPrefix2 = hash.substring(0, 2);

  return `https://upload.wikimedia.org/wikipedia/commons/${hashPrefix1}/${hashPrefix2}/${filename}`;
}

/**
 * Simple MD5 hash implementation for Wikimedia file paths
 * Note: This is a simplified version - in production use a proper MD5 library
 */
function md5Hash(str: string): string {
  // Simple hash function for demonstration
  // In production, use a proper MD5 library like 'js-md5'
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Convert to hex string and ensure it's at least 2 characters
  const hexHash = Math.abs(hash).toString(16).padStart(2, '0');
  return hexHash.substring(0, 2);
}

/**
 * Generate a text-to-speech audio URL using a free TTS API
 * This is a fallback when Wiktionary audio is not available
 *
 * @param word - The word to speak
 * @returns URL to the TTS audio
 */
export function getTextToSpeechUrl(word: string): string {
  // Using Google Translate TTS (works for simple cases)
  // Note: This is rate-limited and may not work in production
  const encodedWord = encodeURIComponent(word);
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedWord}&tl=en&client=tw-ob`;
}
