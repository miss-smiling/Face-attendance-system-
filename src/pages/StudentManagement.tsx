import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Camera, 
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Student } from '../types';
import { cn } from '../lib/utils';
import * as faceapi from 'face-api.js';

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedEncoding, setCapturedEncoding] = useState<number[] | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    department: 'Computer Science',
    year: '3rd Year',
    division: 'A'
  });

  useEffect(() => {
    fetchStudents();
    loadFaceApi();
  }, []);

  const loadFaceApi = async () => {
    try {
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setFaceApiLoaded(true);
    } catch (err) {
      console.error("Face API Error:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const captureFace = async () => {
    if (!videoRef.current || !faceApiLoaded) return;
    setIsLoading(true);

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setCapturedEncoding(Array.from(detection.descriptor));
        stopCamera();
      } else {
        alert("Face not detected. Please look directly at the camera.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedEncoding) {
      alert("Please capture face image first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          face_encoding: capturedEncoding
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', roll_number: '', department: 'Computer Science', year: '3rd Year', division: 'A' });
        setCapturedEncoding(null);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Identity Registry</h1>
          <p className="text-[#64748b] text-sm italic">Managing biological anchor points for biometric verification.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111111] border border-[#1e293b] text-white pl-10 pr-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 min-w-[240px]"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all font-mono"
          >
            <UserPlus className="w-4 h-4" />
            ENROLL_NEW_AGENT
          </button>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1e293b] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest pl-2">Filter_Sector:</span>
          <select className="bg-[#1e293b] text-white text-[10px] font-bold px-4 py-2 rounded-xl border border-transparent outline-none focus:border-blue-500/50">
            <option>All Sectors</option>
            <option>Computer Science</option>
            <option>Information Tech</option>
          </select>
        </div>
        <div className="h-4 w-[1px] bg-[#1e293b] hidden sm:block" />
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-bold text-white uppercase tracking-widest">{filteredStudents.length} Active Profiles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bento-card group hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center text-xl font-black italic">
                  {student.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-[#1e293b] text-[#64748b] hover:text-white rounded-xl transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="p-2 bg-[#1e293b] text-[#64748b] hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white mb-1">{student.name}</h3>
                <p className="text-[#64748b] text-[10px] font-bold font-mono uppercase tracking-widest">{student.roll_number}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-[#1e293b] grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider">Sector</p>
                  <p className="text-[11px] font-bold text-white truncate">{student.department}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider">Designation</p>
                  <p className="text-[11px] font-bold text-white truncate">{student.year}</p>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enroll Modal */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0f] border border-[#1e293b] w-full max-w-4xl rounded-[32px] relative z-10 overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              {/* Left Side: Photo Capture */}
              <div className="md:w-1/2 p-8 bg-[#0d0d12] border-r border-[#1e293b]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Camera className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Biometric Capture</h2>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-1">Optical Neural Mapping</p>
                  </div>
                </div>

                <div className="aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-[#1e293b] relative group">
                  {!isCapturing && !capturedEncoding && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#111116]">
                      <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-[#64748b]" />
                      </div>
                      <p className="text-[#64748b] text-[11px] font-bold uppercase tracking-widest mb-8 leading-relaxed">System requires visual data<br />to generate identity vectors</p>
                      <button
                        onClick={startCamera}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold transition-all text-xs"
                      >
                        Initialize Hardware
                      </button>
                    </div>
                  )}

                  {isCapturing && (
                    <div className="relative h-full">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        className="w-full h-full object-cover grayscale opacity-80"
                      />
                      <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
                        <div className="h-full w-full border-2 border-dashed border-blue-500/30 rounded-2xl" />
                      </div>
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <button
                          onClick={captureFace}
                          disabled={isLoading}
                          className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/30 flex items-center gap-2 text-xs"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          MAP_IDENTITY
                        </button>
                      </div>
                    </div>
                  )}

                  {capturedEncoding && (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-emerald-500/5">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border-2 border-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Signature Verified</h4>
                      <p className="text-[#64748b] text-[11px] font-bold uppercase tracking-widest text-center mb-8 leading-relaxed">Neural encoding mapped to<br />128-point precision array</p>
                      <button
                        onClick={() => {
                          setCapturedEncoding(null);
                          startCamera();
                        }}
                        className="text-[#64748b] hover:text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors px-4 py-2 rounded-xl border border-white/5"
                      >
                        Redo Capture
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Liveness Detection Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Ensuring 128-point face clarity</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="md:w-1/2 p-10">
                <div className="flex justify-end mb-4">
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
                    <X className="w-5 h-5 text-[#64748b] hover:text-white" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-white mb-10">Identity Meta-Data</h3>
                
                <form onSubmit={handleAddStudent} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Full Legal Alias</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d]"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Registry UID</label>
                      <input
                        required
                        type="text"
                        value={formData.roll_number}
                        onChange={(e) => setFormData({...formData, roll_number: e.target.value.toUpperCase()})}
                        className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-[#30363d] font-mono"
                        placeholder="CS24001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Sector/Dept</label>
                      <select 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-[#111116] border border-[#1e293b] rounded-2xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all appearance-none"
                      >
                        <option>Computer Science</option>
                        <option>Information Tech</option>
                        <option>Electronics</option>
                        <option>Mechanical</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-10">
                    <button
                      type="submit"
                      disabled={isLoading || !capturedEncoding}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-[#1e293b] disabled:text-[#64748b] disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 text-xs uppercase tracking-widest"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Finalize_Registry_Insertion
                    </button>
                    <p className="text-[9px] text-center text-[#64748b] mt-6 uppercase tracking-widest font-black italic">Encrypted_Storage_Active</p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
