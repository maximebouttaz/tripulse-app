'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Waves, 
  Bike, 
  Activity, 
  Zap, 
  ArrowRight, 
  Cpu, 
  TrendingUp, 
  Heart, 
  Timer,
  Play
} from 'lucide-react';

// --- ANIMATIONS (Inchangées) ---
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const hoverLift = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.2 } }
};

const tapEffect = {
  tap: { scale: 0.95 }
};

// --- COMPOSANTS UI LIGHT MODE ---

// Le conteneur "Glass" version Light
const GlassCard = ({ children, className = "", hoverEffect = false, glowColor = "border-zinc-200" }) => (
  <motion.div
    variants={hoverEffect ? hoverLift : {}}
    initial="rest"
    whileHover="hover"
    className={`
      backdrop-blur-xl bg-white/70 border border-white/60 shadow-lg shadow-zinc-200/50
      ${hoverEffect ? `hover:border-${glowColor} transition-colors duration-300` : ''}
      ${className}
    `}
  >
    {children}
  </motion.div>
);

// Bouton Principal (CTA) - Noir sur blanc pour contraste max
const PrimaryButton = ({ children, onClick }) => (
  <motion.button
    variants={tapEffect}
    whileTap="tap"
    onClick={onClick}
    className="px-6 py-3 bg-zinc-900 text-white font-['Inter_Tight'] font-bold rounded-xl shadow-lg shadow-zinc-900/10 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
  >
    {children}
  </motion.button>
);

// Bouton Secondaire - Gris subtil
const SecondaryButton = ({ children }) => (
  <motion.button
    variants={tapEffect}
    whileTap="tap"
    className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 font-['Inter_Tight'] font-semibold rounded-xl hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
  >
    {children}
  </motion.button>
);

