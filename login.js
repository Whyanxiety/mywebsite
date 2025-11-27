// login.js
const apiBase = '/api';
const btnSignIn = document.getElementById('btnSignIn');
const btnSignUp = document.getElementById('btnSignUp');
const nameField = document.getElementById('nameField');
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const errorEl = document.getElementById('error');

let mode = 'signin'; // or 'signup'

btnSignIn.addEventListener('click', () => setMode('signin'));
btnSignUp.addEventListener('click', () => setMode('signup'));

function setMode(m) {
  mode = m;
  if (m === 'signin') {
    btnSignIn.classList.add('active');
    btnSignUp.classList.remove('active');
    nameField.classList.add('hidden');
    submitBtn.textContent = 'Войти';
  } else {
    btnSignUp.classList.add('active');
    btnSignIn.classList.remove('active');
    nameField.classList.remove('hidden');
    submitBtn.textContent = 'Зарегистрироваться';
  }
  errorEl.textContent = '';
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value.trim();

  if (!email || !password) {
    errorEl.textContent = 'Заполните email и пароль';
    return;
  }

  try {
    if (mode === 'signin') {
      const res = await fetch(apiBase + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      localStorage.setItem('token', data.token);
      // redirect to index where user will be already authenticated
      window.location.href = 'index.html';
    } else {
      const res = await fetch(apiBase + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
      localStorage.setItem('token', data.token);
      window.location.href = 'index.html';
    }
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// initialize default
setMode('signin');
