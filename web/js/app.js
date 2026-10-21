/**
 * Online SAMS - Core Client Application Utilities
 */

const API_BASE = '/api';

// ================= LOCAL STORAGE MOCK DB (FALLBACK) =================
const MOCK_STORAGE_KEY = 'online_sams_db';

function getMockDb() {
  const existing = localStorage.getItem(MOCK_STORAGE_KEY);
  if (existing) {
    try { return JSON.parse(existing); } catch (e) {}
  }
  const defaultDb = {
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
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultDb));
  return defaultDb;
}

function saveMockDb(db) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

function mockApiHandler(endpoint, method, body) {
  const db = getMockDb();
  const urlObj = new URL(endpoint, 'http://localhost');
  const path = urlObj.pathname;
  const params = Object.fromEntries(urlObj.searchParams.entries());

  if (path === '/auth/login' && method === 'POST') {
    const { role, username, password } = body;
    if (role === 'admin') {
      const u = db.admin.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
      if (u) return { success: true, message: 'Admin login successful', data: u };
    } else if (role === 'teacher') {
      const u = db.teachers.find(t => t.username.toLowerCase() === username.toLowerCase() && t.password === password);
      if (u) return { success: true, message: 'Teacher login successful', data: { id: u.teacherId, ...u } };
    } else if (role === 'student') {
      const u = db.students.find(s => s.username.toLowerCase() === username.toLowerCase() && s.password === password);
      if (u) return { success: true, message: 'Student login successful', data: { id: u.studentId, ...u } };
    }
    throw new Error('Invalid username or password');
  }

  if (path === '/auth/change-password' && method === 'POST') {
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
    saveMockDb(db);
    return { success: true, message: 'Password updated' };
  }

  if (path === '/stats/dashboard' && method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = db.attendance.filter(a => a.attendanceDate === today);
    const todayPresent = todayRecords.filter(a => a.status === 'Present').length;
    const todayAbsent = todayRecords.filter(a => a.status === 'Absent').length;
    const todayRate = todayRecords.length > 0 ? Math.round((todayPresent * 100) / todayRecords.length) : 0;
    const allTotal = db.attendance.length;
    const allPresent = db.attendance.filter(a => a.status === 'Present').length;
    const allRate = allTotal > 0 ? Math.round((allPresent * 100) / allTotal) : 0;
    return {
      success: true,
      data: {
        totalStudents: db.students.length,
        totalTeachers: db.teachers.length,
        totalSubjects: db.subjects.length,
        todayAttendanceRate: todayRate,
        todayPresent,
        todayAbsent,
        overallAttendanceRate: allRate,
        allTimeRecords: allTotal
      }
    };
  }

  if (path === '/students' || path.startsWith('/students/')) {
    const id = path.split('/')[2] ? parseInt(path.split('/')[2]) : null;
    if (method === 'GET') {
      if (id) {
        const s = db.students.find(x => x.studentId === id);
        return s ? { success: true, data: s } : { success: false, error: 'Not found' };
      }
      let list = [...db.students];
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q));
      }
      return { success: true, data: list };
    }
    if (method === 'POST') {
      const newS = { studentId: Date.now() % 10000, ...body, role: 'student' };
      db.students.push(newS);
      saveMockDb(db);
      return { success: true, message: 'Student created', data: newS };
    }
    if (method === 'PUT') {
      const sid = id || body.studentId;
      const s = db.students.find(x => x.studentId == sid);
      if (s) Object.assign(s, body);
      saveMockDb(db);
      return { success: true, message: 'Student updated', data: s };
    }
    if (method === 'DELETE') {
      const sid = id || parseInt(body?.studentId || params?.id);
      db.students = db.students.filter(x => x.studentId !== sid);
      db.attendance = db.attendance.filter(x => x.studentId !== sid);
      saveMockDb(db);
      return { success: true, message: 'Student deleted' };
    }
  }

  if (path === '/teachers' || path.startsWith('/teachers/')) {
    const id = path.split('/')[2] ? parseInt(path.split('/')[2]) : null;
    if (method === 'GET') {
      return { success: true, data: db.teachers };
    }
    if (method === 'POST') {
      const newT = { teacherId: Date.now() % 10000, ...body, role: 'teacher' };
      db.teachers.push(newT);
      saveMockDb(db);
      return { success: true, message: 'Teacher created', data: newT };
    }
    if (method === 'PUT') {
      const tid = id || body.teacherId;
      const t = db.teachers.find(x => x.teacherId == tid);
      if (t) Object.assign(t, body);
      saveMockDb(db);
      return { success: true, message: 'Teacher updated', data: t };
    }
    if (method === 'DELETE') {
      const tid = id || parseInt(body?.teacherId || params?.id);
      db.teachers = db.teachers.filter(x => x.teacherId !== tid);
      saveMockDb(db);
      return { success: true, message: 'Teacher deleted' };
    }
  }

  if (path === '/subjects' || path.startsWith('/subjects/')) {
    const id = path.split('/')[2] ? parseInt(path.split('/')[2]) : null;
    if (method === 'GET') {
      return { success: true, data: db.subjects };
    }
    if (method === 'POST') {
      const newSub = { subjectId: Date.now() % 10000, ...body };
      db.subjects.push(newSub);
      saveMockDb(db);
      return { success: true, message: 'Subject created', data: newSub };
    }
    if (method === 'PUT') {
      const sid = id || body.subjectId;
      const sub = db.subjects.find(x => x.subjectId == sid);
      if (sub) Object.assign(sub, body);
      saveMockDb(db);
      return { success: true, message: 'Subject updated', data: sub };
    }
    if (method === 'DELETE') {
      const sid = id || parseInt(body?.subjectId || params?.id);
      db.subjects = db.subjects.filter(x => x.subjectId !== sid);
      db.attendance = db.attendance.filter(x => x.subjectId !== sid);
      saveMockDb(db);
      return { success: true, message: 'Subject deleted' };
    }
  }

  if (path === '/attendance' || path.startsWith('/attendance/')) {
    if (path === '/attendance/bulk' && method === 'POST') {
      const { subjectId, attendanceDate, records } = body;
      for (const r of (records || [])) {
        const existing = db.attendance.find(a => a.studentId == r.studentId && a.subjectId == subjectId && a.attendanceDate === attendanceDate);
        if (existing) {
          existing.status = r.status;
        } else {
          db.attendance.push({
            attendanceId: Date.now() % 100000 + Math.floor(Math.random() * 100),
            studentId: parseInt(r.studentId),
            subjectId: parseInt(subjectId),
            attendanceDate,
            status: r.status
          });
        }
      }
      saveMockDb(db);
      return { success: true, message: `Attendance saved for ${(records || []).length} students` };
    }
    const id = path.split('/')[2] ? parseInt(path.split('/')[2]) : null;
    if (method === 'GET') {
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
      if (params.studentId) list = list.filter(a => a.studentId == params.studentId);
      if (params.subjectId) list = list.filter(a => a.subjectId == params.subjectId);
      if (params.date) list = list.filter(a => a.attendanceDate === params.date);
      return { success: true, data: list };
    }
    if (method === 'PUT') {
      const aid = id || body.attendanceId;
      const r = db.attendance.find(x => x.attendanceId == aid);
      if (r && body.status) r.status = body.status;
      saveMockDb(db);
      return { success: true, message: 'Attendance updated' };
    }
    if (method === 'DELETE') {
      const aid = id || parseInt(body?.attendanceId || params?.id);
      db.attendance = db.attendance.filter(x => x.attendanceId !== aid);
      saveMockDb(db);
      return { success: true, message: 'Attendance deleted' };
    }
  }

  if (path.startsWith('/reports')) {
    if (path.includes('/student')) {
      const sid = parseInt(params.studentId);
      const student = db.students.find(s => s.studentId === sid) || db.students[0];
      const studentRecords = db.attendance.filter(a => a.studentId === student.studentId);
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
      const overallPct = totalAll > 0 ? Math.round((presentAll * 100) / totalAll) : 0;
      return {
        success: true,
        data: {
          student,
          overview: {
            totalClasses: totalAll,
            presentClasses: presentAll,
            absentClasses: totalAll - presentAll,
            percentage: overallPct
          },
          breakdown
        }
      };
    }
    const subjectId = params.subjectId ? parseInt(params.subjectId) : null;
    let targetSubs = subjectId ? db.subjects.filter(s => s.subjectId === subjectId) : db.subjects;
    const reportRows = [];
    for (const s of db.students) {
      for (const sub of targetSubs) {
        const records = db.attendance.filter(a => a.studentId === s.studentId && a.subjectId === sub.subjectId);
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
    return { success: true, data: reportRows };
  }

  throw new Error('Not found');
}

// ================= API CLIENT =================
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  let bodyObj = null;
  if (config.body && typeof config.body === 'object') {
    bodyObj = config.body;
    config.body = JSON.stringify(config.body);
  } else if (typeof config.body === 'string') {
    try { bodyObj = JSON.parse(config.body); } catch (e) {}
  }

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    const data = await res.json().catch(() => ({}));
    return data;
  } catch (err) {
    // If server unreachable or error, use smart mock DB fallback
    try {
      const method = (config.method || 'GET').toUpperCase();
      const mockResult = mockApiHandler(endpoint, method, bodyObj);
      return mockResult;
    } catch (mockErr) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }
}

// ================= SESSION MANAGEMENT =================
const SESSION_KEY = 'online_sams_user';

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function requireAuth(allowedRoles = []) {
  const user = getSession();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access Denied! You do not have permissions to access this area.`);
    if (user.role === 'admin') window.location.href = 'admin.html';
    else if (user.role === 'teacher') window.location.href = 'teacher.html';
    else if (user.role === 'student') window.location.href = 'student.html';
    else window.location.href = 'index.html';
    return null;
  }

  return user;
}

// ================= TOAST NOTIFICATIONS =================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span style="font-weight:bold;">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= MODAL HELPERS =================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Bind modal backdrop click & close buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Live time ticker
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const updateTime = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      }) + ' • ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }
});

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
