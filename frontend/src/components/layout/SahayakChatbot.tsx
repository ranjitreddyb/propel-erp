'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2, Sparkles } from 'lucide-react';

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const QUICK_PROMPTS = ['Revenue this month', 'Occupancy rates', 'Churn risks', 'GST compliance'];

export function SahayakChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm **Sahayak**, your AI assistant. I can help with:\n\n• Revenue & financial insights\n• Occupancy rates\n• Tenant churn risks\n• GST & compliance\n• Maintenance alerts\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const companyData = localStorage.getItem('propel_company');
      const company = companyData ? JSON.parse(companyData) : { id: 'default' };
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

      const isNginxProxy = AI_ENGINE_URL.includes('/ai');
      const chatEndpoint = isNginxProxy ? `${AI_ENGINE_URL}/chat` : `${AI_ENGINE_URL}/api/v1/chat`;

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history, company_id: company.id }),
      });

      let assistantContent = '';
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.response || data.text || getDemoResponse(messageText);
      } else {
        assistantContent = getDemoResponse(messageText);
      }

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getDemoResponse(messageText),
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #203A2B 0%, #36684B 100%)',
            boxShadow: '0 8px 32px rgba(32,58,43,0.4)',
          }}
          data-testid="sahayak-chat-button"
        >
          <MessageCircle size={28} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-[9999] rounded-2xl overflow-visible"
          style={{
            bottom: '24px',
            right: '24px',
            width: isMinimized ? '320px' : '400px',
            height: isMinimized ? '70px' : '540px',
            background: '#FFFFFF',
            border: '1px solid #E8E2D9',
            boxShadow: '0 20px 60px rgba(32,58,43,0.2), 0 8px 24px rgba(0,0,0,0.15)',
          }}
          data-testid="sahayak-chat-window"
        >
          {/* CLOSE BUTTON - OUTSIDE THE HEADER */}
          <button
            onClick={closeChat}
            className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-[10000]"
            style={{
              background: '#DC2626',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
            }}
            data-testid="sahayak-close-btn"
          >
            <X size={22} className="text-white" strokeWidth={3} />
          </button>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4"
            style={{
              height: '70px',
              background: 'linear-gradient(135deg, #203A2B 0%, #2A4C38 100%)',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Sahayak</h3>
                <p className="text-xs text-green-200">AI Assistant</p>
              </div>
            </div>
            
            {/* Minimize Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              data-testid="sahayak-minimize-btn"
            >
              {isMinimized ? <Maximize2 size={20} className="text-white" /> : <Minimize2 size={20} className="text-white" />}
            </button>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                className="overflow-y-auto p-4 space-y-4"
                style={{ height: 'calc(100% - 190px)', background: '#FDFBF7' }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user' ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                      }`}
                      style={
                        message.role === 'user'
                          ? { background: '#203A2B', color: '#fff' }
                          : { background: '#FFFFFF', border: '1px solid #E8E2D9', color: '#1A1C1A' }
                      }
                      dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                      style={{ background: '#FFFFFF', border: '1px solid #E8E2D9' }}
                    >
                      <Loader2 size={16} className="animate-spin" style={{ color: '#203A2B' }} />
                      <span className="text-sm" style={{ color: '#7A756C' }}>Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2 flex flex-wrap gap-2" style={{ background: '#FFFFFF', borderTop: '1px solid #E8E2D9' }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:bg-[#F3EFEA] disabled:opacity-50"
                    style={{ background: '#FDFBF7', borderColor: '#E8E2D9', color: '#203A2B' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E8E2D9', borderRadius: '0 0 16px 16px' }}>
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Sahayak anything…"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: '#FDFBF7',
                      border: '1px solid #E8E2D9',
                      color: '#1A1C1A',
                    }}
                    data-testid="sahayak-input"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    style={{
                      background: input.trim() ? '#203A2B' : '#E8E2D9',
                    }}
                    data-testid="sahayak-send-btn"
                  >
                    <Send size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function getDemoResponse(msg: string): string {
  const m = msg.toLowerCase();
  
  if (m.includes('revenue') || m.includes('income')) {
    return "📊 **This month's revenue:**\n\n• Total: **₹2.85 Crore**\n• Rental Income: ₹2.4Cr\n• Maintenance: ₹32L\n• Parking: ₹13L\n\n↑ 8.2% vs last month";
  }
  
  if (m.includes('occupancy') || m.includes('vacant')) {
    return "🏢 **Portfolio Occupancy:**\n\n• Supratik Exotica: **94%**\n• Supratik Elegance: **98%**\n• Supratik Vista: **87%**\n• Lifestyle: **72%**\n\n**Overall: 89%** ✓";
  }
  
  if (m.includes('churn') || m.includes('risk')) {
    return "⚠️ **Churn Risk Alert:**\n\n• Unit 4A (Exotica): 65% risk\n• Plot B12 (Lifestyle): 48% risk\n\nRecommend proactive outreach.";
  }
  
  if (m.includes('gst') || m.includes('compliance') || m.includes('tax')) {
    return "📋 **GST & Compliance:**\n\n• GSTR-1: ✅ Filed\n• GSTR-3B: ✅ Filed\n• TDS Q3: ⏳ Due Dec 31\n• Property Tax: ✅ Paid";
  }
  
  if (m.includes('maintenance')) {
    return "🔧 **Maintenance:**\n\n• Open tickets: **12**\n• Critical: 2\n• Avg resolution: 2.3 days";
  }
  
  return "I can help with **revenue, occupancy, churn risks, GST compliance**, and **maintenance**.\n\nTry asking specific questions!";
}