// Badge Sport (Ajusté pour fond clair)
const SportBadge = ({ type }) => {
  const styles = {
    swim: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: Waves, label: 'SWIM' },
    bike: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: Bike, label: 'BIKE' },
    run:  { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Activity, label: 'RUN' },
  };
  const s = styles[type];
  const Icon = s.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${s.bg} border ${s.border}`}>
      <Icon size={14} className={s.color} />
      <span className={`text-xs font-['JetBrains_Mono'] font-bold tracking-widest ${s.color}`}>
        {s.label}
      </span>
    </div>
  );
};

export default function TriCoachSystem() {
  const [activeTab, setActiveTab] = useState('palette');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-red-500/20 selection:text-red-700 font-sans pb-20">
      {/* Injection des polices */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .font-display { font-family: 'Inter Tight', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        /* Light mode scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f4f4f5; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
      `}</style>

      {/* Header Light */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LOGO ROUGE */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-white">
              <span className="font-display font-bold text-xl">Tc</span>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight text-zinc-900">
              TriCoach <span className="text-zinc-400 font-normal">Light V.L.</span>
            </h1>
          </div>
          <nav className="hidden md:flex gap-1 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200">
            {['palette', 'typography', 'components', 'showcase'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all
                  ${activeTab === tab 
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-100' 
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* SECTION 1: PALETTE */}
          {activeTab === 'palette' && (
            <motion.div 
              key="palette"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <section>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Light Mode Native</h2>
                <p className="text-zinc-500 max-w-2xl mb-8">Fondations "Clean" en Zinc-50. Aspect "Papier Premium".</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Backgrounds */}
                  <div className="space-y-4">
                    <div className="h-32 rounded-3xl bg-zinc-50 border border-zinc-200 flex items-end p-4">
                      <span className="font-mono text-xs text-zinc-400">bg-zinc-50</span>
                    </div>
                    <p className="font-display font-semibold">Fond de Page</p>
                  </div>
                  <div className="space-y-4">
                    <div className="h-32 rounded-3xl bg-white border border-zinc-200 shadow-sm flex items-end p-4 relative overflow-hidden">
                       <div className="absolute inset-0 bg-grid-zinc-900/[0.03]" />
                       <span className="font-mono text-xs text-zinc-400">bg-white</span>
                    </div>
                    <p className="font-display font-semibold">Cartes (Surface)</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Sports Colors</h2>
                <p className="text-zinc-500 max-w-2xl mb-8">Ajustés pour la lisibilité sur fond blanc (Teintes 600).</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { name: 'Natation', bg: 'bg-cyan-500', text: 'text-cyan-600', tailwind: 'cyan-600', desc: 'Bleu Profond' },
                    { name: 'Vélo', bg: 'bg-red-500', text: 'text-red-600', tailwind: 'red-600', desc: 'Rouge Racing' },
                    { name: 'Course', bg: 'bg-amber-400', text: 'text-amber-600', tailwind: 'amber-600', desc: 'Ocre Visible' },
                  ].map((sport) => (
                    <GlassCard key={sport.name} className="p-6 rounded-3xl flex flex-col gap-4">
                      <div className={`w-full h-24 rounded-xl ${sport.bg} shadow-lg ${sport.text.replace('text', 'shadow')}/30 opacity-90`}></div>
                      <div>
                        <h3 className={`text-xl font-display font-bold ${sport.text}`}>{sport.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <code className="text-xs font-mono text-zinc-400">{sport.tailwind}</code>
                          <span className="text-sm text-zinc-500">{sport.desc}</span>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Brand Red</h2>
                <p className="text-zinc-500 max-w-2xl mb-8">Le rouge TriCoach. Énergie pure.</p>
                
                <GlassCard className="p-8 rounded-3xl relative overflow-hidden group border-red-100">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 shadow-2xl shadow-red-500/30 flex items-center justify-center text-white">
                      <span className="font-display font-bold text-4xl">Tc</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-zinc-900">
                        Signature Gradient
                      </h3>
                      <code className="block mt-2 text-sm font-mono text-zinc-500">from-red-600 to-rose-600</code>
                      <p className="mt-4 text-zinc-600 max-w-md">
                        Utilisé pour le logo, les graphiques importants et les éléments d'appel à l'action critiques.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </section>
            </motion.div>
          )}

          {/* SECTION 2: TYPOGRAPHIE */}
          {activeTab === 'typography' && (
            <motion.div 
              key="typography"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-200">
                  <h2 className="text-zinc-400 font-mono text-sm mb-2">VOICE (TITRES)</h2>
                  <h3 className="text-2xl font-display font-bold text-zinc-900">Inter Tight</h3>
                  <p className="text-zinc-500 text-sm mt-1">Noir profond, tracking serré.</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-mono text-zinc-400 mb-1">Display / Bold</p>
                    <div className="text-5xl font-display font-bold tracking-tight text-zinc-900">
                      Ready for Race Day.
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-zinc-400 mb-1">Heading 2 / Semibold</p>
                    <div className="text-3xl font-display font-semibold tracking-tight text-zinc-800">
                      Weekly Summary
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-zinc-400 mb-1">Body / Medium</p>
                    <div className="text-lg font-display font-medium text-zinc-600">
                      Your fatigue levels are optimal for high intensity intervals.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-200">
                  <h2 className="text-zinc-400 font-mono text-sm mb-2">PRECISION (DONNÉES)</h2>
                  <h3 className="text-2xl font-mono font-bold text-zinc-900">JetBrains Mono</h3>
                  <p className="text-zinc-500 text-sm mt-1">Contraste élevé pour lisibilité immédiate.</p>
                </div>
                
                <div className="space-y-6">
                  <GlassCard className="p-6 rounded-xl border-l-4 border-emerald-500 bg-white">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-display text-zinc-400 uppercase tracking-wider mb-1">Avg Power</p>
                        <div className="text-4xl font-mono font-bold text-zinc-900 tracking-tight">
                          245<span className="text-lg text-zinc-400 ml-1 font-medium">W</span>
                        </div>
                      </div>
                      <TrendingUp className="text-emerald-500 mb-2" />
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <p className="text-xs font-display text-zinc-400">Pace</p>
                        <p className="text-2xl font-mono text-zinc-900">4:30<span className="text-sm text-zinc-400">/km</span></p>
                     </div>
                     <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <p className="text-xs font-display text-zinc-400">HR Zone</p>
                        <p className="text-2xl font-mono text-red-600">168<span className="text-sm text-red-600/70">bpm</span></p>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 3: COMPOSANTS & UI */}
          {activeTab === 'components' && (
            <motion.div 
              key="components"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <section>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-8">Boutons & Interactions</h2>
                <div className="flex flex-wrap gap-8 items-center p-8 rounded-3xl bg-zinc-100 border border-zinc-200 border-dashed">
                  
                  <div className="text-center space-y-4">
                    <PrimaryButton onClick={() => {}}>
                      <Play size={18} fill="currentColor" />
                      Start Workout
                    </PrimaryButton>
                    <p className="text-xs font-mono text-zinc-400">Primary (Zinc-900)</p>
                  </div>

                  <div className="text-center space-y-4">
                    <SecondaryButton>View Details</SecondaryButton>
                    <p className="text-xs font-mono text-zinc-400">Secondary (White/Zinc-200)</p>
                  </div>

                  <div className="text-center space-y-4">
                     <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-display font-bold shadow-lg shadow-red-500/30 flex items-center gap-2"
                      >
                        <Zap size={18} />
                        AI Action
                      </motion.button>
                      <p className="text-xs font-mono text-zinc-400">Accent Action (Brand)</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-display font-bold tracking-tight mb-8">Glassmorphism Light</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <GlassCard 
                    className="h-64 rounded-3xl p-8 relative overflow-hidden group"
                    hoverEffect={true}
                    glowColor="border-red-500"
                  >
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <Bike size={120} className="text-zinc-900 -rotate-12 translate-x-10 -translate-y-10" />
                     </div>
                     <div className="relative z-10">
                        <SportBadge type="bike" />
                        <h3 className="mt-4 text-3xl font-display font-bold text-zinc-900">Sunday Long Ride</h3>
                        <p className="text-zinc-500 mt-2 font-display">Endurance focus zone 2.</p>
                        
                        <div className="mt-8 flex gap-6">
                           <div>
                              <div className="text-xs text-zinc-400 font-mono uppercase">Duration</div>
                              <div className="text-xl font-mono text-zinc-900">3:45:00</div>
                           </div>
                           <div>
                              <div className="text-xs text-zinc-400 font-mono uppercase">TSS</div>
                              <div className="text-xl font-mono text-zinc-900">210</div>
                           </div>
                        </div>
                     </div>
                  </GlassCard>

                  <div className="space-y-4">
                     <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
                           <TrendingUp />
                        </div>
                        <div>
                           <h4 className="font-bold text-zinc-900">Ombres Douces</h4>
                           <p className="text-sm text-zinc-500">shadow-lg shadow-zinc-200/50</p>
                        </div>
                     </div>
                     <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                         <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
                           <div className="w-6 h-6 bg-white/50 backdrop-blur border border-white/50 rounded-lg"></div>
                        </div>
                        <div>
                           <h4 className="font-bold text-zinc-900">Transparence</h4>
                           <p className="text-sm text-zinc-500">bg-white/70 backdrop-blur-xl</p>
                        </div>
                     </div>
                  </div>

                </div>
              </section>
            </motion.div>
          )}

          {/* SECTION 4: SHOWCASE */}
          {activeTab === 'showcase' && (
             <motion.div 
               key="showcase"
               variants={fadeInUp}
               initial="initial"
               animate="animate"
               exit={{ opacity: 0, y: -20 }}
               className="w-full max-w-5xl mx-auto"
             >
                <div className="text-center mb-10">
                   <h2 className="text-3xl font-display font-bold text-zinc-900">TriCoach Light Dashboard</h2>
                   <p className="text-zinc-500">Le style TVL appliqué en mode Jour.</p>
                </div>

                <div className="rounded-[2.5rem] border border-zinc-200 bg-zinc-50 p-6 md:p-10 shadow-2xl shadow-zinc-200 relative overflow-hidden">
                   {/* Background Orbs */}
                   <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                   <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                   <div className="flex justify-between items-center mb-10 relative z-10">
                      <div>
                         <h3 className="text-zinc-500 font-display text-sm font-medium">WEDNESDAY, FEB 12</h3>
                         <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 tracking-tight">Good Morning, Alex.</h2>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                         <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      </div>
                   </div>

                   {/* AI Insight Pill */}
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.2 }}
                     className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-red-200/50 to-rose-200/50"
                   >
                      <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 flex items-start gap-4">
                         <div className="p-2 bg-red-50 rounded-lg shrink-0">
                            <Zap className="text-red-500" size={20} />
                         </div>
                         <div>
                            <h4 className="font-display font-bold text-zinc-900 text-sm">Recovery Optimized</h4>
                            <p className="font-display text-zinc-600 text-sm mt-1">Based on your sleep data, we've adjusted today's interval intensity down by 5%.</p>
                         </div>
                      </div>
                   </motion.div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      
                      <GlassCard className="col-span-1 md:col-span-2 p-8 rounded-3xl flex flex-col justify-between group" hoverEffect={true} glowColor="border-amber-400">
                         <div className="flex justify-between items-start">
                            <SportBadge type="run" />
                            <div className="text-right">
                               <div className="text-3xl font-mono font-bold text-zinc-900">45:00</div>
                               <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Duration</div>
                            </div>
                         </div>
                         
                         <div className="mt-8">
                            <h3 className="text-2xl font-display font-bold text-zinc-900 mb-2">Threshold Intervals</h3>
                            <div className="flex items-center gap-4 text-sm text-zinc-500 font-mono">
                               <span className="flex items-center gap-1"><Heart size={14} className="text-red-600" /> 165 BPM</span>
                               <span className="flex items-center gap-1"><Timer size={14} className="text-amber-600" /> 4:15 /KM</span>
                            </div>
                         </div>

                         <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-4">
                            <PrimaryButton onClick={() => {}}>Start Run</PrimaryButton>
                            <SecondaryButton>Edit</SecondaryButton>
                         </div>
                      </GlassCard>

                      <div className="space-y-6">
                         <GlassCard className="p-6 rounded-3xl flex flex-col justify-center items-center text-center" hoverEffect={true} glowColor="border-emerald-500">
                             <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 flex items-center justify-center mb-4">
                                <span className="text-emerald-600 font-bold font-mono">92</span>
                             </div>
                             <h4 className="font-display font-bold text-zinc-900">Form Score</h4>
                             <p className="text-xs text-zinc-500 mt-1">Excellent technique</p>
                         </GlassCard>

                         <GlassCard className="p-6 rounded-3xl" hoverEffect={true} glowColor="border-cyan-500">
                             <div className="flex items-center gap-3 mb-4">
                                <Waves size={18} className="text-cyan-600" />
                                <h4 className="font-display font-bold text-zinc-900 text-sm">Tomorrow</h4>
                             </div>
                             <p className="text-zinc-600 font-display text-sm">2,500m Open Water</p>
                             <div className="mt-3 w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-zinc-200 h-full w-0"></div>
                             </div>
                         </GlassCard>
                      </div>

                   </div>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}