import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Sparkles, Copy, 
  Check, Trash2, Loader2, ArrowDown
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '@/src/lib/utils';
import { UserProfile, AuditResult } from '../types';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  user: UserProfile;
  latestAudit?: AuditResult | null;
}

const SYSTEM_PROMPT = `You are FairAudit's AI assistant specializing 
in AI fairness and bias detection. You help 
non-technical users understand bias concepts 
and how to fix them. Keep responses concise, 
friendly and jargon-free. Use simple language.
If user asks about their audit results, 
acknowledge you can see they ran an audit 
but ask them to share specific metrics.
Always end with an encouraging message.`;

export function Chatbot({ user, latestAudit }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      
      // Send first message if empty
      if (messages.length === 0) {
        const firstMessage: Message = {
          id: 'first-msg',
          role: 'bot',
          content: "Hi! I'm your FairAudit AI Assistant powered by Gemini. I can help you:\n- Understand bias concepts\n- Explain your audit results\n- Suggest fairness improvements\n- Answer any questions about AI fairness\nWhat would you like to know?",
          timestamp: new Date()
        };
        setMessages([firstMessage]);
        setHasUnread(true);
      }
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      let prompt = content;
      
      // Special logic for "explain my results"
      if (content.toLowerCase().includes('explain my results') && latestAudit) {
        prompt = `The user is asking to explain their results. Here are the metrics from their latest audit of dataset "${latestAudit.datasetName}":
        - Fairness Score: ${latestAudit.fairnessScore}/100
        - Severity: ${latestAudit.severity}
        - Grade: ${latestAudit.grade}
        - Demographic Parity Difference: ${latestAudit.metrics.demographicParityDiff}
        - Disparate Impact Ratio: ${latestAudit.metrics.disparateImpactRatio}
        - Protected Attribute: ${latestAudit.protectedColumn}
        - Outcome Column: ${latestAudit.outcomeColumn}
        
        Please explain these specific results to the user.`;
      }

      // Prepare chat history for Gemini
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });

      const text = response.text || "I'm sorry, I couldn't generate a response.";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm sorry, I encountered an error connecting to my neural core. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
  };

  const quickReplies = [
    "What is AI bias?",
    "Explain my results",
    "How to fix bias?",
    "What is disparate impact?"
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[500px] mb-6 glass border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                    <Sparkles className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-neon rounded-full border-2 border-primary-bg" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white">FairAudit AI Assistant</h3>
                  <p className="text-[10px] text-accent-cyan uppercase tracking-widest">Powered by Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat}
                  className="p-2 text-text-secondary hover:text-danger-red transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] group",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'bot' && (
                      <div className="w-6 h-6 rounded-lg bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                        <img src="/logo.png" className="w-4 h-4 object-contain" alt="FA" />
                      </div>
                    )}
                    <span className="text-[10px] text-text-secondary">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-accent-cyan text-primary-bg font-medium rounded-tr-none" 
                        : "bg-white/5 text-white border border-white/10 rounded-tl-none"
                    )}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-primary-bg border border-white/10 text-text-secondary hover:text-white",
                        msg.role === 'user' ? "-left-10" : "-right-10"
                      )}
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-success-neon" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
              
              {messages.length === 1 && messages[0].id === 'first-msg' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-accent-cyan hover:bg-accent-cyan/10 hover:border-accent-cyan/30 transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                      <img src="/logo.png" className="w-4 h-4 object-contain" alt="FA" />
                    </div>
                    <span className="text-[10px] text-text-secondary">Gemini is thinking...</span>
                  </div>
                  <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about AI fairness..."
                  disabled={isTyping}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan/50 transition-all disabled:opacity-50"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2 text-accent-cyan hover:text-white disabled:opacity-30 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[9px] text-text-secondary uppercase tracking-widest">Max 500 characters</span>
                <span className="text-[9px] text-text-secondary">{input.length}/500</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-primary-bg shadow-2xl relative transition-all duration-500",
          isOpen ? "bg-white rotate-90" : "bg-accent-cyan glow-cyan"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="relative"
            >
              <MessageSquare className="w-8 h-8" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-white animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-red rounded-full border-2 border-primary-bg flex items-center justify-center text-[10px] font-bold text-white">
            1
          </span>
        )}

        {!isOpen && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-accent-cyan -z-10"
          />
        )}
      </motion.button>
    </div>
  );
}
