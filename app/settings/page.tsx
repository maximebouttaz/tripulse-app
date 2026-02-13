'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Save, Activity, Link as LinkIcon,
  Bell, Shield, LogOut, Smartphone, Check
} from 'lucide-react';

// --- COMPOSANT SECTION ---
const Section = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
      <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
        <Icon size={18} />
      </div>
      <h3 className="font-display font-bold text-zinc-900">{title}</h3>
    </div>
    {children}
  </div>
);

// --- COMPOSANT INPUT ---
const InputGroup = ({ label, value, unit, type = "text" }: any) => (
  <div className="flex-1 min-w-[150px]">
    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <input 
        type={type} 
        defaultValue={value}
        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
      />
      {unit && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  </div>
);

// --- COMPOSANT TOGGLE (INTEGRATION) ---
const IntegrationRow = ({ name, icon, isConnected, onConnect }: any) => (
  <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-display font-bold text-sm text-zinc-900">{name}</h4>
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          {isConnected ? <span className="text-emerald-500">● Connecté</span> : 'Non connecté'}
        </p>
      </div>
    </div>
    <button
      onClick={onConnect}
      className={`
        px-4 py-2 rounded-lg text-xs font-bold transition-all border
        ${isConnected
          ? 'bg-white border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
          : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'}
      `}
    >
      {isConnected ? 'Déconnecter' : 'Connecter'}
    </button>
  </div>
);

function SettingsContent() {
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [athletePhoto, setAthletePhoto] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<{ first: string; last: string }>({ first: '', last: '' });

  // Charger les données du profil (photo + nom Strava)
  useEffect(() => {
    fetch('/api/athlete/metrics?athlete_id=126239815')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          if (data.athlete_photo) setAthletePhoto(data.athlete_photo);
          if (data.athlete_firstname || data.athlete_lastname) {
            setAthleteName({ first: data.athlete_firstname || '', last: data.athlete_lastname || '' });
            setStravaConnected(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Vérifier si l'utilisateur vient de connecter Strava (retour du callback)
  useEffect(() => {
    const stravaStatus = searchParams.get('strava');
    if (stravaStatus === 'success') {
      setStravaConnected(true);
      setStravaMessage('Strava connecté avec succès !');
      setTimeout(() => setStravaMessage(null), 4000);
    } else if (stravaStatus === 'error') {
      setStravaMessage('Erreur lors de la connexion Strava.');
      setTimeout(() => setStravaMessage(null), 4000);
    }
  }, [searchParams]);

  const handleConnectStrava = () => {
    // Redirige vers notre route OAuth qui redirige vers Strava
    window.location.href = '/api/auth/strava';
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Réglages</h1>
            <p className="text-zinc-500 text-sm">Gère ton profil, tes zones et tes connexions.</p>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`
              px-6 py-3 rounded-xl font-display font-bold text-white flex items-center gap-2 shadow-lg transition-all
              ${isSaving ? 'bg-emerald-500' : 'bg-zinc-900 hover:bg-zinc-800'}
            `}
          >
            {isSaving ? <Check size={18} /> : <Save size={18} />}
            {isSaving ? 'Sauvegardé !' : 'Enregistrer'}
          </motion.button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLONNE GAUCHE */}
          <div className="space-y-6">
            
            {/* 1. PROFIL */}
            <Section title="Profil Athlète" icon={User}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden border-2 border-white shadow-md">
                   {athletePhoto ? (
                     <img src={athletePhoto} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-tr from-zinc-300 to-zinc-400" />
                   )}
                </div>
                <div>
                   {athletePhoto && <p className="text-xs text-zinc-500 mb-1">Photo Strava</p>}
                   <button className="text-xs font-bold text-brand-red hover:underline">Changer la photo</button>
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <InputGroup label="Prénom" value={athleteName.first || 'Alex'} />
                <InputGroup label="Nom" value={athleteName.last || 'D.'} />
              </div>
              <div className="flex gap-4">
                <InputGroup label="Poids" value="72" unit="kg" type="number" />
                <InputGroup label="Taille" value="182" unit="cm" type="number" />
              </div>
            </Section>

            {/* 2. ZONES DE PERFORMANCE */}
            <Section title="Zones & Seuils" icon={Activity}>
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vélo</p>
                <div className="flex gap-4">
                  <InputGroup label="FTP" value="285" unit="w" type="number" />
                  <InputGroup label="LTHR" value="172" unit="bpm" type="number" />
                </div>
                <div className="h-px bg-zinc-100 my-2" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Course à pied</p>
                <div className="flex gap-4">
                  <InputGroup label="VMA" value="18.5" unit="km/h" type="number" />
                  <InputGroup label="LTHR" value="168" unit="bpm" type="number" />
                </div>
                <div className="flex gap-4">
                  <InputGroup label="Allure Seuil" value="4:24" unit="/km" />
                </div>
                <div className="h-px bg-zinc-100 my-2" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Natation</p>
                <div className="flex gap-4">
                  <InputGroup label="CSS" value="1:46" unit="/100m" />
                  <InputGroup label="FC Max" value="185" unit="bpm" type="number" />
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs flex items-start gap-2">
                   <Shield size={14} className="mt-0.5 shrink-0" />
                   <p>TriCoach recalculera automatiquement tes zones d'entraînement si tu modifies ces valeurs.</p>
                </div>
              </div>
            </Section>

          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-6">
            
            {/* 3. CONNEXIONS */}
            <Section title="Applications Connectées" icon={LinkIcon}>
               {stravaMessage && (
                 <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                   stravaMessage.includes('succès')
                     ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                     : 'bg-red-50 text-red-700 border border-red-100'
                 }`}>
                   {stravaMessage}
                 </div>
               )}
               <div className="space-y-2 divide-y divide-zinc-100">
                  <IntegrationRow
                    name="Strava"
                    isConnected={stravaConnected}
                    icon={<span className="font-bold text-xs">ST</span>}
                    onConnect={handleConnectStrava}
                  />
                  <IntegrationRow
                    name="Garmin Connect"
                    isConnected={false}
                    icon={<span className="font-bold text-xs">GC</span>}
                  />
                  <IntegrationRow
                    name="TrainingPeaks"
                    isConnected={false}
                    icon={<span className="font-bold text-xs">TP</span>}
                  />
               </div>
            </Section>

            {/* 4. PRÉFÉRENCES */}
            <Section title="Préférences" icon={Bell}>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-zinc-700">Notifications Push</span>
                     <div className="w-10 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-4 transition-transform" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-zinc-700">Mode Sombre (Bientôt)</span>
                     <div className="w-10 h-6 bg-zinc-200 rounded-full p-1 cursor-not-allowed">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm transition-transform" />
                     </div>
                  </div>
               </div>
            </Section>

            {/* 5. ZONE DANGER */}
            <button className="w-full p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
               <LogOut size={16} /> Déconnexion
            </button>
            
            <p className="text-center text-xs text-zinc-400 mt-4">
               TriCoach App v1.0.4 • Build 2026.02.12
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}