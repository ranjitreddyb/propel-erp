'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

export function VoiceBot() {
  const [isListening, setIsListening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Placeholder Odia response
  const odiaResponse = "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପାଇଁ ଧନ୍ୟବାଦ। ମୁଁ ଓଡ଼ିଆ ଭାଷାରେ ତିଆରି ହେଉଛି। ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ।";
  const englishResponse = "Thank you for your question. I am being developed in Odia language. Please wait.";

  useEffect(() => {
    // Create audio element for TTS placeholder
    audioRef.current = new Audio();
  }, []);

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    
    // Check for browser speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Will work with Odia accent
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          respondWithPlaceholder();
        }
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        // Simulate for demo
        setTranscript('Sample question detected...');
        setTimeout(() => respondWithPlaceholder(), 500);
      };
      
      recognition.start();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        recognition.stop();
      }, 5000);
    } else {
      // Fallback for browsers without speech recognition
      setTimeout(() => {
        setIsListening(false);
        setTranscript('Voice input received...');
        respondWithPlaceholder();
      }, 2000);
    }
  };

  const respondWithPlaceholder = () => {
    setIsResponding(true);
    
    // Use Web Speech API for TTS as placeholder
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(englishResponse);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.onend = () => setIsResponding(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsResponding(false), 3000);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    window.speechSynthesis?.cancel();
    setIsResponding(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)',
          boxShadow: '0 8px 32px rgba(217,119,6,0.35)',
        }}
        data-testid="voice-bot-button"
      >
        <Mic size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed z-[9998] rounded-2xl overflow-visible"
      style={{
        bottom: '24px',
        left: '24px',
        width: '320px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}
      data-testid="voice-bot-window"
    >
      {/* Close Button */}
      <button
        onClick={() => { setIsOpen(false); stopListening(); }}
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-[10000]"
        style={{
          background: 'var(--danger)',
          border: '2px solid white',
        }}
        data-testid="voice-bot-close"
      >
        <X size={16} className="text-white" />
      </button>

      {/* Header */}
      <div
        className="px-4 py-4 rounded-t-2xl"
        style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Volume2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Voice Assistant</h3>
            <p className="text-xs text-white/70">ଓଡ଼ିଆ ଭାଷା ସହାୟକ (Odia)</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 text-center">
        {/* Animated Mic */}
        <div className="mb-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isResponding}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${isListening ? 'animate-pulse' : ''}`}
            style={{
              background: isListening 
                ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                : isResponding 
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                  : 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))',
              boxShadow: isListening ? '0 0 30px rgba(239,68,68,0.5)' : '0 8px 24px rgba(0,0,0,0.15)',
            }}
            data-testid="voice-bot-mic"
          >
            {isListening ? (
              <MicOff size={32} className="text-white" />
            ) : isResponding ? (
              <Volume2 size={32} className="text-white animate-pulse" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="mb-4">
          {isListening && (
            <div>
              <p className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Listening...</p>
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.1}s`
                    }} 
                  />
                ))}
              </div>
            </div>
          )}
          {isResponding && (
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Responding...</p>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>🔊 Playing audio response</p>
            </div>
          )}
          {!isListening && !isResponding && (
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Tap the mic to speak</p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>You said:</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{transcript}</p>
          </div>
        )}

        {/* Response */}
        {(isResponding || (!isListening && transcript)) && (
          <div className="p-3 rounded-xl" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--primary)' }}>Response:</p>
            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>{englishResponse}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>{odiaResponse}</p>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-[10px] mt-4" style={{ color: 'var(--text3)' }}>
          🚧 Voice AI in development • ElevenLabs/Sarvam integration coming soon
        </p>
      </div>
    </div>
  );
}
