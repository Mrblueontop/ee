const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL';

document.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('auth-container');
  const dashboard = document.getElementById('dashboard');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');

  checkAuth();

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tab = btn.dataset.tab;
      loginForm.classList.remove('active');
      registerForm.classList.remove('active');
      
      if (tab === 'login') loginForm.classList.add('active');
      if (tab === 'register') registerForm.classList.add('active');
    });
  });

  document.getElementById('send-login-code').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    if (!email) {
      showMessage('login-message', 'Please enter your email first', false);
      return;
    }
    await sendCode(email, 'login', 'login-message');
  });

  document.getElementById('send-register-code').addEventListener('click', async () => {
    const email = document.getElementById('register-email').value;
    if (!email) {
      showMessage('register-message', 'Please enter your email first', false);
      return;
    }
    await sendCode(email, 'register', 'register-message');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const code = document.getElementById('login-code').value;
    
    try {
      const res = await fetch(`${WORKER_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'login' })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify({ email }));
        checkAuth();
      } else {
        showMessage('login-message', data.error || 'Invalid code', false);
      }
    } catch (err) {
      showMessage('login-message', 'Network error', false);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const code = document.getElementById('register-code').value;
    
    try {
      const res = await fetch(`${WORKER_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, code })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify({ email, name }));
        checkAuth();
      } else {
        showMessage('register-message', data.error || 'Registration failed', false);
      }
    } catch (err) {
      showMessage('register-message', 'Network error', false);
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    checkAuth();
  });

  async function sendCode(email, type, messageId) {
    try {
      const res = await fetch(`${WORKER_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });
      const data = await res.json();
      showMessage(messageId, data.message || 'Code sent to your email', res.ok);
    } catch (err) {
      showMessage(messageId, 'Failed to send code', false);
    }
  }

  function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      document.getElementById('user-name').textContent = userData.name || userData.email;
      authContainer.classList.add('hidden');
      dashboard.classList.remove('hidden');
    } else {
      authContainer.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  }

  function showMessage(id, msg, success) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = 'message ' + (success ? 'success' : 'error');
  }
});
