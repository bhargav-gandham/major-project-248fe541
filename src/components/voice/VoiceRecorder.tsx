import { useEffect } from 'react';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, RotateCcw, AlertCircle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  initialTranscript?: string;
  placeholder?: string;
  className?: string;
}

export const VoiceRecorder = ({
  onTranscriptChange,
  initialTranscript = '',
  placeholder = 'Click the microphone to start dictating...',
  className,
}: VoiceRecorderProps) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    toggleListening,
    resetTranscript,
  } = useVoiceToText({
    initialValue: initialTranscript,
    onResult: (text) => {
      console.log('[VoiceRecorder] onResult called with:', text);
      onTranscriptChange(text);
    },
  });

  // Update parent with combined final + interim text for real-time feedback
  useEffect(() => {
    const combinedText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    if (combinedText !== initialTranscript) {
      onTranscriptChange(combinedText.trim());
    }
  }, [transcript, interimTranscript]);

  const displayText = transcript;
  const fullText = displayText + (interimTranscript ? ` ${interimTranscript}` : '');

  const handleReset = () => {
    resetTranscript();
    onTranscriptChange('');
  };

  if (!isSupported) {
    return (
      <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Voice Input Not Supported</p>
              <p className="text-sm text-muted-foreground">
                Please use Chrome, Edge, or Safari for voice dictation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Controls Header */}
        <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isListening ? "destructive" : "default"}
              size="sm"
              onClick={toggleListening}
              className={cn(
                "gap-2 transition-all",
                isListening && "animate-pulse"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Dictation
                </>
              )}
            </Button>
            
            {displayText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1 text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
                Recording
              </Badge>
            )}
          </div>
        </div>

        {/* Editable Transcript */}
        <div className="p-4">
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            placeholder={isListening ? "Listening... Speak now" : placeholder}
            value={fullText}
            onChange={(e) => onTranscriptChange(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              toast.error('Pasting is not allowed. Please use voice dictation or type manually.');
            }}
            onDrop={(e) => {
              e.preventDefault();
              toast.error('Drag and drop is not allowed. Please use voice dictation or type manually.');
            }}
            onDragOver={(e) => e.preventDefault()}
            disabled={isListening}
          />
          {isListening && interimTranscript && (
            <p className="text-sm text-muted-foreground italic mt-2">
              Hearing: {interimTranscript}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="px-4 pb-3 text-xs text-muted-foreground space-y-1">
          <p>💡 Tip: Speak clearly and pause briefly between sentences for best results.</p>
          <p>⚠️ Voice dictation may not work in embedded previews. If it's not capturing speech, open the app in a <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="underline font-medium text-primary">new browser tab</a>.</p>
        </div>
      </CardContent>
    </Card>
  );
};
