/**
 * Online SAMS - Login Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const existingUser = getSession();
  if (existingUser) {
    redirectUser(existingUser.role);
    return;
  }

  const roleTabs = document.querySelectorAll('.role-tab');
  const roleInput = document.getElementById('loginRole');
  const usernameLabel = document.getElementById('usernameLabel');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitLoginBtn');

  // Role switching
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.dataset.role;
      roleInput.value = role;

      if (role === 'admin') {
        usernameLabel.textContent = 'Admin Username';
        usernameInput.placeholder = 'Enter admin username (e.g. admin)';
      } else if (role === 'teacher') {
        usernameLabel.textContent = 'Teacher Username';
        usernameInput.placeholder = 'Enter teacher username (e.g. Nikhil)';
      } else {
        usernameLabel.textContent = 'Student Username';
        usernameInput.placeholder = 'Enter student username (e.g. parth)';
      }
    });
  });

  // Password visibility toggle
  togglePassBtn.addEventListener('click', () => {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    togglePassBtn.textContent = isPass ? '🙈' : '👁️';
  });

  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = roleInput.value;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Signing in...</span>`;

    try {
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: { role, username, password }
      });

      if (res.success && res.data) {
        showToast('Login successful! Redirecting...', 'success');
        saveSession(res.data);
        setTimeout(() => {
          redirectUser(res.data.role);
        }, 600);
      } else {
        showToast(res.error || 'Login failed', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In</span> <span>➔</span>`;
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please verify credentials.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span> <span>➔</span>`;
    }
  });
});

function fillDemoCredentials(role, username, password) {
  const tab = document.querySelector(`.role-tab[data-role="${role}"]`);
  if (tab) tab.click();

  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
  showToast(`Auto-filled ${role} credentials! Click Sign In.`, 'info');
}

function redirectUser(role) {
  if (role === 'admin') {
    window.location.href = 'admin.html';
  } else if (role === 'teacher') {
    window.location.href = 'teacher.html';
  } else if (role === 'student') {
    window.location.href = 'student.html';
  }
}
