import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = '452f4d34c9093c28d1cfcf7010ac0ac9f2f489f7';

interface TranscriptSegment {
  text: string;
  timestamp: number;
  speaker?: string;
  isFinal: boolean;
}

interface UseDeepgramReturn {
  transcript: string;
  segments: TranscriptSegment[];
  isConnected: boolean;
  error: string | null;
  stream: MediaStream | null;
  /** Seconds elapsed since recording started — resets to 0 once stopped. */
  duration: number;
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
  clearTranscript: () => void;
}

export const useDeepgram = (): UseDeepgramReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const connectionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Elapsed recording timer — ticks while connected, resets once stopped.
  useEffect(() => {
    if (!isConnected) {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const startTranscription = useCallback(async () => {
    try {
      setError(null);

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Create Deepgram client
      const deepgram = createClient(DEEPGRAM_API_KEY);

      // Create WebSocket connection for live transcription
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'ru',
        smart_format: true,
        interim_results: true,
        punctuate: true,
        diarize: true, // Speaker diarization to differentiate doctor and patient
        utterance_end_ms: 1000,
      });

      connectionRef.current = connection;

      // Handle connection open
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        setIsConnected(true);

        // Create MediaRecorder to capture audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });

        mediaRecorderRef.current = mediaRecorder;

        // Send audio data to Deepgram
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send data every 250ms
      });

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0];

        if (transcript && transcript.transcript) {
          const words = transcript.words || [];
          const speaker = words[0]?.speaker !== undefined ? `Speaker ${words[0].speaker}` : undefined;

          const newSegment: TranscriptSegment = {
            text: transcript.transcript,
            timestamp: Date.now(),
            speaker,
            isFinal: data.is_final || false,
          };

          // Only add final transcripts to the full transcript
          if (data.is_final) {
            setTranscript((prev) => {
              const newText = prev ? `${prev} ${transcript.transcript}` : transcript.transcript;
              return newText;
            });

            setSegments((prev) => [...prev, newSegment]);
          }
        }
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (err: any) => {
        console.error('Deepgram error:', err);
        setError('Ошибка транскрипции');
      });

      // Handle connection close
      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        setIsConnected(false);
      });

    } catch (err: any) {
      console.error('Error starting transcription:', err);
      setError(err.message || 'Не удалось начать транскрипцию');
      setIsConnected(false);
    }
  }, []);

  const stopTranscription = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setSegments([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    transcript,
    segments,
    isConnected,
    error,
    stream: streamRef.current,
    duration,
    startTranscription,
    stopTranscription,
    clearTranscript,
  };
};
