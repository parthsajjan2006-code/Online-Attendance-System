// Vercel Serverless Function Router for Online SAMS

let db = {
  admin: [
    { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' }
  ],
  teachers: [
    { teacherId: 1, name: 'Nikhil', email: 'nikhil@college.edu', username: 'Nikhil', password: 'nikhil123', role: 'teacher' }
  ],
  students: [
    { studentId: 1, name: 'Parth', email: 'parth@example.com', course: 'B.Sc CS', semester: 5, username: 'parth', password: 'parth123', role: 'student' },
    { studentId: 2, name: 'Pranav', email: 'pranav@example.com', course: 'B.Sc CS', semester: 5, username: 'pranav', password: 'pranav123', role: 'student' },
    { studentId: 3, name: 'Aditya', email: 'adi@example.com', course: 'B.Sc CS', semester: 5, username: 'aditya', password: 'adi@123', role: 'student' }
  ],
  subjects: [
    { subjectId: 1, subjectName: 'Java Programming' },
    { subjectId: 2, subjectName: 'Python' },
    { subjectId: 3, subjectName: 'Theory of Computation' },
    { subjectId: 4, subjectName: 'Data Structures' },
    { subjectId: 5, subjectName: 'Operating Systems' }
  ],
  attendance: [
    { attendanceId: 1, studentId: 1, subjectId: 1, attendanceDate: '2026-10-08', status: 'Present' },
    { attendanceId: 2, studentId: 2, subjectId: 1, attendanceDate: '2026-10-08', status: 'Absent' },
    { attendanceId: 3, studentId: 3, subjectId: 1, attendanceDate: '2026-10-08', status: 'Present' }
  ]
};

let nextAttendanceId = 10;
let nextStudentId = 10;
let nextTeacherId = 10;
let nextSubjectId = 10;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path and query
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/^\/api/, '');
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  let body = req.body;
  if (typeof body === 'string' && body) {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  try {
    // 1. AUTH LOGIN
    if (pathname === '/auth/login' && req.method === 'POST') {
      const { role, username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
      }

      if (role === 'admin') {
        const u = db.admin.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
        if (u) return res.status(200).json({ success: true, message: 'Admin login successful', data: u });
      } else if (role === 'teacher') {
        const u = db.teachers.find(t => t.username.toLowerCase() === username.toLowerCase() && t.password === password);
        if (u) return res.status(200).json({ success: true, message: 'Teacher login successful', data: { id: u.teacherId, ...u } });
      } else if (role === 'student') {
        const u = db.students.find(s => s.username.toLowerCase() === username.toLowerCase() && s.password === password);
        if (u) return res.status(200).json({ success: true, message: 'Student login successful', data: { id: u.studentId, ...u } });
      }

      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // 2. CHANGE PASSWORD
    if (pathname === '/auth/change-password' && req.method === 'POST') {
      const { role, userId, newPassword } = body;
      if (role === 'admin') {
        const a = db.admin.find(x => x.id == userId);
        if (a) a.password = newPassword;
      } else if (role === 'teacher') {
        const t = db.teachers.find(x => x.teacherId == userId);
        if (t) t.password = newPassword;
      } else if (role === 'student') {
        const s = db.students.find(x => x.studentId == userId);
        if (s) s.password = newPassword;
      }
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    // 3. STATS DASHBOARD
    if (pathname === '/stats/dashboard' && req.method === 'GET') {
      const today = new Date().toISOString().slice(0, 10);
      const todayRecords = db.attendance.filter(a => a.attendanceDate === today);
      const todayPresent = todayRecords.filter(a => a.status === 'Present').length;
      const todayAbsent = todayRecords.filter(a => a.status === 'Absent').length;
      const todayRate = todayRecords.length > 0 ? Math.round((todayPresent * 100) / todayRecords.length) : 0;

      const totalAll = db.attendance.length;
      const presentAll = db.attendance.filter(a => a.status === 'Present').length;
      const allRate = totalAll > 0 ? Math.round((presentAll * 100) / totalAll) : 0;

      return res.status(200).json({
        success: true,
        data: {
          totalStudents: db.students.length,
          totalTeachers: db.teachers.length,
          totalSubjects: db.subjects.length,
          todayAttendanceRate: todayRate,
          todayPresent,
          todayAbsent,
          overallAttendanceRate: allRate,
          allTimeRecords: totalAll
        }
      });
    }

    // 4. STUDENTS CRUD
    if (pathname === '/students' || pathname.startsWith('/students/')) {
      const idMatch = pathname.match(/^\/students\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : (query.id ? parseInt(query.id) : null);

      if (req.method === 'GET') {
        if (id) {
          const s = db.students.find(x => x.studentId === id);
          return s ? res.status(200).json({ success: true, data: s }) : res.status(404).json({ success: false, error: 'Student not found' });
        }
        let list = [...db.students];
        if (query.search) {
          const q = query.search.toLowerCase();
          list = list.filter(s => s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q));
        }
        return res.status(200).json({ success: true, data: list });
      }

      if (req.method === 'POST') {
        const newStudent = {
          studentId: nextStudentId++,
          name: body.name,
          email: body.email || '',
          course: body.course || 'B.Sc CS',
          semester: parseInt(body.semester) || 1,
          username: body.username,
          password: body.password,
          role: 'student'
        };
        db.students.push(newStudent);
        return res.status(200).json({ success: true, message: 'Student registered', data: newStudent });
      }

      if (req.method === 'PUT') {
        const sid = id || body.studentId;
        const s = db.students.find(x => x.studentId == sid);
        if (!s) return res.status(404).json({ success: false, error: 'Student not found' });
        if (body.name) s.name = body.name;
        if (body.email) s.email = body.email;
        if (body.course) s.course = body.course;
        if (body.semester) s.semester = parseInt(body.semester);
        if (body.username) s.username = body.username;
        if (body.password) s.password = body.password;
        return res.status(200).json({ success: true, message: 'Student updated', data: s });
      }

      if (req.method === 'DELETE') {
        const sid = id || parseInt(body.studentId);
        db.students = db.students.filter(x => x.studentId !== sid);
        db.attendance = db.attendance.filter(x => x.studentId !== sid);
        return res.status(200).json({ success: true, message: 'Student deleted' });
      }
    }

    // 5. TEACHERS CRUD
    if (pathname === '/teachers' || pathname.startsWith('/teachers/')) {
      const idMatch = pathname.match(/^\/teachers\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : (query.id ? parseInt(query.id) : null);

      if (req.method === 'GET') {
        if (id) {
          const t = db.teachers.find(x => x.teacherId === id);
          return t ? res.status(200).json({ success: true, data: t }) : res.status(404).json({ success: false, error: 'Teacher not found' });
        }
        return res.status(200).json({ success: true, data: db.teachers });
      }

      if (req.method === 'POST') {
        const newTeacher = {
          teacherId: nextTeacherId++,
          name: body.name,
          email: body.email || '',
          username: body.username,
          password: body.password,
          role: 'teacher'
        };
        db.teachers.push(newTeacher);
        return res.status(200).json({ success: true, message: 'Teacher added', data: newTeacher });
      }

      if (req.method === 'PUT') {
        const tid = id || body.teacherId;
        const t = db.teachers.find(x => x.teacherId == tid);
        if (!t) return res.status(404).json({ success: false, error: 'Teacher not found' });
        if (body.name) t.name = body.name;
        if (body.email) t.email = body.email;
        if (body.username) t.username = body.username;
        if (body.password) t.password = body.password;
        return res.status(200).json({ success: true, message: 'Teacher updated', data: t });
      }

      if (req.method === 'DELETE') {
        const tid = id || parseInt(body.teacherId);
        db.teachers = db.teachers.filter(x => x.teacherId !== tid);
        return res.status(200).json({ success: true, message: 'Teacher deleted' });
      }
    }

    // 6. SUBJECTS CRUD
    if (pathname === '/subjects' || pathname.startsWith('/subjects/')) {
      const idMatch = pathname.match(/^\/subjects\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : (query.id ? parseInt(query.id) : null);

      if (req.method === 'GET') {
        return res.status(200).json({ success: true, data: db.subjects });
      }

      if (req.method === 'POST') {
        const newSub = {
          subjectId: nextSubjectId++,
          subjectName: body.subjectName
        };
        db.subjects.push(newSub);
        return res.status(200).json({ success: true, message: 'Subject created', data: newSub });
      }

      if (req.method === 'PUT') {
        const sid = id || body.subjectId;
        const sub = db.subjects.find(x => x.subjectId == sid);
        if (!sub) return res.status(404).json({ success: false, error: 'Subject not found' });
        if (body.subjectName) sub.subjectName = body.subjectName;
        return res.status(200).json({ success: true, message: 'Subject updated', data: sub });
      }

      if (req.method === 'DELETE') {
        const sid = id || parseInt(body.subjectId);
        db.subjects = db.subjects.filter(x => x.subjectId !== sid);
        db.attendance = db.attendance.filter(x => x.subjectId !== sid);
        return res.status(200).json({ success: true, message: 'Subject deleted' });
      }
    }

    // 7. ATTENDANCE
    if (pathname === '/attendance' || pathname.startsWith('/attendance/')) {
      if (pathname === '/attendance/bulk' && req.method === 'POST') {
        const { subjectId, attendanceDate, records } = body;
        for (const r of (records || [])) {
          const existing = db.attendance.find(a => a.studentId == r.studentId && a.subjectId == subjectId && a.attendanceDate === attendanceDate);
          if (existing) {
            existing.status = r.status;
          } else {
            db.attendance.push({
              attendanceId: nextAttendanceId++,
              studentId: parseInt(r.studentId),
              subjectId: parseInt(subjectId),
              attendanceDate,
              status: r.status
            });
          }
        }
        return res.status(200).json({ success: true, message: `Attendance saved for ${(records || []).length} students` });
      }

      const idMatch = pathname.match(/^\/attendance\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : (query.id ? parseInt(query.id) : null);

      if (req.method === 'GET') {
        let list = db.attendance.map(a => {
          const stud = db.students.find(s => s.studentId === a.studentId) || {};
          const sub = db.subjects.find(s => s.subjectId === a.subjectId) || {};
          return {
            ...a,
            studentName: stud.name || 'Unknown',
            course: stud.course || 'B.Sc CS',
            semester: stud.semester || 1,
            subjectName: sub.subjectName || 'Unknown'
          };
        });

        if (query.studentId) list = list.filter(a => a.studentId == query.studentId);
        if (query.subjectId) list = list.filter(a => a.subjectId == query.subjectId);
        if (query.date) list = list.filter(a => a.attendanceDate === query.date);

        return res.status(200).json({ success: true, data: list });
      }

      if (req.method === 'PUT') {
        const aid = id || body.attendanceId;
        const record = db.attendance.find(a => a.attendanceId == aid);
        if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
        if (body.status) record.status = body.status;
        return res.status(200).json({ success: true, message: 'Attendance updated' });
      }

      if (req.method === 'DELETE') {
        const aid = id || parseInt(body.attendanceId);
        db.attendance = db.attendance.filter(a => a.attendanceId !== aid);
        return res.status(200).json({ success: true, message: 'Attendance record deleted' });
      }
    }

    // 8. REPORTS
    if (pathname.startsWith('/reports')) {
      if (pathname.includes('/student')) {
        const sid = parseInt(query.studentId);
        const student = db.students.find(s => s.studentId === sid);
        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

        const studentRecords = db.attendance.filter(a => a.studentId === sid);
        const breakdown = db.subjects.map(sub => {
          const subRecords = studentRecords.filter(a => a.subjectId === sub.subjectId);
          const total = subRecords.length;
          const present = subRecords.filter(a => a.status === 'Present').length;
          const absent = subRecords.filter(a => a.status === 'Absent').length;
          const pct = total > 0 ? Math.round((present * 100) / total) : 0;
          return {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            totalClasses: total,
            presentClasses: present,
            absentClasses: absent,
            percentage: pct,
            statusLabel: pct >= 75 ? 'Good' : (pct >= 60 ? 'Warning' : 'Critical')
          };
        });

        const totalAll = studentRecords.length;
        const presentAll = studentRecords.filter(a => a.status === 'Present').length;
        const absentAll = studentRecords.filter(a => a.status === 'Absent').length;
        const overallPct = totalAll > 0 ? Math.round((presentAll * 100) / totalAll) : 0;

        return res.status(200).json({
          success: true,
          data: {
            student,
            overview: {
              totalClasses: totalAll,
              presentClasses: presentAll,
              absentClasses: absentAll,
              percentage: overallPct
            },
            breakdown
          }
        });
      }

      // Subject report or overall report
      const subjectId = query.subjectId ? parseInt(query.subjectId) : null;
      let targetSubs = subjectId ? db.subjects.filter(s => s.subjectId === subjectId) : db.subjects;

      const reportRows = [];
      for (const s of db.students) {
        for (const sub of targetSubs) {
          const records = db.attendance.filter(a => a.studentId === s.studentId && a.subjectId === sub.subjectId);
          if (records.length > 0 || !subjectId) {
            const total = records.length;
            const present = records.filter(a => a.status === 'Present').length;
            const absent = records.filter(a => a.status === 'Absent').length;
            const pct = total > 0 ? Math.round((present * 100) / total) : 0;
            reportRows.push({
              studentId: s.studentId,
              studentName: s.name,
              course: s.course,
              semester: s.semester,
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              totalClasses: total,
              presentClasses: present,
              absentClasses: absent,
              percentage: pct
            });
          }
        }
      }
      return res.status(200).json({ success: true, data: reportRows });
    }

    return res.status(404).json({ success: false, error: 'Endpoint not found' });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
