/**
 * Online SAMS - Teacher Portal Controller
 */

let currentTeacher = null;
let cachedSubjects = [];
let classStudents = [];
let attendanceState = {}; // { studentId: "Present" | "Absent" | "Late" }

document.addEventListener('DOMContentLoaded', () => {
  currentTeacher = requireAuth(['teacher']);
  if (!currentTeacher) return;

  // Set teacher display
  document.getElementById('teacherName').textContent = currentTeacher.name || currentTeacher.username;
  document.getElementById('teacherAvatar').textContent = (currentTeacher.name || 'TC').substring(0, 2).toUpperCase();

  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('takeDateInput').value = today;
  document.getElementById('modifyDateInput').value = today;

  initNavigation();
  loadSubjects();
  initFormListeners();
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
    'take-attendance': 'Mark Student Attendance',
    'modify-attendance': 'Modify Past Attendance',
    'reports': 'Subject Attendance Analytics'
  };
  document.getElementById('pageTitle').textContent = titles[tabId] || 'Faculty Portal';

  if (tabId === 'modify-attendance') loadModifyRecords();
  else if (tabId === 'reports') loadTeacherReports();
}

// ================= SUBJECTS =================
async function loadSubjects() {
  try {
    const res = await fetchAPI('/subjects');
    if (res.success && res.data) {
      cachedSubjects = res.data;
      const opts = cachedSubjects.map(s => `<option value="${s.subjectId}">${escapeHtml(s.subjectName)}</option>`).join('');

      document.getElementById('takeSubjectSelect').innerHTML = '<option value="">Select Subject</option>' + opts;
      document.getElementById('modifySubjectSelect').innerHTML = '<option value="">All Subjects</option>' + opts;
      document.getElementById('reportSubjectSelect').innerHTML = '<option value="">All Subjects</option>' + opts;
    }
  } catch (err) {
    showToast('Failed to load subjects', 'error');
  }
}

