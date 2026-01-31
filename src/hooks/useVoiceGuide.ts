"use client";

import { useRef, useCallback, useEffect } from "react";

export type VoiceGuideKey =
  | "chat_welcome"
  | "doctor_recommended"
  | "modal_step_1"
  | "modal_step_2"
  | "modal_step_3"
  | "modal_step_4"
  | "booking_complete";

const AUDIO_PATHS: Record<string, Record<VoiceGuideKey, string>> = {
  ru: {
    chat_welcome: "/audio/ru/chat_welcome.mp3",
    doctor_recommended: "/audio/ru/doctor_recommended.mp3",
    modal_step_1: "/audio/ru/modal_step_1.mp3",
    modal_step_2: "/audio/ru/modal_step_2.mp3",
    modal_step_3: "/audio/ru/modal_step_3.mp3",
    modal_step_4: "/audio/ru/modal_step_4.mp3",
    booking_complete: "/audio/ru/booking_complete.mp3",
  },
  // Add other languages when audio files are available
  en: {
    chat_welcome: "/audio/ru/chat_welcome.mp3",
    doctor_recommended: "/audio/ru/doctor_recommended.mp3",
    modal_step_1: "/audio/ru/modal_step_1.mp3",
    modal_step_2: "/audio/ru/modal_step_2.mp3",
    modal_step_3: "/audio/ru/modal_step_3.mp3",
    modal_step_4: "/audio/ru/modal_step_4.mp3",
    booking_complete: "/audio/ru/booking_complete.mp3",
  },
  kz: {
    chat_welcome: "/audio/ru/chat_welcome.mp3",
    doctor_recommended: "/audio/ru/doctor_recommended.mp3",
    modal_step_1: "/audio/ru/modal_step_1.mp3",
    modal_step_2: "/audio/ru/modal_step_2.mp3",
    modal_step_3: "/audio/ru/modal_step_3.mp3",
    modal_step_4: "/audio/ru/modal_step_4.mp3",
    booking_complete: "/audio/ru/booking_complete.mp3",
  },
};

interface UseVoiceGuideOptions {
  language?: string;
  autoStop?: boolean; // Stop current audio when playing new one
}

export function useVoiceGuide(options: UseVoiceGuideOptions = {}) {
  const { language = "ru", autoStop = true } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  const play = useCallback(
    (key: VoiceGuideKey) => {
      // Stop current audio if autoStop is enabled
      if (autoStop && audioRef.current) {
        stop();
      }

      const lang = AUDIO_PATHS[language] ? language : "ru";
      const audioPath = AUDIO_PATHS[lang][key];

      if (!audioPath) {
        console.warn(`No audio found for key: ${key}, language: ${lang}`);
        return;
      }

      try {
        const audio = new Audio(audioPath);
        audioRef.current = audio;
        isPlayingRef.current = true;

        audio.addEventListener("ended", () => {
          isPlayingRef.current = false;
        });

        audio.addEventListener("error", (e) => {
          console.error(`Error playing audio ${key}:`, e);
          isPlayingRef.current = false;
        });

        // Play with user interaction handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Auto-play was prevented (common on mobile)
            console.log("Audio autoplay prevented:", error);
            isPlayingRef.current = false;
          });
        }
      } catch (error) {
        console.error(`Error creating audio for ${key}:`, error);
      }
    },
    [language, autoStop, stop]
  );

  const isPlaying = useCallback(() => {
    return isPlayingRef.current;
  }, []);

  return {
    play,
    stop,
    isPlaying,
  };
}

export default useVoiceGuide;
