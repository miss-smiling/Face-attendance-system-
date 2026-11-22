import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user.username);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection refused. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bento-card p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-blue-600 rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.25)] mb-6">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter text-center">OMNISCAN_AI</h1>
          <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-[0.3em]">Neural Identity Systems</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Access Identity (Username)</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0d0d12] border border-[#1e293b] rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                placeholder="Agent identity"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Secret Sequence (Password)</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d0d12] border border-[#1e293b] rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded-md bg-[#0d0d12] border-[#1e293b] text-blue-600 focus:ring-blue-500 transition-all" />
              <span className="text-[10px] font-bold text-[#64748b] group-hover:text-[#94a3b8] uppercase tracking-widest transition-colors">Remember_Session</span>
            </label>
            <a href="#" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Reset_Protocol</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-[#1e293b] disabled:text-[#64748b] disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 text-xs uppercase tracking-widest group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                INITIALIZE_CORE
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2 grayscale brightness-50 contrast-125">
           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
           <p className="text-[9px] text-[#64748b] font-black uppercase tracking-widest italic">
             Encrypted_Biometric_Access_Protected
           </p>
        </div>
      </motion.div>
    </div>
  );
}
