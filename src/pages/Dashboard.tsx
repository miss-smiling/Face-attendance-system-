import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { DashboardStats, Lecture } from '../types';
import { cn } from '../lib/utils';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        const lecRes = await fetch('/api/lectures');
        const lecData = await lecRes.json();
        setLectures(lecData.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = {
    labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'],
    datasets: [
      {
        label: 'Attendance Rate',
        data: [65, 78, 82, 45, 90, 85, 95],
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 10 } }, min: 0, max: 100 },
    },
  };

  const statCards = [
    { label: 'Present Students', value: `${stats?.todayAttendance || 0} / ${stats?.totalStudents || 0}`, icon: Users, color: 'text-blue-500' },
    { label: 'Absent Today', value: (stats?.totalStudents || 0) - (stats?.todayAttendance || 0), icon: BookOpen, color: 'text-amber-500' },
    { label: 'Unknown Logs', value: stats?.unknownToday || 0, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Overall Rate', value: '94%', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="h-full flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
  </div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-12 grid-rows-6 gap-5 h-full min-h-[700px]"
    >
      {/* Chart Card */}
      <div className="col-span-8 row-span-4 bento-card flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="stat-label">Real-time Metrics</span>
            <h3 className="text-xl font-bold text-white mt-1">Attendance Trends</h3>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-blue-600/20">LIVE</button>
            <button className="px-3 py-1 bg-[#1e293b] text-[#94a3b8] text-[10px] font-bold rounded-lg truncate">HISTORY</button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Line data={chartData} options={chartOptions as any} />
        </div>
      </div>

      {/* Stats Summary Grid Component */}
      <div className="col-span-4 row-span-2 grid grid-cols-2 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="bento-card flex flex-col justify-center">
            <span className="stat-val">{stat.value}</span>
            <span className="stat-label mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity / Logs */}
      <div className="col-span-4 row-span-4 bento-card flex flex-col">
        <span className="stat-label mb-4">Latest Identifications</span>
        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {lectures.map((lec, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#161b22] border border-[#30363d] rounded-xl group hover:border-blue-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                {lec.subject.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white truncate">{lec.subject}</div>
                <div className="text-[11px] text-[#64748b]">Scheduled: {lec.start_time}</div>
              </div>
              <div className="text-emerald-500 text-[10px] font-bold">READY</div>
            </div>
          ))}
          {lectures.length === 0 && (
            <div className="text-center py-12 text-[#64748b] text-xs">No active sessions</div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="col-span-4 row-span-2 bento-card">
        <span className="stat-label">Active Session Info</span>
        {lectures[0] ? (
          <div className="mt-4">
            <div className="text-lg font-bold text-white">{lectures[0].subject}</div>
            <div className="text-sm text-[#94a3b8] mt-1">{lectures[0].faculty}</div>
            <div className="flex items-center gap-2 mt-4 text-[#64748b] text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{lectures[0].start_time} - {lectures[0].end_time}</span>
              <div className="w-1 h-1 bg-[#1e293b] rounded-full mx-1" />
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Room {lectures[0].room_number}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-[#64748b] text-xs">No current lecture metadata</div>
        )}
      </div>

      {/* System Health / Footer Bar */}
      <div className="col-span-8 row-span-2 bento-card flex items-center justify-between px-10">
        <div className="flex gap-12 items-center">
          <div>
            <span className="stat-label">V-Engine Load</span>
            <div className="text-sm font-bold text-white mt-1">12.4%</div>
          </div>
          <div>
            <span className="stat-label">Latency</span>
            <div className="text-sm font-bold text-white mt-1">38ms</div>
          </div>
          <div>
            <span className="stat-label">Core Status</span>
            <div className="text-sm font-bold text-emerald-500 mt-1 flex items-center gap-2">
               Online <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div>
             <span className="stat-label">Uptime</span>
             <div className="text-sm font-bold text-white mt-1">99.99% Official</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1e293b] border border-[#30363d] text-[#e2e8f0] px-6 py-2 rounded-xl text-xs font-bold hover:bg-[#2d3748] transition-colors">Generate Daily Report</button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">Start Bulk Scan</button>
        </div>
      </div>
    </motion.div>
  );
}
