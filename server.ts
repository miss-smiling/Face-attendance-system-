import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Database Initialization
  const db = new Database('attendance.db');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll_number TEXT UNIQUE,
      name TEXT,
      department TEXT,
      year TEXT,
      division TEXT,
      face_encoding TEXT
    );

    CREATE TABLE IF NOT EXISTS lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      faculty TEXT,
      room_number TEXT,
      start_time TEXT,
      end_time TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      lecture_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (lecture_id) REFERENCES lectures(id),
      UNIQUE(student_id, lecture_id)
    );

    CREATE TABLE IF NOT EXISTS unknown_faces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initial Admin
  const adminExists = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
  if (!adminExists) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'password123');
  }

  // API Routes
  
  // Auth
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
    if (admin) {
      res.json({ success: true, user: { username: admin.username } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Students
  app.get('/api/students', (req, res) => {
    const students = db.prepare('SELECT * FROM students').all();
    res.json(students);
  });

  app.post('/api/students', (req, res) => {
    const { roll_number, name, department, year, division, face_encoding } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO students (roll_number, name, department, year, division, face_encoding) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(roll_number, name, department, year, division, JSON.stringify(face_encoding));
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/students/:id', (req, res) => {
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Lectures
  app.get('/api/lectures', (req, res) => {
    const lectures = db.prepare('SELECT * FROM lectures').all();
    res.json(lectures);
  });

  app.post('/api/lectures', (req, res) => {
    const { subject, faculty, room_number, start_time, end_time, date } = req.body;
    const result = db.prepare(`
      INSERT INTO lectures (subject, faculty, room_number, start_time, end_time, date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(subject, faculty, room_number, start_time, end_time, date);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  // Attendance
  app.get('/api/attendance', (req, res) => {
    const { lecture_id } = req.query;
    let query = `
      SELECT a.*, s.name as student_name, s.roll_number, l.subject 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN lectures l ON a.lecture_id = l.id
    `;
    if (lecture_id) {
      query += ` WHERE a.lecture_id = ?`;
      const records = db.prepare(query).all(lecture_id);
      res.json(records);
    } else {
      const records = db.prepare(query).all();
      res.json(records);
    }
  });

  app.post('/api/attendance', (req, res) => {
    const { student_id, lecture_id, status } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO attendance (student_id, lecture_id, status) 
        VALUES (?, ?, ?)
      `).run(student_id, lecture_id, status || 'Present');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        const existing = db.prepare('SELECT timestamp FROM attendance WHERE student_id = ? AND lecture_id = ?').get(student_id, lecture_id);
        res.status(409).json({ success: false, message: 'Already marked', timestamp: (existing as any).timestamp });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  });

  // Unknown Faces
  app.post('/api/unknown', (req, res) => {
    const { image_data } = req.body;
    // Here we would save the image to disk, but for now we'll just log it
    // In a real app we'd save to unknown_faces directory
    const result = db.prepare(`INSERT INTO unknown_faces (image_path) VALUES (?)`).run('captured_' + Date.now() + '.jpg');
    res.json({ success: true });
  });

  app.get('/api/stats', (req, res) => {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get() as any;
    const totalLectures = db.prepare('SELECT COUNT(*) as count FROM lectures').get() as any;
    const todayAttendance = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date(timestamp) = date('now')").get() as any;
    const unknownToday = db.prepare("SELECT COUNT(*) as count FROM unknown_faces WHERE date(timestamp) = date('now')").get() as any;
    
    res.json({
      totalStudents: totalStudents.count,
      totalLectures: totalLectures.count,
      todayAttendance: todayAttendance.count,
      unknownToday: unknownToday.count
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
