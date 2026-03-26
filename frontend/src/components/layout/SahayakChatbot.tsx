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

const QUICK_PROMPTS = [
  'Revenue this month',
  'Occupancy rates',
  'Churn risks',
  'Maintenance alerts',
];

export function SahayakChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm **Sahayak**, your PropelERP AI assistant. I can help you with:\n\n• Revenue & financial analysis\n• Occupancy rates across properties\n• Tenant churn risk predictions\n• Maintenance alerts & scheduling\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Bouncing animation interval
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

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
      // Get company from localStorage
      const companyData = localStorage.getItem('propel_company');
      const company = companyData ? JSON.parse(companyData) : { id: 'default' };

      // Build history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // The AI_ENGINE_URL may be either:
      // - Direct: http://localhost:8001 (local dev) → /api/v1/chat
      // - Via Nginx proxy: https://propelerp.wisewit.ai/ai → /chat (Nginx adds /api/v1/)
      const isNginxProxy = AI_ENGINE_URL.includes('/ai');
      const chatEndpoint = isNginxProxy 
        ? `${AI_ENGINE_URL}/chat`  // Nginx proxy handles /api/v1 prefix
        : `${AI_ENGINE_URL}/api/v1/chat`;  // Direct call

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          history,
          company_id: company.id,
        }),
      });

      let assistantContent = '';

      if (response.ok) {
        const data = await response.json();
        assistantContent = data.response || data.text || 'I received your message but couldn\'t generate a response.';
      } else {
        // Fallback to demo responses if AI Engine is unavailable
        assistantContent = getDemoResponse(messageText);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback to demo responses on network error
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getDemoResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
            isAnimating ? 'animate-bounce' : ''
          }`}
          style={{
            background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 50%, #00d4aa 100%)',
            boxShadow: '0 4px 20px rgba(79,142,247,0.5), 0 0 40px rgba(124,92,252,0.3)',
          }}
          data-testid="sahayak-chat-button"
          aria-label="Open Sahayak AI Assistant"
        >
          <MessageCircle size={24} className="text-white" />
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: 'var(--accent5)' }}
          >
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden ${
            isMinimized ? 'bottom-6 right-6 w-72 h-14' : 'bottom-6 right-6 w-96 h-[32rem]'
          }`}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(79,142,247,0.15)',
          }}
          data-testid="sahayak-chat-window"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.25) 0%, rgba(124,92,252,0.2) 100%)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
              >
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Sahayak</h3>
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>PropelERP AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                data-testid="sahayak-minimize-btn"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleChat(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-red-500"
                style={{ background: 'rgba(255,80,80,0.8)', color: '#fff' }}
                data-testid="sahayak-close-btn"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ height: 'calc(100% - 140px)' }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                        message.role === 'user' ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                      }`}
                      style={
                        message.role === 'user'
                          ? {
                              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                              color: '#fff',
                            }
                          : {
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              color: 'var(--text2)',
                            }
                      }
                      dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                    >
                      <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                      <span className="text-sm" style={{ color: 'var(--text3)' }}>Sahayak is thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="text-[10px] px-2.5 py-1 rounded-full border transition-all hover:bg-white/5 disabled:opacity-50"
                    style={{
                      background: 'rgba(79,142,247,0.1)',
                      borderColor: 'rgba(79,142,247,0.25)',
                      color: 'var(--accent)',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Sahayak anything…"
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    data-testid="sahayak-input"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--surface2)',
                    }}
                    data-testid="sahayak-send-btn"
                  >
                    <Send size={16} className="text-white" />
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

// Demo responses when AI Engine is unavailable
function getDemoResponse(msg: string): string {
  const m = msg.toLowerCase();
  
  if (m.includes('revenue') || m.includes('income') || m.includes('money')) {
    return "📊 **This month's financials:**\n\n• Revenue: **₹4.85 Crore**\n• Rental Income: ₹4.2Cr\n• Lease premiums: ₹42L\n• Facility charges: ₹23L\n• ↑ 12.4% vs last month\n\n💡 *Navigate to Finance → Trial Balance for details*";
  }
  
  if (m.includes('occupancy') || m.includes('vacant') || m.includes('occupied')) {
    return "🏢 **Portfolio Occupancy:**\n\n• Tower A (Commercial): **97%** (175/180 units)\n• Tower B (Residential): **91%** (109/120 units)\n• Block C (Retail): **78%** (47/60 shops)\n• Industrial: **100%** (12/12)\n\n**Overall: 94.2%** ✅ Market avg: 87%";
  }
  
  if (m.includes('churn') || m.includes('risk') || m.includes('leaving')) {
    return "⚠️ **High-Risk Tenants:**\n\n• **Unit 4A (TechStar):** 78% risk — payment delays + expiring in 45 days\n• **Unit 7B (Gourmet Co):** 52% risk — market alternatives scouted\n• **Unit 9D (StartupX):** 45% risk — downsizing signals\n\n🎯 *AI retention packages prepared. Recommend outreach this week.*";
  }
  
  if (m.includes('maintenance') || m.includes('repair') || m.includes('fix')) {
    return "🔧 **Maintenance Alerts:**\n\n• 🔴 **CRITICAL:** HVAC Block B — failure predicted in 12 days\n• 🟡 **HIGH:** Water leak Tower A Floor 8 — in progress\n• 🟢 **SCHEDULED:** Fire inspection all blocks — due 26 Mar\n\nTotal open work orders: **18** (3 critical)";
  }
  
  if (m.includes('tenant') || m.includes('lease')) {
    return "📋 **Lease Renewals Due:**\n\n• **TechStar (4A):** Expires Apr 15 — ₹4.8L/month\n• **Gourmet Co (7B):** Expires May 01 — ₹1.2L/month\n• **MegaCorp (12C):** Expires Jun 30 — ₹12.5L/month\n\n💡 *3 leases need attention in next 90 days*";
  }
  
  if (m.includes('hello') || m.includes('hi') || m.includes('hey')) {
    return "Hello! 👋 I'm Sahayak, your PropelERP AI assistant. I can help you with:\n\n• **Revenue** & financial insights\n• **Occupancy** rates across properties\n• **Churn risk** predictions\n• **Maintenance** alerts\n\nWhat would you like to know?";
  }
  
  return "🧠 I can help with **revenue analysis, occupancy rates, tenant churn risks, maintenance alerts, and lease renewals**.\n\nTry asking:\n• \"What's our revenue this month?\"\n• \"Show occupancy rates\"\n• \"Any churn risks?\"\n• \"Maintenance alerts today\"";
}
