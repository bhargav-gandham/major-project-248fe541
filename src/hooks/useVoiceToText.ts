import { useState, useCallback, useRef, useEffect } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceToTextOptions {
  initialValue?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceToText = (options: UseVoiceToTextOptions = {}) => {
  const { initialValue = '', onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const finalTranscriptRef = useRef(initialValue);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Sync with external value changes
  useEffect(() => {
    if (!isListening) {
      setTranscript(initialValue);
      finalTranscriptRef.current = initialValue;
    }
  }, [initialValue, isListening]);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => {
      console.log('[Voice] Scribe connected successfully');
      setIsListening(true);
    },
    onDisconnect: () => {
      console.log('[Voice] Scribe disconnected');
      setIsListening(false);
      setInterimTranscript('');
    },
    onPartialTranscript: (data) => {
      console.log('[Voice] Partial:', data.text);
      setInterimTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      console.log('[Voice] Committed:', JSON.stringify(data));
      if (!data.text || data.text.trim() === '') {
        console.warn('[Voice] Empty transcript committed - mic may not be capturing audio');
        return;
      }
      const newTranscript = finalTranscriptRef.current
        ? finalTranscriptRef.current + ' ' + data.text
        : data.text;
      finalTranscriptRef.current = newTranscript;
      setTranscript(newTranscript);
      setInterimTranscript('');
      onResultRef.current?.(newTranscript);
    },
    onError: (err) => {
      console.error('[Voice] Scribe error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      onErrorRef.current?.(message);
    },
    onAuthError: (data) => {
      console.error('[Voice] Auth error:', data.error);
      setError('Authentication error: ' + data.error);
    },
    onQuotaExceededError: (data) => {
      console.error('[Voice] Quota exceeded:', data.error);
      setError('Quota exceeded: ' + data.error);
    },
    onInsufficientAudioActivityError: (data) => {
      console.error('[Voice] Insufficient audio:', data.error);
      setError('No audio detected: ' + data.error);
    },
  });

  const startListening = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] Microphone permission granted');

      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        'elevenlabs-scribe-token'
      );

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || 'Failed to get transcription token');
      }

      console.log('[Voice] Got token, connecting to Scribe...');
      console.log('[Voice] Scribe status before connect:', scribe.status);

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[Voice] Scribe connect() resolved, status:', scribe.status);
    } catch (err: any) {
      console.error('[Voice] Error starting:', err);
      const message = err.message || 'Failed to start voice recording';
      setError(message);
      onErrorRef.current?.(message);
    } finally {
      setIsConnecting(false);
    }
  }, [scribe]);

  const stopListening = useCallback(() => {
    console.log('[Voice] Stopping, status:', scribe.status);
    scribe.disconnect();
    setIsListening(false);
    setInterimTranscript('');
  }, [scribe]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isConnecting,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};
