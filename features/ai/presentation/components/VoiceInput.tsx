"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceInputResult {
  transcript: string;
  isFinal: boolean;
}

interface UseVoiceInputOptions {
  onTranscript?: (result: VoiceInputResult) => void;
  onEnd?: (transcript: string) => void;
  onError?: (error: Error) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

interface VoiceInputReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: Error | null;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): VoiceInputReturn {
  const { onTranscript, onEnd, onError, continuous = false, interimResults = true } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = "en-US";
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (onTranscript) {
          onTranscript({
            transcript: currentTranscript,
            isFinal: !!finalTranscript,
          });
        }
        
        if (finalTranscript && onEnd) {
          onEnd(finalTranscript);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const error = new Error(event.error);
        setError(error);
        setIsListening(false);
        onError?.(error);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      recognitionRef.current?.stop();
    };
  }, [continuous, interimResults, onTranscript, onEnd, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError(new Error("Speech recognition not supported"));
      return;
    }
    
    setTranscript("");
    setError(null);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error,
  };
}

interface VoiceInputButtonProps {
  onTranscript?: (transcript: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscript, className = "" }: VoiceInputButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const { isListening, transcript, isSupported, startListening, stopListening, error } = 
    useVoiceInput({
      onEnd: (finalTranscript) => {
        onTranscript?.(finalTranscript);
      },
      onError: (err) => {
        console.error("Voice input error:", err);
      },
    });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-2 rounded-full transition-colors ${
          isListening 
            ? "bg-red-500 text-white animate-pulse" 
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        } ${className}`}
        aria-label={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap">
          {isListening ? "Click to stop" : "Click to speak"}
        </div>
      )}
      
      {isListening && transcript && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-secondary rounded text-sm max-w-xs">
          {transcript}
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
