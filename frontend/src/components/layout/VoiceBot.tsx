'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

// Hardcoded Q&A for demo in multiple languages
const QA_DATABASE = [
  {
    language: 'hi', // Hindi
    keywords: ['लीज़', 'lease', 'एग्रीमेंट', 'समाप्त', 'expiry'],
    question: 'क्या मेरा लीज़ एग्रीमेंट कब समाप्त हो रहा है?',
    answer: 'नमस्ते, मैं अवनी हूं। मैं आपकी सहायता के लिए यहां हूं। आपका लीज़ एग्रीमेंट 31 मार्च 2026 को समाप्त हो रहा है। यदि आप नवीनीकरण करना चाहते हैं, तो कृपया प्रॉपर्टी मैनेजमेंट टीम से संपर्क करें।',
    greeting: 'नमस्ते, मैं अवनी हूं।',
  },
  {
    language: 'or', // Odia
    keywords: ['ଫ୍ଲାଟ୍', 'ବିକ୍ରି', 'ପ୍ରୋଜେକ୍ଟ', 'ଉପଲବ୍ଧ', 'sales', 'flat'],
    question: 'ଏହି ପ୍ରୋଜେକ୍ଟରେ କେତେଟି ଫ୍ଲାଟ୍ ବିକ୍ରି ପାଇଁ ଉପଲବ୍ଧ ଅଛି?',
    answer: 'ନମସ୍କାର, ମୁଁ ଅବନୀ। ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବାକୁ ଏଠାରେ ଅଛି। ଏହି ପ୍ରୋଜେକ୍ଟରେ ବର୍ତ୍ତମାନ 12ଟି ଫ୍ଲାଟ୍ ବିକ୍ରି ପାଇଁ ଉପଲବ୍ଧ ଅଛି। ଆପଣ ଅଧିକ ତଥ୍ୟ ପାଇଁ ସେଲ୍ସ ଟିମ୍ ସହିତ ଯୋଗାଯୋଗ କରିପାରିବେ।',
    greeting: 'ନମସ୍କାର, ମୁଁ ଅବନୀ।',
  },
  {
    language: 'bn', // Bengali
    keywords: ['অ্যাসেট', 'রেজিস্টার', 'প্রপার্টি', 'asset', 'register'],
    question: 'এই প্রপার্টিতে মোট কতগুলো অ্যাসেট রেজিস্টার করা আছে?',
    answer: 'নমস্কার, আমি অবনী। আমি আপনাকে সাহায্য করতে এখানে আছি। এই প্রপার্টিতে বর্তমানে ২৫০টির বেশি অ্যাসেট রেজিস্টার করা আছে, যার মধ্যে লিফট, জেনারেটর এবং সিসিটিভি অন্তর্ভুক্ত।',
    greeting: 'নমস্কার, আমি অবনী।',
  },
  {
    language: 'en', // English
    keywords: ['maintenance', 'request', 'status', 'repair', 'technician'],
    question: 'What is the status of my maintenance request?',
    answer: 'Hi, I am Avani. I am here to assist you. Your maintenance request has been assigned to a technician and is expected to be resolved within the next 24 hours.',
    greeting: 'Hi, I am Avani.',
  },
  {
    language: 'mr', // Marathi
    keywords: ['स्वच्छता', 'सुरक्षा', 'सोसायटी', 'व्यवस्थापित', 'facility', 'security'],
    question: 'सोसायटीमध्ये स्वच्छता आणि सुरक्षा सुविधा कशा व्यवस्थापित केल्या जातात?',
    answer: 'नमस्कार, मी अवनी आहे। मी तुम्हाला मदत करण्यासाठी येथे आहे। सोसायटीमध्ये स्वच्छता आणि सुरक्षा सुविधा नियमितपणे व्यवस्थापित केल्या जातात. सुरक्षा रक्षक आणि हाउसकीपिंग कर्मचारी २४ तास उपलब्ध असतात।',
    greeting: 'नमस्कार, मी अवनी आहे।',
  },
];

// Default responses when no match found
const DEFAULT_RESPONSES = {
  hi: 'नमस्ते, मैं अवनी हूं। मैं आपकी सहायता के लिए यहां हूं। कृपया अपना प्रश्न स्पष्ट रूप से पूछें।',
  or: 'ନମସ୍କାର, ମୁଁ ଅବନୀ। ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବାକୁ ଏଠାରେ ଅଛି। ଦୟାକରି ଆପଣଙ୍କ ପ୍ରଶ୍ନ ସ୍ପଷ୍ଟ ଭାବରେ ପଚାରନ୍ତୁ।',
  bn: 'নমস্কার, আমি অবনী। আমি আপনাকে সাহায্য করতে এখানে আছি। অনুগ্রহ করে আপনার প্রশ্ন স্পষ্টভাবে জিজ্ঞাসা করুন।',
  en: 'Hi, I am Avani. I am here to assist you. Please ask your question clearly.',
  mr: 'नमस्कार, मी अवनी आहे। मी तुम्हाला मदत करण्यासाठी येथे आहे। कृपया तुमचा प्रश्न स्पष्टपणे विचारा।',
};

