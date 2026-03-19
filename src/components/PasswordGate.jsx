import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_69b62672be45da00af3df17b/0d96f8146_LogodeinversionesCTEC.png";
const PASSWORD = "3030";
const STORAGE_KEY = "ctec_auth";

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return children;

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="CTEC" className="w-20 h-20 mx-auto rounded-xl object-contain mb-4" />
          <h1 className="text-2xl font-bold text-[#d4a533] tracking-wide">INVERSIONES CTEC</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión de Préstamos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-2xl border border-[#1e293b] p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
            <Lock className="w-4 h-4" />
            Acceso Restringido
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Contraseña</label>
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              placeholder="••••"
              className={`w-full px-4 py-3 rounded-lg text-lg tracking-widest text-center bg-[#0a0e17] border text-gray-200 outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-500 focus:ring-red-500/30 animate-pulse'
                  : 'border-[#1e293b] focus:ring-[#d4a533]/30 focus:border-[#d4a533]/50'
              }`}
            />
            {error && <p className="text-red-400 text-xs text-center mt-2">Contraseña incorrecta</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#d4a533] hover:bg-[#b8922d] text-black font-bold rounded-lg transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}