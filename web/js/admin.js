/**
 * Online SAMS - Admin Portal Controller
 */

let currentAdmin = null;
let cachedSubjects = [];
let cachedStudents = [];
let cachedTeachers = [];

document.addEventListener('DOMContentLoaded', () => {
  currentAdmin = requireAuth(['admin']);
  if (!currentAdmin) return;

  // Set user display
  document.getElementById('adminName').textContent = currentAdmin.name || currentAdmin.username;
  document.getElementById('adminAvatar').textContent = (currentAdmin.username || 'AD').substring(0, 2).toUpperCase();

  initNavigation();
  initFormListeners();

  // Load initial data
  loadDashboardStats();
  loadSubjectsList();
});

// ================= NAVIGATION =================
function initNavigation() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  const titles = {
    dashboard: 'Dashboard Overview',
    students: 'Students Management',
    teachers: 'Teachers Management',
    subjects: 'Subjects Management',
    attendance: 'Master Attendance Logs',
    reports: 'Attendance Analytics & Reports'
  };
  document.getElementById('pageTitle').textContent = titles[tabId] || 'Admin Portal';

  // Lazy load data for tabs
  if (tabId === 'dashboard') loadDashboardStats();
  else if (tabId === 'students') loadStudentsList();
  else if (tabId === 'teachers') loadTeachersList();
  else if (tabId === 'subjects') loadSubjectsList();
  else if (tabId === 'attendance') loadAttendanceLogs();
  else if (tabId === 'reports') loadReports();
}

