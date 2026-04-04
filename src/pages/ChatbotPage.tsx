import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'What courses does the CS department offer?',
  'How to apply for admission?',
  'What are the hostel fees?',
  'When is the next exam?',
];

// Extend window for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function ChatbotPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm Campus Companion AI 🎓 — ready to help with campus tools, student services, and smart answers.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isReady, setIsReady] = useState(true);
  
  // Speech States
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const speechRecognition = useRef<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const welcomeMsg = `Hello, ${user.name}! How can I assist you today?`;
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date()
        }
      ]);
      if (autoSpeak) {
        speakText(welcomeMsg);
      }
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';

      speechRecognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      speechRecognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try again.');
      };

      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (!speechRecognition.current) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      speechRecognition.current.stop();
    } else {
      speechRecognition.current.start();
      setIsListening(true);
      toast.info('Listening...');
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    // Optional: filter for a specific voice
    const voices = window.speechSynthesis.getVoices();
    const cleanText = text.replace(/[#*`_]/g, ''); // Clean markdown for better speech
    utterance.text = cleanText;
    
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !isReady) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiMessages = [
        { 
          role: 'system', 
          content: `You are Campus Companion AI, a friendly and powerful assistant. 
                    Provide short, precise answers for campus workflows, academic tools, student services, and general knowledge. 
                    Keep responses concise, useful, and easy to read. Use markdown only when it improves clarity.`
        },
        ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: 'openai'
        })
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      const finalAnswer = data.choices[0].message.content;

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: finalAnswer, timestamp: new Date() }
      ]);

      if (autoSpeak) {
        speakText(finalAnswer);
      }
    } catch (err: any) {
      console.error("Pollinations error", err);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: `*(Generation Error: ${err.message})*`, timestamp: new Date() }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Bot size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Campus AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-success' : 'bg-warning animate-pulse'}`} /> 
              {isReady ? 'Online & Ready (Universal Mode)' : 'Loading context...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-2 ${autoSpeak ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="hidden sm:inline text-xs">{autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
              )}
              <div className="relative group max-w-[75%]">
                <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'gradient-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => speakText(msg.content)}
                    className="absolute -right-8 top-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    title="Read aloud"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-accent-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-xl rounded-bl-sm p-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="flex gap-2 flex-wrap py-3">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} /> {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="pt-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask me anything... (Concise Mode)"}
              disabled={!isReady || isTyping}
              className={`w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-50 transition-all ${isListening ? 'border-primary ring-2 ring-primary/20' : ''}`}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'text-destructive scale-110 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
              title={isListening ? "Stop listening" : "Speak your message"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping || !isReady}
            className="p-2.5 rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-2 text-center px-4">
          Click the mic to speak. Voice responses are available—toggle Auto-speak for a full speech-to-speech experience.
        </p>
      </div>
    </div>
  );
}

const Button = ({ children, variant, size, onClick, className }: any) => {
  const variants = {
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90"
  };
  const sizes = {
    sm: "h-9 px-3 rounded-md",
    default: "h-10 px-4 py-2"
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}>
      {children}
    </button>
  );
};
