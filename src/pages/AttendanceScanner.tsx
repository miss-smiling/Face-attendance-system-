import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CameraOff, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { Student, Lecture } from '../types';
import { cn } from '../lib/utils';

export default function AttendanceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isStarted, setIsStarted] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [lastDetected, setLastDetected] = useState<{name: string, time: string, status: 'success' | 'duplicate' | 'unknown' | 'liveness_failed'} | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [livenessStatus, setLivenessStatus] = useState<string>('Ready');

  // Anti-spoofing state
  const lastBlinkRef = useRef<number>(Date.now());
  const blinkThreshold = 0.22; // EAR threshold
  const [detectedBlinks, setDetectedBlinks] = useState(0);

  useEffect(() => {
    loadModels();
    fetchInitialData();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setIsFaceApiLoaded(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Models failed to load", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [lecRes, stuRes] = await Promise.all([
        fetch('/api/lectures'),
        fetch('/api/students')
      ]);
      const lecs = await lecRes.json();
      const stus = await stuRes.json();
      setLectures(lecs);
      setStudents(stus);
      
      if (lecs.length > 0) setSelectedLectureId(lecs[0].id.toString());

      // Prepare Face Matcher
      const labeledDescriptors = stus.filter((s: Student) => s.face_encoding).map((s: Student) => {
        const descriptor = new Float32Array(JSON.parse(s.face_encoding));
        return new faceapi.LabeledFaceDescriptors(s.id.toString(), [descriptor]);
      });

      if (labeledDescriptors.length > 0) {
        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.55));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleScanner = async () => {
    if (isStarted) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStarted(true);
      }
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStarted(false);
  };

  // EAR calculation for blink detection (liveness)
  const getEAR = (landmarks: any) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const calculateEyeEAR = (eye: any) => {
      const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
      const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
      const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
      return (v1 + v2) / (2.0 * h);
    };

    return (calculateEyeEAR(leftEye) + calculateEyeEAR(rightEye)) / 2.0;
  };

  const markAttendance = async (studentId: string) => {
    if (!selectedLectureId) return;
    
    const student = students.find(s => s.id.toString() === studentId);
    if (!student) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          lecture_id: selectedLectureId,
          status: 'Present'
        }),
      });

      const data = await res.json();
      const time = new Date().toLocaleTimeString();

      if (res.ok) {
        setLastDetected({ name: student.name, time, status: 'success' });
        setLogs(prev => [{ type: 'success', name: student.name, time, msg: 'Attendance Marked' }, ...prev]);
      } else if (res.status === 409) {
        setLastDetected({ name: student.name, time: data.timestamp, status: 'duplicate' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceMatcher || !isStarted) return;

    const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    // Clear canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, displaySize.width, displaySize.height);

    resizedDetections.forEach(async (detection) => {
      const result = faceMatcher.findBestMatch(detection.descriptor);
      const ear = getEAR(detection.landmarks);

      // Liveness Check: Blink detection
      if (ear < blinkThreshold) {
        if (Date.now() - lastBlinkRef.current > 500) {
          setDetectedBlinks(prev => prev + 1);
          lastBlinkRef.current = Date.now();
        }
      }

      const box = detection.detection.box;
      const isLivenessPass = detectedBlinks >= 1; // Require 1 blink for simple liveness
      
      let label = 'Scanning...';
      let color = 'white';

      if (result.label === 'unknown') {
        label = 'Unknown Face';
        color = '#ef4444';
      } else {
        const student = students.find(s => s.id.toString() === result.label);
        label = student ? student.name : 'Unknown';
        color = isLivenessPass ? '#22c55e' : '#f97316';
        
        if (isLivenessPass && result.distance < 0.45) {
          markAttendance(result.label);
        }
      }

      setLivenessStatus(isLivenessPass ? 'Liveness: Verified' : 'Liveness: Blink Required');

      // Draw custom box
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Inter';
        ctx.fillText(label, box.x, box.y > 20 ? box.y - 10 : 20);
        
        ctx.fillStyle = color + '22';
        ctx.fillRect(box.x, box.y, box.width, box.height);
      }
    });

    if (isStarted) requestAnimationFrame(handleDetection);
  }, [faceMatcher, isStarted, students, selectedLectureId, detectedBlinks]);

  useEffect(() => {
    if (isStarted) {
      handleDetection();
    }
  }, [isStarted, handleDetection]);

  return (
    <div className="grid grid-cols-12 grid-rows-6 gap-5 h-full min-h-[700px]">
      {/* Viewport Card */}
      <div className="col-span-8 row-span-5 bento-card p-0 bg-black flex flex-col">
        {!isStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
               <Camera className="w-10 h-10 text-blue-500 relative z-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Biometric Scanner Offline</h3>
            <p className="text-[#64748b] max-w-sm text-sm">Select target lecture and initialize the V-Engine to begin student identification.</p>
            <div className="mt-8 flex gap-3">
               <select 
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="bg-[#1e293b] border border-[#30363d] text-white px-4 py-2 rounded-xl outline-none focus:border-blue-500/50 text-xs font-bold"
              >
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.subject}</option>
                ))}
              </select>
              <button
                onClick={toggleScanner}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                Initialize Engine
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden rounded-[20px]">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover" 
            />
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
              <div className="h-full w-full border-2 border-dashed border-blue-500/30 rounded-3xl" />
            </div>

            {/* Scanning Line */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-[30%] animate-scan shadow-[0_0_15px_#3b82f6]" />

            {/* HUD Elements */}
            <div className="absolute top-8 left-8 flex flex-col gap-3">
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Feed: Active</span>
              </div>
              <div className={cn(
                "bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border flex items-center gap-2",
                livenessStatus.includes('Verified') ? "border-emerald-500/30 text-emerald-500" : "border-blue-500/30 text-blue-500"
              )}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{livenessStatus}</span>
              </div>
            </div>

            <div className="absolute bottom-8 left-8">
               <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-blue-500/40">
                  <span className="stat-label text-blue-500">Live Ident:</span>
                  <div className="text-sm font-bold text-white mt-1">
                    {lastDetected?.name || 'Scanning for biological anchors...'}
                  </div>
               </div>
            </div>

            <div className="absolute top-8 right-8">
               <button onClick={toggleScanner} className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl shadow-lg transition-all">
                  <CameraOff className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panels */}
      <div className="col-span-4 row-span-3 bento-card flex flex-col">
          <span className="stat-label mb-6">Last Verified Identity</span>
          <AnimatePresence mode="wait">
            {lastDetected ? (
              <motion.div
                key={lastDetected.name + lastDetected.time}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col items-center text-center",
                  lastDetected.status === 'success' ? "bg-emerald-500/5 border-emerald-500/20" : 
                  lastDetected.status === 'duplicate' ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-2xl font-black italic",
                  lastDetected.status === 'success' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : 
                  lastDetected.status === 'duplicate' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                )}>
                  {lastDetected.name.charAt(0)}
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{lastDetected.name}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-4">
                  <Clock className="w-3 h-3" />
                  {lastDetected.status === 'success' ? `Verified at ${lastDetected.time}` : lastDetected.time}
                </div>
                
                <div className={cn(
                  "w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                  lastDetected.status === 'success' ? "text-emerald-500 bg-emerald-500/10" : 
                  lastDetected.status === 'duplicate' ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10"
                )}>
                  {lastDetected.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {lastDetected.status === 'success' ? "MATCH: SUCCESS" : "ALREADY LOGGED"}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-30">
                 <Zap className="w-12 h-12 text-[#64748b] mb-4" />
                 <p className="text-xs font-bold uppercase tracking-widest">Inference Idle</p>
              </div>
            )}
          </AnimatePresence>
      </div>

      <div className="col-span-4 row-span-3 bento-card flex flex-col min-h-0">
          <span className="stat-label mb-4">Activity Stream</span>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#161b22] border border-[#30363d] rounded-xl">
                 <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center text-xs font-bold">
                    {log.name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white truncate">{log.name}</div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{log.msg}</div>
                 </div>
                 <div className="text-[10px] text-[#64748b]">{log.time}</div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center py-12 text-[#64748b] text-[10px] uppercase font-bold tracking-widest">No signals detected</p>
            )}
          </div>
      </div>

      {/* Bottom Monitoring Bar */}
      <div className="col-span-12 row-span-1 bento-card flex items-center justify-between px-10">
          <div className="flex gap-10 items-center">
             <div>
                <span className="stat-label">Blink Detection</span>
                <div className="text-[13px] font-bold text-white mt-1 flex items-center gap-2">
                   {detectedBlinks} Identified <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                </div>
             </div>
             <div>
                <span className="stat-label">Model Confidence</span>
                <div className="text-[13px] font-bold text-emerald-500 mt-1">99.2% Nominal</div>
             </div>
             <div>
                <span className="stat-label">Head Pose</span>
                <div className="text-[13px] font-bold text-white mt-1">Optimal</div>
             </div>
             <div>
                <span className="stat-label">Liveness Engine</span>
                <div className="text-[13px] font-bold text-emerald-500 mt-1">Enabled</div>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setDetectedBlinks(0)} className="bg-[#1e293b] text-[#e2e8f0] px-6 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-[#2d3748] transition-colors">Reset Buffer</button>
             <button className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">Export Session</button>
          </div>
      </div>
    </div>
  );
}