// ================= DASHBOARD =================
async function loadDashboardStats() {
  try {
    const res = await fetchAPI('/stats/dashboard');
    if (res.success && res.data) {
      const s = res.data;
      document.getElementById('statStudents').textContent = s.totalStudents || 0;
      document.getElementById('statTeachers').textContent = s.totalTeachers || 0;
      document.getElementById('statSubjects').textContent = s.totalSubjects || 0;
      document.getElementById('statTodayRate').textContent = `${s.todayAttendanceRate || 0}%`;
      document.getElementById('statTodayPresent').textContent = s.todayPresent || 0;
      document.getElementById('statTodayAbsent').textContent = s.todayAbsent || 0;
      document.getElementById('statOverallRate').textContent = `${s.overallAttendanceRate || 0}%`;
      document.getElementById('statTotalLogs').textContent = s.allTimeRecords || 0;
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
}

// ================= STUDENTS =================
async function loadStudentsList() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading students...</td></tr>';

  try {
    const query = document.getElementById('studentSearchInput').value.trim();
    const url = query ? `/students?search=${encodeURIComponent(query)}` : '/students';
    const res = await fetchAPI(url);

    if (res.success && res.data) {
      cachedStudents = res.data;
      renderStudentsTable(cachedStudents);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Failed to load students: ${err.message}</td></tr>`;
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  if (!students || students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No students found.</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td><strong>#${s.studentId}</strong></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.email || '-')}</td>
      <td><span class="badge badge-neutral">${escapeHtml(s.course || '-')}</span></td>
      <td>Sem ${s.semester || 1}</td>
      <td><code>${escapeHtml(s.username || '-')}</code></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditStudentModal(${s.studentId})">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.studentId}, '${escapeHtml(s.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openAddStudentModal() {
  document.getElementById('modalStudentTitle').textContent = 'Add New Student';
  document.getElementById('studentIdInput').value = '';
  document.getElementById('studentNameInput').value = '';
  document.getElementById('studentEmailInput').value = '';
  document.getElementById('studentCourseInput').value = 'B.Sc CS';
  document.getElementById('studentSemesterInput').value = '1';
  document.getElementById('studentUsernameInput').value = '';
  document.getElementById('studentPasswordInput').value = '';
  document.getElementById('studentPasswordInput').required = true;
  document.getElementById('studentPassLabel').textContent = 'Password *';
  openModal('modalStudent');
}

function openEditStudentModal(studentId) {
  const s = cachedStudents.find(item => item.studentId === studentId);
  if (!s) return;

  document.getElementById('modalStudentTitle').textContent = 'Edit Student Details';
  document.getElementById('studentIdInput').value = s.studentId;
  document.getElementById('studentNameInput').value = s.name;
  document.getElementById('studentEmailInput').value = s.email || '';
  document.getElementById('studentCourseInput').value = s.course || 'B.Sc CS';
  document.getElementById('studentSemesterInput').value = s.semester || 1;
  document.getElementById('studentUsernameInput').value = s.username || '';
  document.getElementById('studentPasswordInput').value = '';
  document.getElementById('studentPasswordInput').required = false;
  document.getElementById('studentPassLabel').textContent = 'Password (leave blank to keep current)';
  openModal('modalStudent');
}

async function deleteStudent(studentId, name) {
  if (!confirm(`Are you sure you want to delete student "${name}"? This will also remove their attendance history.`)) {
    return;
  }
  try {
    const res = await fetchAPI(`/students/${studentId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Student deleted successfully', 'success');
      loadStudentsList();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete student: ' + err.message, 'error');
  }
}

// ================= TEACHERS =================
async function loadTeachersList() {
  const tbody = document.getElementById('teachersTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading teachers...</td></tr>';

  try {
    const res = await fetchAPI('/teachers');
    if (res.success && res.data) {
      cachedTeachers = res.data;
      renderTeachersTable(cachedTeachers);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Failed to load teachers: ${err.message}</td></tr>`;
  }
}

function renderTeachersTable(teachers) {
  const tbody = document.getElementById('teachersTableBody');
  if (!teachers || teachers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No teachers found.</td></tr>';
    return;
  }

  tbody.innerHTML = teachers.map(t => `
    <tr>
      <td><strong>#${t.teacherId}</strong></td>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td>${escapeHtml(t.email || '-')}</td>
      <td><code>${escapeHtml(t.username)}</code></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditTeacherModal(${t.teacherId})">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${t.teacherId}, '${escapeHtml(t.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openAddTeacherModal() {
  document.getElementById('modalTeacherTitle').textContent = 'Add New Teacher';
  document.getElementById('teacherIdInput').value = '';
  document.getElementById('teacherNameInput').value = '';
  document.getElementById('teacherEmailInput').value = '';
  document.getElementById('teacherUsernameInput').value = '';
  document.getElementById('teacherPasswordInput').value = '';
  document.getElementById('teacherPasswordInput').required = true;
  document.getElementById('teacherPassLabel').textContent = 'Password *';
  openModal('modalTeacher');
}

function openEditTeacherModal(teacherId) {
  const t = cachedTeachers.find(item => item.teacherId === teacherId);
  if (!t) return;

  document.getElementById('modalTeacherTitle').textContent = 'Edit Teacher Details';
  document.getElementById('teacherIdInput').value = t.teacherId;
  document.getElementById('teacherNameInput').value = t.name;
  document.getElementById('teacherEmailInput').value = t.email || '';
  document.getElementById('teacherUsernameInput').value = t.username;
  document.getElementById('teacherPasswordInput').value = '';
  document.getElementById('teacherPasswordInput').required = false;
  document.getElementById('teacherPassLabel').textContent = 'Password (leave blank to keep current)';
  openModal('modalTeacher');
}

async function deleteTeacher(teacherId, name) {
  if (!confirm(`Are you sure you want to remove teacher "${name}"?`)) return;
  try {
    const res = await fetchAPI(`/teachers/${teacherId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Teacher removed successfully', 'success');
      loadTeachersList();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete teacher: ' + err.message, 'error');
  }
}

// ================= SUBJECTS =================
async function loadSubjectsList() {
  const tbody = document.getElementById('subjectsTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading subjects...</td></tr>';

  try {
    const res = await fetchAPI('/subjects');
    if (res.success && res.data) {
      cachedSubjects = res.data;
      if (tbody) renderSubjectsTable(cachedSubjects);
      populateSubjectDropdowns(cachedSubjects);
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Failed to load subjects</td></tr>`;
  }
}

function renderSubjectsTable(subjects) {
  const tbody = document.getElementById('subjectsTableBody');
  if (!subjects || subjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No subjects found.</td></tr>';
    return;
  }

  tbody.innerHTML = subjects.map(s => `
    <tr>
      <td><strong>#${s.subjectId}</strong></td>
      <td><strong>${escapeHtml(s.subjectName)}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditSubjectModal(${s.subjectId}, '${escapeHtml(s.subjectName)}')">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSubject(${s.subjectId}, '${escapeHtml(s.subjectName)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function populateSubjectDropdowns(subjects) {
  const filterSub = document.getElementById('filterAttendanceSubject');
  const reportSub = document.getElementById('reportSubjectSelect');

  const options = '<option value="">All Subjects</option>' + subjects.map(s => `
    <option value="${s.subjectId}">${escapeHtml(s.subjectName)}</option>
  `).join('');

  if (filterSub) filterSub.innerHTML = options;
  if (reportSub) reportSub.innerHTML = options;
}

function openAddSubjectModal() {
  document.getElementById('modalSubjectTitle').textContent = 'Add New Subject';
  document.getElementById('subjectIdInput').value = '';
  document.getElementById('subjectNameInput').value = '';
  openModal('modalSubject');
}

function openEditSubjectModal(id, name) {
  document.getElementById('modalSubjectTitle').textContent = 'Edit Subject';
  document.getElementById('subjectIdInput').value = id;
  document.getElementById('subjectNameInput').value = name;
  openModal('modalSubject');
}

async function deleteSubject(subjectId, name) {
  if (!confirm(`Are you sure you want to delete subject "${name}"? This will delete all attendance records associated with it.`)) return;
  try {
    const res = await fetchAPI(`/subjects/${subjectId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Subject deleted successfully', 'success');
      loadSubjectsList();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete subject: ' + err.message, 'error');
  }
}

// ================= ATTENDANCE LOGS =================
async function loadAttendanceLogs() {
  const tbody = document.getElementById('attendanceLogsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading attendance logs...</td></tr>';

  try {
    const date = document.getElementById('filterAttendanceDate').value;
    const subjectId = document.getElementById('filterAttendanceSubject').value;

    let queryParts = [];
    if (date) queryParts.push(`date=${encodeURIComponent(date)}`);
    if (subjectId) queryParts.push(`subjectId=${encodeURIComponent(subjectId)}`);

    const qs = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    const res = await fetchAPI(`/attendance${qs}`);

    if (res.success && res.data) {
      renderAttendanceLogs(res.data);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Failed to load attendance logs: ${err.message}</td></tr>`;
  }
}

function renderAttendanceLogs(logs) {
  const tbody = document.getElementById('attendanceLogsTableBody');
  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No attendance records found for criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(r => {
    const badgeClass = r.status === 'Present' ? 'badge-present' : (r.status === 'Absent' ? 'badge-absent' : 'badge-late');
    return `
      <tr>
        <td>#${r.attendanceId}</td>
        <td><strong>${formatDate(r.attendanceDate)}</strong></td>
        <td>${escapeHtml(r.studentName)}</td>
        <td>${escapeHtml(r.subjectName)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openEditAttendanceModal(${r.attendanceId}, '${escapeHtml(r.studentName)}', '${escapeHtml(r.subjectName)}', '${r.attendanceDate}', '${r.status}')">Modify</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${r.attendanceId})">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function resetAttendanceFilter() {
  document.getElementById('filterAttendanceDate').value = '';
  document.getElementById('filterAttendanceSubject').value = '';
  loadAttendanceLogs();
}

function openEditAttendanceModal(id, studentName, subjectName, date, status) {
  document.getElementById('editAttendanceId').value = id;
  document.getElementById('editAttStudentName').textContent = studentName;
  document.getElementById('editAttSubjectName').textContent = subjectName;
  document.getElementById('editAttDate').textContent = formatDate(date);
  document.getElementById('editAttStatusSelect').value = status;
  openModal('modalEditAttendance');
}

async function deleteAttendance(id) {
  if (!confirm('Are you sure you want to delete this attendance record?')) return;
  try {
    const res = await fetchAPI(`/attendance/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Attendance record deleted', 'success');
      loadAttendanceLogs();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete attendance: ' + err.message, 'error');
  }
}

// ================= REPORTS =================
async function loadReports() {
  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Generating attendance report...</td></tr>';

  try {
    const subjectId = document.getElementById('reportSubjectSelect').value;
    const url = subjectId ? `/reports/subject?subjectId=${subjectId}` : '/reports/overall';
    const res = await fetchAPI(url);

    if (res.success && res.data) {
      renderReportsTable(res.data);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Failed to generate report: ${err.message}</td></tr>`;
  }
}

function renderReportsTable(records) {
  const tbody = document.getElementById('reportTableBody');
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No attendance data found to report.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(r => {
    const pct = r.percentage || 0;
    const isEligible = pct >= 75;
    const badge = isEligible 
      ? '<span class="badge badge-present">✓ Eligible</span>'
      : '<span class="badge badge-absent">⚠ Shortage</span>';
    const pClass = pct >= 75 ? 'progress-green' : (pct >= 60 ? 'progress-orange' : 'progress-red');

    return `
      <tr>
        <td>#${r.studentId}</td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td>${escapeHtml(r.course || '-')}</td>
        <td>${escapeHtml(r.subjectName || '-')}</td>
        <td><strong>${r.totalClasses}</strong></td>
        <td style="color: var(--success); font-weight:600;">${r.presentClasses}</td>
        <td style="color: var(--danger); font-weight:600;">${r.absentClasses}</td>
        <td style="min-width: 140px;">
          <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:4px;">
            <span>${pct}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${pClass}" style="width: ${Math.min(pct, 100)}%;"></div>
          </div>
        </td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

function exportReportCSV() {
  const table = document.getElementById('reportTable');
  let csv = [];
  for (let row of table.rows) {
    let cols = [];
    for (let cell of row.cells) {
      cols.push('"' + cell.innerText.replace(/"/g, '""').replace(/\n/g, ' ') + '"');
    }
    csv.push(cols.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Report CSV exported successfully!', 'success');
}

// ================= FORM LISTENERS =================
function initFormListeners() {
  // Student Search live debounce
  const searchInput = document.getElementById('studentSearchInput');
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStudentsList, 300);
  });

  // Student form submit
  document.getElementById('formStudent').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('studentIdInput').value;
    const body = {
      name: document.getElementById('studentNameInput').value.trim(),
      email: document.getElementById('studentEmailInput').value.trim(),
      course: document.getElementById('studentCourseInput').value.trim(),
      semester: parseInt(document.getElementById('studentSemesterInput').value),
      username: document.getElementById('studentUsernameInput').value.trim(),
      password: document.getElementById('studentPasswordInput').value
    };

    try {
      const isEdit = !!id;
      const url = isEdit ? `/students/${id}` : '/students';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchAPI(url, { method, body });

      if (res.success) {
        showToast(isEdit ? 'Student updated!' : 'Student registered!', 'success');
        closeModal('modalStudent');
        loadStudentsList();
        loadDashboardStats();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Teacher form submit
  document.getElementById('formTeacher').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('teacherIdInput').value;
    const body = {
      name: document.getElementById('teacherNameInput').value.trim(),
      email: document.getElementById('teacherEmailInput').value.trim(),
      username: document.getElementById('teacherUsernameInput').value.trim(),
      password: document.getElementById('teacherPasswordInput').value
    };

    try {
      const isEdit = !!id;
      const url = isEdit ? `/teachers/${id}` : '/teachers';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchAPI(url, { method, body });

      if (res.success) {
        showToast(isEdit ? 'Teacher updated!' : 'Teacher added!', 'success');
        closeModal('modalTeacher');
        loadTeachersList();
        loadDashboardStats();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Subject form submit
  document.getElementById('formSubject').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('subjectIdInput').value;
    const body = {
      subjectName: document.getElementById('subjectNameInput').value.trim()
    };

    try {
      const isEdit = !!id;
      const url = isEdit ? `/subjects/${id}` : '/subjects';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchAPI(url, { method, body });

      if (res.success) {
        showToast(isEdit ? 'Subject updated!' : 'Subject added!', 'success');
        closeModal('modalSubject');
        loadSubjectsList();
        loadDashboardStats();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Attendance Edit submit
  document.getElementById('formEditAttendance').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editAttendanceId').value;
    const status = document.getElementById('editAttStatusSelect').value;

    try {
      const res = await fetchAPI(`/attendance/${id}`, {
        method: 'PUT',
        body: { status }
      });
      if (res.success) {
        showToast('Attendance status updated!', 'success');
        closeModal('modalEditAttendance');
        loadAttendanceLogs();
        loadDashboardStats();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Change Password
  document.getElementById('formChangePassword').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPasswordInput').value;
    const confirmPass = document.getElementById('confirmPasswordInput').value;

    if (newPass !== confirmPass) {
      showToast('Passwords do not match!', 'warning');
      return;
    }

    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'POST',
        body: {
          role: 'admin',
          userId: currentAdmin.id,
          newPassword: newPass
        }
      });
      if (res.success) {
        showToast('Password changed successfully!', 'success');
        closeModal('modalChangePassword');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
