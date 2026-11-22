export interface Student {
  id: number;
  roll_number: string;
  name: string;
  department: string;
  year: string;
  division: string;
  face_encoding: string;
}

export interface Lecture {
  id: number;
  subject: string;
  faculty: string;
  room_number: string;
  start_time: string;
  end_time: string;
  date: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  lecture_id: number;
  timestamp: string;
  status: string;
  student_name: string;
  roll_number: string;
  subject: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalLectures: number;
  todayAttendance: number;
  unknownToday: number;
}
