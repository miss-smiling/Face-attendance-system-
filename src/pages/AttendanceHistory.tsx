import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Download, 
  Clock, 
  Calendar as CalendarIcon,
  BookOpen,
  User,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { AttendanceRecord, Lecture } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, lecRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/lectures')
      ]);
      setRecords(await recRes.json());
      setLectures(await lecRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLecture = selectedLecture === 'all' || r.lecture_id.toString() === selectedLecture;
    return matchesSearch && matchesLecture;
  });

  const exportCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Subject', 'Date', 'Time', 'Status'];
    const rows = filteredRecords.map(r => [
      r.student_name,
      r.roll_number,
      r.subject,
      format(new Date(r.timestamp), 'yyyy-MM-dd'),
      format(new Date(r.timestamp), 'HH:mm:ss'),
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-[#64748b] text-sm italic">Historical biometric verification records and session archives.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#2d3748] transition-all border border-white/5"
          >
            <Download className="w-4 h-4" />
            EXPORT_LOGS
          </button>
        </div>
      </div>

      <div className="bento-card overflow-hidden flex flex-col min-h-[500px]">
        {/* Filters Header */}
        <div className="p-6 border-b border-[#1e293b] flex flex-col md:flex-row items-center gap-6">
           <div className="relative flex-1 group w-full md:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
             <input
               type="text"
               placeholder="Filter by student or ID..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-[#111116] border border-[#1e293b] rounded-xl py-2.5 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
             />
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest pl-2">Session_Filter:</span>
             <select 
              value={selectedLecture}
              onChange={(e) => setSelectedLecture(e.target.value)}
              className="bg-[#1e293b] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl border border-transparent outline-none focus:border-blue-500/50 min-w-[180px]"
             >
               <option value="all">ALL_SESSIONS</option>
               {lectures.map(l => (
                 <option key={l.id} value={l.id}>{l.subject}</option>
               ))}
             </select>
           </div>
           
           <div className="flex items-center gap-2 bg-[#161b22] px-4 py-2.5 rounded-xl border border-white/5 md:ml-auto">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{filteredRecords.length} Verified Entries</span>
           </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d0d12]">
                <th className="px-8 py-5 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-[#1e293b]">Agent Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-[#1e293b]">Registry UID</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-[#1e293b]">Operational Session</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-[#1e293b]">Verification Sequence</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-[#1e293b]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="group hover:bg-blue-600/5 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center text-xs font-bold">
                        {record.student_name?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-white transition-colors group-hover:text-blue-400">{record.student_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold font-mono text-[#64748b] bg-[#1e293b] px-2 py-0.5 rounded-md">{record.roll_number}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white">{record.subject}</span>
                       <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-tighter">Biometric_Audit</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white">{format(new Date(record.timestamp), 'MMM dd, yyyy')}</span>
                       <span className="text-[10px] text-[#64748b] font-bold uppercase">{format(new Date(record.timestamp), 'HH:mm:ss')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Verified</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                     <FileText className="w-12 h-12 text-[#1e293b] mx-auto mb-4" />
                     <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px]">No verification archives found for this horizon</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
