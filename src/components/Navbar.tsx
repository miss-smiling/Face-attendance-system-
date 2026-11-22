import { User, Bell, Search, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const username = localStorage.getItem('username') || 'Admin';

  return (
    <header className="h-[70px] border-b border-[#1e293b] bg-[#0a0a0f] px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-bold text-white tracking-tight">OmniScan Advanced FaceID</h2>
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full flex items-center gap-2 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">System Live</span>
          </div>
          <div className="bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-500/20">
            <Activity className="w-3 h-3" />
            <span className="text-[11px] font-bold uppercase tracking-wider">V-Engine v2.4</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 bg-[#161b22] border border-[#30363d] px-4 py-1.5 rounded-xl group focus-within:border-blue-500/50 transition-all duration-300 w-64">
          <Search className="w-4 h-4 text-[#64748b] group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder="Quick lookup..." 
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-[#64748b]"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-[#94a3b8] hover:text-white cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-[#1e293b]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">{username}</p>
              <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-widest mt-0.5">Admin Account</p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20"
            >
              <User className="w-5 h-5 text-white" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
