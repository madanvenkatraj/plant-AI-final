import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Volume2, VolumeX, Globe, ChevronDown, Leaf, Bot, Sparkles, Loader2 } from 'lucide-react';
// import { GoogleGenerativeAI } from '@google/generative-ai';
import { DISEASE_DB } from '../data/diseaseDatabase';

const LANGUAGES = [
  { code: 'en', name: 'English', voice: 'en-US' },
  { code: 'ta', name: 'தமிழ்', voice: 'ta-IN' },
  { code: 'hi', name: 'हिन्दी', voice: 'hi-IN' },
  { code: 'te', name: 'తెలుగు', voice: 'te-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', voice: 'kn-IN' },
];

// Fallback local rule-based function
function getFallbackAnswer(input) {
  const q = input.toLowerCase().trim();
  if (q.includes('hi') || q.includes('hello')) return "Hello! 👋 I'm your Plant AI Assistant. How can I help you today?";
  
  // Search local DB
  for (const info of Object.values(DISEASE_DB)) {
    if (q.includes(info.plant.toLowerCase()) || q.includes(info.disease.toLowerCase())) {
      return `🌿 **${info.plant} — ${info.disease}**\n\n⚠️ **Causes:** ${info.causes}\n\n🔍 **Symptoms:** ${info.symptoms}\n\n💊 **Treatment:** ${info.treatment}\n\n🛡️ **Prevention:** ${info.prevention}`;
    }
  }
  return "I'm a local fallback bot right now. Please set up the Gemini API Key to unlock my full AI capabilities!";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: "👋 Hi! I'm Plant AI Assistant. Ask me anything about agriculture, plant diseases, symptoms, treatments, or farming tips!" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [modelUsed, setModelUsed] = useState("Gemini 2.0 Flash");
  const [ttsLoading, setTtsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const generateAIResponse = async (userMessage) => {
    try {
      const selectedLangName = LANGUAGES.find(l => l.code === lang)?.name || 'English';
      
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          language: selectedLangName
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.model_used) setModelUsed(data.model_used.replace('models/', ''));
      return data.response;

    } catch (error) {
      console.error("AI Generation Error Details:", error);
      return getFallbackAnswer(userMessage);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const question = input;
    setInput('');
    setTyping(true);

    const answer = await generateAIResponse(question);
    
    setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: answer }]);
    setTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSpeak = async (text) => {
    if (speaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setSpeaking(false);
      return;
    }
    
    try {
      setTtsLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "TTS failed");
      }

      const data = await response.json();
      if (!data.audioContent) return;

      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setSpeaking(true);
        setTtsLoading(false);
      };

      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setSpeaking(false);
        setTtsLoading(false);
        alert("Error playing audio. Please try again.");
      };

      audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      setSpeaking(false);
      setTtsLoading(false);
      alert(`Speech Error: ${error.message}`);
    }
  };

  // Remove the old voice loading effect
  useEffect(() => {
    // No longer needed for gTTS backend
  }, []);

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={i} className="h-2" />;

      if (trimmedLine.startsWith('##')) {
        return <h3 key={i} className="font-bold text-gray-900 mt-3 mb-1 text-md border-b border-gray-100 pb-1">{trimmedLine.replace(/##/g, '').trim()}</h3>;
      }
      
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        return (
          <div key={i} className="flex items-start gap-2 mt-1.5 ml-1">
            <span className="text-plantGreen-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-plantGreen-500" />
            <span className="flex-1">{renderBoldText(content)}</span>
          </div>
        );
      }

      return <p key={i} className="mt-1 leading-relaxed">{renderBoldText(trimmedLine)}</p>;
    });
  };

  const renderBoldText = (text) => {
    if (!text.includes('**')) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-gray-900 font-bold">{p}</strong> : p);
  };

  return (
    <>
      {/* Toggle Button - MOVED TO RIGHT SIDE */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-plantGreen-600 hover:bg-plantGreen-700 text-white rounded-full p-4 shadow-xl shadow-plantGreen-200 transition-colors"
            title="Plant AI Chat"
          >
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window - MOVED TO RIGHT SIDE */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] h-[600px] max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-plantGreen-500 to-plantGreen-700 px-4 py-3 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full relative">
                  <Bot className="h-5 w-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-plantGreen-600 rounded-full"></span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm flex items-center gap-1">
                    AgriBot AI <Sparkles className="h-3 w-3 text-yellow-300" />
                  </p>
                  <p className="text-plantGreen-100 text-[10px] uppercase tracking-wider font-bold">
                    {modelUsed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language */}
                <div className="relative">
                  <button onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded-lg transition-colors">
                    <Globe className="h-3 w-3 mr-1" />
                    {LANGUAGES.find(l => l.code === lang)?.name.slice(0, 3)}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 z-10 min-w-[130px] overflow-hidden">
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={`block w-full text-left px-3 py-2 text-xs hover:bg-plantGreen-50 transition-colors ${lang === l.code ? 'bg-plantGreen-50 text-plantGreen-700 font-medium' : 'text-gray-700'}`}>
                          {l.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 rounded-md hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'bot' && (
                    <div className="h-8 w-8 rounded-full bg-plantGreen-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-plantGreen-600" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-plantGreen-600 text-white rounded-br-sm shadow-md'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                  }`}>
                    {msg.from === 'bot' ? (
                      <div className="text-sm prose prose-sm max-w-none">{formatText(msg.text)}</div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    {msg.from === 'bot' && (
                      <button 
                        onClick={() => handleSpeak(msg.text)}
                        disabled={ttsLoading}
                        className={`mt-3 flex items-center text-xs font-medium transition-colors bg-gray-50 px-2 py-1 rounded w-max ${
                          speaking ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-plantGreen-600'
                        } ${ttsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {ttsLoading ? (
                          <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Generating...</>
                        ) : (
                          <>
                            {speaking ? <VolumeX className="h-3 w-3 mr-1.5" /> : <Volume2 className="h-3 w-3 mr-1.5" />}
                            {speaking ? 'Stop Output' : 'Listen Output'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-plantGreen-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-plantGreen-600" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1.5 items-center h-4">
                      <div className="w-2 h-2 bg-plantGreen-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-plantGreen-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-plantGreen-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-plantGreen-400 focus-within:ring-1 focus-within:ring-plantGreen-400 transition-all">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about farming, plants, diseases..."
                  className="flex-1 text-sm bg-transparent border-none focus:ring-0 resize-none px-3 py-2 max-h-32 min-h-[44px] outline-none"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-plantGreen-600 hover:bg-plantGreen-700 disabled:opacity-40 disabled:hover:bg-plantGreen-600 text-white rounded-xl p-3 transition-colors mb-0.5 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">Powered by Google Gemini AI</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