// ================= MARK ATTENDANCE =================
async function loadClassStudents() {
  const subjectId = document.getElementById('takeSubjectSelect').value;
  const date = document.getElementById('takeDateInput').value;

  if (!subjectId) {
    showToast('Please select a subject first', 'warning');
    return;
  }
  if (!date) {
    showToast('Please choose an attendance date', 'warning');
    return;
  }

  const container = document.getElementById('attendanceSheetList');
  container.innerHTML = '<div style="text-align: center; padding: 30px;">Loading student roster...</div>';

  try {
    // 1. Get all students
    const resStudents = await fetchAPI('/students');
    classStudents = resStudents.data || [];

    if (classStudents.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 30px;">No students enrolled yet.</div>';
      return;
    }

    // 2. Check if already marked for this date and subject
    const resExisting = await fetchAPI(`/attendance?date=${encodeURIComponent(date)}&subjectId=${subjectId}`);
    const existingRecords = resExisting.data || [];
    const existingMap = {};
    existingRecords.forEach(r => {
      existingMap[r.studentId] = r.status;
    });

    // Initialize state (use existing if marked, else default to 'Present')
    attendanceState = {};
    classStudents.forEach(s => {
      attendanceState[s.studentId] = existingMap[s.studentId] || 'Present';
    });

    renderAttendanceSheet();
    document.getElementById('sheetStatsPills').style.display = 'flex';
    document.getElementById('btnSubmitAttendance').disabled = false;

    if (existingRecords.length > 0) {
      showToast(`Loaded existing attendance record for ${existingRecords.length} students.`, 'info');
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; color:red;">Error: ${err.message}</div>`;
  }
}

function renderAttendanceSheet() {
  const container = document.getElementById('attendanceSheetList');
  if (classStudents.length === 0) return;

  container.innerHTML = classStudents.map(s => {
    const currentStatus = attendanceState[s.studentId] || 'Present';
    return `
      <div class="student-attendance-row" id="row-${s.studentId}">
        <div class="student-info-cell">
          <span class="student-roll">#${s.studentId}</span>
          <div>
            <div class="student-name-text">${escapeHtml(s.name)}</div>
            <div class="student-course-text">${escapeHtml(s.course || '')} • Sem ${s.semester || 1}</div>
          </div>
        </div>

        <div class="attendance-toggle-group">
          <button type="button" class="toggle-att-btn ${currentStatus === 'Present' ? 'active-present' : ''}" 
                  onclick="setStudentStatus(${s.studentId}, 'Present')">
            ✓ Present
          </button>
          <button type="button" class="toggle-att-btn ${currentStatus === 'Absent' ? 'active-absent' : ''}" 
                  onclick="setStudentStatus(${s.studentId}, 'Absent')">
            ✕ Absent
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateSheetCounters();
}

function setStudentStatus(studentId, status) {
  attendanceState[studentId] = status;
  const row = document.getElementById(`row-${studentId}`);
  if (row) {
    const btns = row.querySelectorAll('.toggle-att-btn');
    btns[0].classList.toggle('active-present', status === 'Present');
    btns[1].classList.toggle('active-absent', status === 'Absent');
  }
  updateSheetCounters();
}

function markAllStatus(status) {
  classStudents.forEach(s => {
    attendanceState[s.studentId] = status;
  });
  renderAttendanceSheet();
  showToast(`Marked all students as ${status}`, 'info');
}

function updateSheetCounters() {
  const total = classStudents.length;
  let present = 0;
  let absent = 0;

  for (const sId in attendanceState) {
    if (attendanceState[sId] === 'Present') present++;
    else if (attendanceState[sId] === 'Absent') absent++;
  }

  document.getElementById('sheetTotalCount').textContent = total;
  document.getElementById('sheetPresentCount').textContent = present;
  document.getElementById('sheetAbsentCount').textContent = absent;
}

async function submitAttendanceBatch() {
  const subjectId = parseInt(document.getElementById('takeSubjectSelect').value);
  const date = document.getElementById('takeDateInput').value;

  if (!subjectId || !date) {
    showToast('Subject and date are required', 'warning');
    return;
  }

  const btn = document.getElementById('btnSubmitAttendance');
  btn.disabled = true;
  btn.innerHTML = 'Saving...';

  const records = Object.keys(attendanceState).map(studentId => ({
    studentId: parseInt(studentId),
    status: attendanceState[studentId]
  }));

  try {
    const res = await fetchAPI('/attendance/bulk', {
      method: 'POST',
      body: {
        subjectId,
        attendanceDate: date,
        records
      }
    });

    if (res.success) {
      showToast(`Attendance saved successfully for ${records.length} students!`, 'success');
    }
  } catch (err) {
    showToast('Failed to save attendance: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Save Attendance Record';
  }
}

// ================= MODIFY ATTENDANCE =================
async function loadModifyRecords() {
  const tbody = document.getElementById('modifyTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Searching records...</td></tr>';

  const date = document.getElementById('modifyDateInput').value;
  const subjectId = document.getElementById('modifySubjectSelect').value;

  let queryParts = [];
  if (date) queryParts.push(`date=${encodeURIComponent(date)}`);
  if (subjectId) queryParts.push(`subjectId=${encodeURIComponent(subjectId)}`);

  const qs = queryParts.length > 0 ? '?' + queryParts.join('&') : '';

  try {
    const res = await fetchAPI(`/attendance${qs}`);
    if (res.success && res.data) {
      renderModifyTable(res.data);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}

function renderModifyTable(records) {
  const tbody = document.getElementById('modifyTableBody');
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No attendance records found.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(r => {
    const badgeClass = r.status === 'Present' ? 'badge-present' : 'badge-absent';
    const otherStatus = r.status === 'Present' ? 'Absent' : 'Present';
    return `
      <tr>
        <td>#${r.attendanceId}</td>
        <td><strong>${formatDate(r.attendanceDate)}</strong></td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td>${escapeHtml(r.subjectName)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="quickSwitchStatus(${r.attendanceId}, '${otherStatus}')">
            Set as ${otherStatus}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function quickSwitchStatus(attendanceId, newStatus) {
  try {
    const res = await fetchAPI(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: { status: newStatus }
    });
    if (res.success) {
      showToast(`Updated to ${newStatus}`, 'success');
      loadModifyRecords();
    }
  } catch (err) {
    showToast('Failed to update: ' + err.message, 'error');
  }
}

// ================= REPORTS =================
async function loadTeacherReports() {
  const tbody = document.getElementById('teacherReportTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Generating report...</td></tr>';

  try {
    const subjectId = document.getElementById('reportSubjectSelect').value;
    const url = subjectId ? `/reports/subject?subjectId=${subjectId}` : '/reports/overall';
    const res = await fetchAPI(url);

    if (res.success && res.data) {
      renderTeacherReportsTable(res.data);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}

function renderTeacherReportsTable(records) {
  const tbody = document.getElementById('teacherReportTableBody');
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No attendance data found.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(r => {
    const pct = r.percentage || 0;
    const isShortage = pct < 75;
    const badge = isShortage 
      ? '<span class="badge badge-absent">⚠ &lt; 75% Shortage</span>'
      : '<span class="badge badge-present">✓ Good</span>';
    const pClass = pct >= 75 ? 'progress-green' : (pct >= 60 ? 'progress-orange' : 'progress-red');

    return `
      <tr>
        <td>#${r.studentId}</td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td>${escapeHtml(r.course || '-')}</td>
        <td>${escapeHtml(r.subjectName || '-')}</td>
        <td><strong>${r.totalClasses}</strong></td>
        <td style="color:var(--success); font-weight:600;">${r.presentClasses}</td>
        <td style="color:var(--danger); font-weight:600;">${r.absentClasses}</td>
        <td style="min-width: 130px;">
          <div style="font-weight:700; margin-bottom:4px;">${pct}%</div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${pClass}" style="width: ${Math.min(pct, 100)}%;"></div>
          </div>
        </td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

function exportTeacherCSV() {
  const table = document.getElementById('teacherReportTable');
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
  a.download = `Faculty_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Report CSV downloaded!', 'success');
}

// ================= FORM LISTENERS =================
function initFormListeners() {
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
          role: 'teacher',
          userId: currentTeacher.id,
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
