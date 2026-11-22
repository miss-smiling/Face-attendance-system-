import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Clock, 
  MapPin, 
  User, 
  X,
  Calendar,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { Lecture } from '../types';
import { cn } from '../lib/utils';

export default function LectureManagement() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    faculty: '',
    room_number: '',
    start_time: '09:00',
    end_time: '10:00',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await fetch('/api/lectures');
      const data = await res.json();
      setLectures(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          subject: '',
          faculty: '',
          room_number: '',
          start_time: '09:00',
          end_time: '10:00',
          date: new Date().toISOString().split('T')[0]
        });
        fetchLectures();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Terminate this session schedule?")) {
      await fetch(`/api/lectures/${id}`, { method: 'DELETE' });
      fetchLectures();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Session Schedules</h1>
          <p className="text-[#64748b] text-sm italic">Managing operational timeframes for biometric monitoring.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all font-mono uppercase tracking-widest"
        >
          <Calendar className="w-4 h-4" />
          LOG_NEW_SESSION
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {lectures.map((lecture) => (
            <motion.div
              layout
              key={lecture.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card group hover:border-blue-500/40 transition-all"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1.5 bg-[#1e293b] px-3 py-1 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">{lecture.date}</span>
                     </div>
                     <button 
                      onClick={() => handleDelete(lecture.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-[#64748b] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                      <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{lecture.subject}</h3>
                <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                   <User className="w-3.5 h-3.5 text-blue-500" />
                   {lecture.faculty}
                </p>
                
                <div className="mt-auto grid grid-cols-2 gap-4 py-4 border-t border-[#1e293b]">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">Timeline</p>
                      <div className="flex items-center gap-1.5 text-white">
                         <Clock className="w-3 h-3 text-blue-500" />
                         <span className="text-[11px] font-bold">{lecture.start_time} - {lecture.end_time}</span>
                      </div>
                   </div>
                   <div className="space-y-1 border-l border-[#1e293b] pl-4">
                      <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">Zone</p>
                      <div className="flex items-center gap-1.5 text-white">
                         <MapPin className="w-3 h-3 text-blue-500" />
                         <span className="text-[11px] font-bold">RM-{lecture.room_number || 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {lectures.length === 0 && (
          <div className="col-span-full py-24 bento-card text-center bg-[#111116] border-dashed border-[#1e293b]">
             <Calendar className="w-12 h-12 text-[#1e293b] mx-auto mb-4" />
             <p className="text-[#64748b] font-bold uppercase tracking-[0.2em] text-xs">No Scheduled Operations</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0f] border border-[#1e293b] w-full max-w-lg rounded-[32px] relative z-10 p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-white">Log Session</h2>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mt-1">Timeline Registration Protocol</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-[#64748b] hover:text-white p-2">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleAddLecture} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Operational Subject</label>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                    placeholder="e.g. Quantum Computing"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Presiding Faculty</label>
                  <input
                    required
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                    className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                    placeholder="Dr. Julian Vane"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Start_Sequence</label>
                      <input
                        required
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">End_Sequence</label>
                      <input
                        required
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Assigned Zone (Room)</label>
                  <input
                    required
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                    className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                    placeholder="Lab-304 / Hall-A"
                  />
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    CONFIRM_SESSION_LOG
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
