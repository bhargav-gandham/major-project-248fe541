import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  initialValue?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event & { error: string }) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef(initialValue);
  
  // Use refs for callbacks to avoid recreating recognition on every render
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated with latest callbacks
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Sync with external value changes
  useEffect(() => {
    if (!isListening) {
      setTranscript(initialValue);
      finalTranscriptRef.current = initialValue;
    }
  }, [initialValue, isListening]);

  // Initialize speech recognition once
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.log('[Voice] Recognition error:', event.error);
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your device.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
      };
      
      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      setError(message);
      onErrorRef.current?.(message);
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[Voice] Got result:', event.results);
      let interimText = '';
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        console.log('[Voice] Transcript:', transcriptText, 'isFinal:', result.isFinal);
        
        if (result.isFinal) {
          finalText += transcriptText + ' ';
          finalTranscriptRef.current = finalText;
        } else {
          interimText += transcriptText;
        }
      }

      console.log('[Voice] Setting transcript:', finalText.trim());
      console.log('[Voice] Setting interim:', interimText);
      
      setTranscript(finalText.trim());
      setInterimTranscript(interimText);
      
      // Call callback with current transcript (use ref to get latest callback)
      onResultRef.current?.(finalText.trim() || interimText);
    };

    recognitionRef.current = recognition;

    return () => {
      console.log('[Voice] Cleaning up recognition');
      recognition.abort();
    };
  }, [continuous, interimResults, language]); // Removed onResult and onError from deps

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || !isSupported) {
      console.log('[Voice] Cannot start - not supported or no recognition');
      return;
    }

    try {
      console.log('[Voice] Requesting microphone permission...');
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] Microphone permission granted');
      
      finalTranscriptRef.current = transcript; // Preserve existing transcript
      setError(null);
      console.log('[Voice] Starting recognition...');
      recognitionRef.current.start();
    } catch (err) {
      console.log('[Voice] Microphone permission denied:', err);
      const message = 'Microphone access denied. Please allow microphone access in your browser settings.';
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [isSupported, transcript]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    console.log('[Voice] Stopping recognition...');
    recognitionRef.current.stop();
  }, []);

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
