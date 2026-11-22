import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AttendanceScanner from './pages/AttendanceScanner';
import StudentManagement from './pages/StudentManagement';
import LectureManagement from './pages/LectureManagement';
import AttendanceHistory from './pages/AttendanceHistory';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { User } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuth') === 'true';
  });

  const login = (username: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('username', username);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuth');
    localStorage.removeItem('username');
  };

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
        <Sidebar onLogout={logout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<AttendanceScanner />} />
              <Route path="/students" element={<StudentManagement />} />
              <Route path="/lectures" element={<LectureManagement />} />
              <Route path="/history" element={<AttendanceHistory />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
