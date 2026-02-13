'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, User, Bot, 
  MoreHorizontal, Paperclip, Mic 
} from 'lucide-react';

// --- TYPES ---
type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

// --- COMPOSANT BULLE DE MESSAGE ---
const MessageBubble = ({ message }: { message: Message }) => {
  const isAi = message.sender === 'ai';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* AVATAR */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
          ${isAi 
            ? 'bg-gradient-to-br from-red-600 to-rose-600 border-red-500 text-white shadow-lg shadow-red-500/20' 
            : 'bg-zinc-100 border-zinc-200 text-zinc-400'}
        `}>
          {isAi ? <Sparkles size={14} /> : <User size={14} />}
        </div>

        {/* BULLE DE TEXTE */}
        <div className={`
          p-4 rounded-2xl shadow-sm text-sm font-display leading-relaxed
          ${isAi 
            ? 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-none' 
            : 'bg-zinc-900 text-white rounded-tr-none shadow-lg shadow-zinc-900/10'}
        `}>
          {message.text}
          <div className={`text-[10px] mt-2 font-mono opacity-50 ${isAi ? 'text-zinc-400' : 'text-zinc-400'}`}>
            {message.timestamp}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default function CoachPage() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- HISTORIQUE DE CONVERSATION ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Salut Alex ! J'ai analysé ta sortie vélo d'hier. Ton cardio était un peu haut pour une Zone 2 (145 bpm moy). Comment te sentais-tu ?",
      timestamp: '09:41'
    }
  ]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // --- FONCTION D'ENVOI (SIMULATION) ---
  const handleSend = () => {
    if (!inputValue.trim()) return;

    // 1. Ajouter le message utilisateur
    const newUserMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // 2. Simuler la réponse de l'IA après 1.5s
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "C'est noté. Si tu étais stressé ou fatigué, c'est normal que le cardio dérive. Je vais ajuster ta séance de seuil de ce soir pour qu'elle soit moins taxante nerveusement. On part sur 3x8' au lieu de 3x10'. Ça te va ?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 pb-20 md:pb-0">
      
      {/* HEADER FIXE */}
      <header className="flex-none h-20 border-b border-zinc-200 bg-white/80 backdrop-blur-xl z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
             <Bot size={20} />
          </div>
          <div>
             <h1 className="font-display font-bold text-zinc-900">TriCoach AI</h1>
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-zinc-500 font-medium">Online • Context: Build Phase</span>
             </div>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400">
           <MoreHorizontal />
        </button>
      </header>

      {/* ZONE DE CHAT SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* INDICATEUR DE FRAPPE */}
        {isTyping && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }}
             className="flex items-center gap-2 text-zinc-400 text-xs font-mono ml-12 mb-4"
           >
              <Sparkles size={12} className="animate-spin" />
              TriCoach is thinking...
           </motion.div>
        )}
        
        {/* Élément invisible pour le scroll */}
        <div ref={scrollRef} />
      </div>

      {/* ZONE DE SAISIE FIXE */}
      <div className="flex-none p-4 md:p-6 bg-zinc-50/90 backdrop-blur-lg border-t border-zinc-200 mb-16 md:mb-0">
        
        {/* Suggestions Rapides */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
           {['Ajuste ma semaine', 'Analyse ma sortie', 'Conseil Nutrition'].map(tag => (
              <button key={tag} className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm">
                 {tag}
              </button>
           ))}
        </div>

        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
           <button className="p-3 rounded-full bg-zinc-200 text-zinc-500 hover:bg-zinc-300 transition-colors">
              <Paperclip size={20} />
           </button>
           
           <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pose une question à ton coach..."
                className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-5 pr-12 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-sm font-display transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600">
                 <Mic size={20} />
              </button>
           </div>

           <button 
             onClick={handleSend}
             disabled={!inputValue.trim()}
             className={`
               p-4 rounded-2xl flex items-center justify-center transition-all shadow-lg
               ${inputValue.trim() 
                 ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-zinc-900/20' 
                 : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}
             `}
           >
              <Send size={20} />
           </button>
        </div>
      </div>

    </div>
  );
}