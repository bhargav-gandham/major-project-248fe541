import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  initialValue?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

// Voice-to-text hook with lazy initialization
export const useVoiceToText = (options: UseVoiceToTextOptions = {}) => {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    initialValue = '',
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef(initialValue);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Sync with external value changes
  useEffect(() => {
    if (!isListeningRef.current) {
      setTranscript(initialValue);
      finalTranscriptRef.current = initialValue;
    }
  }, [initialValue]);

  // Check support on mount
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const initRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended, shouldRestart:', isListeningRef.current);
      if (isListeningRef.current) {
        try {
          console.log('[Voice] Auto-restarting...');
          recognition.start();
          return;
        } catch (e) {
          console.log('[Voice] Failed to auto-restart:', e);
        }
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.log('[Voice] Error:', event.error);
      if (event.error === 'no-speech') {
        console.log('[Voice] No speech timeout - will auto-restart');
        return;
      }

      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'audio-capture': 'No microphone found. Please check your device.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
      };

      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      setError(message);
      onErrorRef.current?.(message);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      console.log('[Voice] Got result, resultIndex:', event.resultIndex);
      let interimText = '';
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        console.log('[Voice] Text:', text, 'isFinal:', result.isFinal);

        if (result.isFinal) {
          finalText += text + ' ';
          finalTranscriptRef.current = finalText;
        } else {
          interimText += text;
        }
      }

      setTranscript(finalText.trim());
      setInterimTranscript(interimText);
      onResultRef.current?.(finalText.trim() || interimText);
    };

    return recognition;
  }, [continuous, interimResults, language]);

  // CRITICAL: Called directly from user click - no async operations before start()
  const startListening = useCallback(() => {
    if (!isSupported) return;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current && !isListeningRef.current) {
      finalTranscriptRef.current = transcript;
      isListeningRef.current = true;
      setError(null);
      console.log('[Voice] Starting recognition from user gesture...');
      recognitionRef.current.start();
    }
  }, [isSupported, transcript, initRecognition]);

  const stopListening = useCallback(() => {
    console.log('[Voice] Stopping...');
    isListeningRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
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
