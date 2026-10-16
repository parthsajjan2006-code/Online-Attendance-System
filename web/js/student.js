/**
 * Online SAMS - Student Portal Controller
 */

let currentStudent = null;
let allStudentLogs = [];

document.addEventListener('DOMContentLoaded', () => {
  currentStudent = requireAuth(['student']);
  if (!currentStudent) return;

  // Set user display
  document.getElementById('studentName').textContent = currentStudent.name || currentStudent.username;
  document.getElementById('studentAvatar').textContent = (currentStudent.name || 'ST').substring(0, 2).toUpperCase();
  document.getElementById('welcomeGreeting').textContent = `Welcome back, ${currentStudent.name || currentStudent.username}!`;

  const metaText = `Roll ID: #${currentStudent.id} • ${currentStudent.course || 'B.Sc CS'} • Semester ${currentStudent.semester || 1}`;
  document.getElementById('studentInfoSubtext').textContent = metaText;
  document.getElementById('studentCourseSem').textContent = `${currentStudent.course || ''} • Sem ${currentStudent.semester || 1}`;

  initNavigation();
  loadStudentDashboard();
  loadHistoryLogs();
  initFormListeners();
});

// ================= NAVIGATION =================
function initNavigation() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
      document.getElementById('pageTitle').textContent = tab === 'overview' ? 'My Attendance Dashboard' : 'My Daily Attendance History';
    });
  });
}

// ================= STUDENT DASHBOARD =================
async function loadStudentDashboard() {
  try {
    const res = await fetchAPI(`/reports/student?studentId=${currentStudent.id}`);
    if (res.success && res.data) {
      const { overview, breakdown } = res.data;

      const totalHeld = overview.totalClasses || 0;
      const attended = overview.presentClasses || 0;
      const missed = overview.absentClasses || 0;
      const overallPct = overview.percentage || 0;

      document.getElementById('statTotalHeld').textContent = totalHeld;
      document.getElementById('statAttended').textContent = attended;
      document.getElementById('statMissed').textContent = missed;
      document.getElementById('overallPct').textContent = `${overallPct}%`;

      const eligibilityEl = document.getElementById('statEligibility');
      const shortageAlert = document.getElementById('shortageAlert');

      if (overallPct >= 75) {
        eligibilityEl.innerHTML = '<span style="color:var(--success);">✓ Eligible</span>';
        shortageAlert.style.display = 'none';
      } else {
        eligibilityEl.innerHTML = '<span style="color:var(--danger);">⚠ Shortage</span>';
        shortageAlert.style.display = 'flex';
      }

      renderSubjectCards(breakdown || []);
      populateSubjectFilter(breakdown || []);
    }
  } catch (err) {
    showToast('Failed to load dashboard data: ' + err.message, 'error');
  }
}

function renderSubjectCards(subjects) {
  const container = document.getElementById('subjectCardsContainer');
  if (!subjects || subjects.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray-400);">No subject records found yet.</div>';
    return;
  }

  container.innerHTML = subjects.map(s => {
    const total = s.totalClasses || 0;
    const present = s.presentClasses || 0;
    const pct = s.percentage || 0;
    const pClass = pct >= 75 ? 'progress-green' : (pct >= 60 ? 'progress-orange' : 'progress-red');

    // Attendance advice / target calculation
    let adviceHtml = '';
    if (total === 0) {
      adviceHtml = '<span style="color: var(--gray-400);">No classes held yet.</span>';
    } else if (pct < 75) {
      const needed = Math.max(1, Math.ceil(3 * total - 4 * present));
      adviceHtml = `<span style="color: var(--danger); font-weight:600;">🎯 Need to attend next <strong>${needed}</strong> consecutive classes to reach 75%.</span>`;
    } else {
      const canMiss = Math.max(0, Math.floor((4 * present - 3 * total) / 3));
      adviceHtml = `<span style="color: var(--success); font-weight:600;">🛡️ Safe margin: Can miss up to <strong>${canMiss}</strong> classes and stay &ge; 75%.</span>`;
    }

    return `
      <div class="subject-card">
        <div class="subject-card-header">
          <div class="subject-card-title">${escapeHtml(s.subjectName)}</div>
          <span class="badge ${pct >= 75 ? 'badge-present' : 'badge-absent'}">${pct}%</span>
        </div>

        <div class="subject-stat-numbers">
          <span>Attended: <strong>${present} / ${total}</strong></span>
          <span>Missed: <strong>${s.absentClasses || 0}</strong></span>
        </div>

        <div class="progress-bar-bg" style="margin-bottom: 14px;">
          <div class="progress-bar-fill ${pClass}" style="width: ${Math.min(pct, 100)}%;"></div>
        </div>

        <div style="font-size: 0.8rem; background: var(--gray-50); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          ${adviceHtml}
        </div>
      </div>
    `;
  }).join('');
}

function populateSubjectFilter(subjects) {
  const select = document.getElementById('historySubjectFilter');
  select.innerHTML = '<option value="">All Subjects</option>' + subjects.map(s => `
    <option value="${s.subjectId}">${escapeHtml(s.subjectName)}</option>
  `).join('');
}

// ================= HISTORY LOGS =================
async function loadHistoryLogs() {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading attendance logs...</td></tr>';

  try {
    const subjectId = document.getElementById('historySubjectFilter').value;
    let url = `/attendance?studentId=${currentStudent.id}`;
    if (subjectId) url += `&subjectId=${subjectId}`;

    const res = await fetchAPI(url);
    if (res.success && res.data) {
      allStudentLogs = res.data;
      renderHistoryTable(allStudentLogs);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Failed to load logs: ${err.message}</td></tr>`;
  }
}

function renderHistoryTable(logs) {
  const tbody = document.getElementById('historyTableBody');
  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No attendance logs found for this filter.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const badgeClass = l.status === 'Present' ? 'badge-present' : (l.status === 'Absent' ? 'badge-absent' : 'badge-late');
    return `
      <tr>
        <td><strong>${formatDate(l.attendanceDate)}</strong></td>
        <td>${escapeHtml(l.subjectName)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(l.status)}</span></td>
      </tr>
    `;
  }).join('');
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
          role: 'student',
          userId: currentStudent.id,
          newPassword: newPass
        }
      });
      if (res.success) {
        showToast('Password updated successfully!', 'success');
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
