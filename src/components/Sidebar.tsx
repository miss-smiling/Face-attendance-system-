import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  BookOpen, 
  History, 
  LogOut,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Camera, label: 'Live Scanner', path: '/scan' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: BookOpen, label: 'Lectures', path: '/lectures' },
    { icon: History, label: 'History', path: '/history' },
  ];

  return (
    <motion.aside 
      initial={{ x: -80 }}
      animate={{ x: 0 }}
      className="w-20 h-full bg-[#0a0a0f] border-r border-[#1e293b] flex flex-col items-center py-6 gap-8 z-20"
    >
      <div className="p-2.5 bg-blue-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
        <ShieldCheck className="w-6 h-6 text-white" />
      </div>

      <nav className="flex-1 flex flex-col gap-4 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) => cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                : "bg-[#1e293b] text-[#94a3b8] hover:text-white hover:bg-[#2d3748]"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <div className="absolute left-16 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-4 items-center">
        <button
          className="w-12 h-12 flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={onLogout}
          className="w-12 h-12 flex items-center justify-center text-[#94a3b8] hover:text-red-400 transition-colors mb-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </motion.aside>
  );
}