export function VoiceBot() {
  const [isListening, setIsListening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en');

  const findMatchingQA = (input: string): { answer: string; language: string } | null => {
    const lowerInput = input.toLowerCase();
    
    for (const qa of QA_DATABASE) {
      const matchCount = qa.keywords.filter(keyword => 
        lowerInput.includes(keyword.toLowerCase()) || input.includes(keyword)
      ).length;
      
      if (matchCount > 0) {
        return { answer: qa.answer, language: qa.language };
      }
    }
    
    // Detect language from script
    if (/[\u0900-\u097F]/.test(input)) { // Devanagari (Hindi/Marathi)
      if (input.includes('मी') || input.includes('तुम्ह')) {
        return { answer: DEFAULT_RESPONSES.mr, language: 'mr' };
      }
      return { answer: DEFAULT_RESPONSES.hi, language: 'hi' };
    }
    if (/[\u0B00-\u0B7F]/.test(input)) { // Odia
      return { answer: DEFAULT_RESPONSES.or, language: 'or' };
    }
    if (/[\u0980-\u09FF]/.test(input)) { // Bengali
      return { answer: DEFAULT_RESPONSES.bn, language: 'bn' };
    }
    
    return { answer: DEFAULT_RESPONSES.en, language: 'en' };
  };

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setCurrentResponse('');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Supports multiple Indic languages
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
          respondToQuestion(transcript);
        }
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        // For demo: simulate a random question being asked
        const randomQA = QA_DATABASE[Math.floor(Math.random() * QA_DATABASE.length)];
        setTranscript(randomQA.question);
        setTimeout(() => respondToQuestion(randomQA.question), 500);
      };
      
      recognition.start();
      
      // Auto-stop after 8 seconds
      setTimeout(() => {
        try {
          recognition.stop();
        } catch {}
      }, 8000);
    } else {
      // Fallback for browsers without speech recognition - demo mode
      setTimeout(() => {
        setIsListening(false);
        const randomQA = QA_DATABASE[Math.floor(Math.random() * QA_DATABASE.length)];
        setTranscript(randomQA.question);
        respondToQuestion(randomQA.question);
      }, 2000);
    }
  };

  const respondToQuestion = (question: string) => {
    setIsResponding(true);
    
    const match = findMatchingQA(question);
    const response = match?.answer || DEFAULT_RESPONSES.en;
    const lang = match?.language || 'en';
    
    setDetectedLanguage(lang);
    setCurrentResponse(response);
    
    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      
      // Set language based on detected language
      const langMap: Record<string, string> = {
        hi: 'hi-IN',
        or: 'or-IN', // May fallback to Hindi
        bn: 'bn-IN',
        en: 'en-IN',
        mr: 'mr-IN',
      };
      
      utterance.lang = langMap[lang] || 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setIsResponding(false);
      utterance.onerror = () => setIsResponding(false);
      
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
        width: '340px',
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
            <h3 className="font-semibold text-white text-lg">Avani</h3>
            <p className="text-xs text-white/70">AI Voice Assistant • अवनी • ଅବନୀ</p>
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
              <p className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Listening... सुन रहा हूं...</p>
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
              <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Avani is responding...</p>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>🔊 Playing audio</p>
            </div>
          )}
          {!isListening && !isResponding && (
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Tap to speak • बोलने के लिए टैप करें
            </p>
          )}
        </div>

        {/* Transcript - Question Asked */}
        {transcript && (
          <div className="p-3 rounded-xl mb-3 text-left" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text3)' }}>You asked:</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{transcript}</p>
          </div>
        )}

        {/* Response */}
        {currentResponse && (
          <div className="p-3 rounded-xl text-left" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--primary)' }}>Avani:</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{currentResponse}</p>
          </div>
        )}

        {/* Demo Questions Hint */}
        {!transcript && !currentResponse && (
          <div className="mt-4 p-3 rounded-xl text-left" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Try asking:</p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--text3)' }}>
              <li>• क्या मेरा लीज़ एग्रीमेंट कब समाप्त हो रहा है? (Hindi)</li>
              <li>• ଏହି ପ୍ରୋଜେକ୍ଟରେ କେତେଟି ଫ୍ଲାଟ୍ ବିକ୍ରି ପାଇଁ ଉପଲବ୍ଧ? (Odia)</li>
              <li>• What is the status of my maintenance request?</li>
            </ul>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-[10px] mt-4" style={{ color: 'var(--text3)' }}>
          Powered by Avani AI • ElevenLabs/Sarvam integration coming soon
        </p>
      </div>
    </div>
  );
}
