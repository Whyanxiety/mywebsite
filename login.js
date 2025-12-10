// login.js — auth через Worker API

const btnSignIn = document.getElementById('btnSignIn');
const btnSignUp = document.getElementById('btnSignUp');
const nameField = document.getElementById('nameField');
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const errorEl = document.getElementById('error');

let mode = 'signin'; // or 'signup'

btnSignIn && btnSignIn.addEventListener('click', () => setMode('signin'));
btnSignUp && btnSignUp.addEventListener('click', () => setMode('signup'));

function setMode(m) {
  mode = m;
  if (m === 'signin') {
    btnSignIn && btnSignIn.classList.add('active');
    btnSignUp && btnSignUp.classList.remove('active');
    nameField && nameField.classList.add('hidden');
    submitBtn && (submitBtn.textContent = 'Войти');
  } else {
    btnSignUp && btnSignUp.classList.add('active');
    btnSignIn && btnSignIn.classList.remove('active');
    nameField && nameField.classList.remove('hidden');
    submitBtn && (submitBtn.textContent = 'Зарегистрироваться');
  }
  errorEl && (errorEl.textContent = '');
}

function setCurrentUser(u) {
  localStorage.setItem('currentUser', JSON.stringify(u));
}

authForm && authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const name = (document.getElementById('name') && document.getElementById('name').value.trim()) || '';

  if (!email || !password) {
    errorEl.textContent = 'Заполните email и пароль';
    return;
  }

  // basic validations
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.textContent = 'Неверный формат email';
    return;
  }
  if (mode === 'signup' && password.length < 6) {
    errorEl.textContent = 'Пароль должен быть не менее 6 символов';
    return;
  }

  try {
    if (mode === 'signin') {
      const res = await fetch('https://solitary-waterfall-406d.flarpzflarpz2255.workers.dev/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();
      if (!res.ok) { errorEl.textContent = data.error || 'Ошибка'; return; }

      setCurrentUser({ user_id: data.user_id, email, name: data.name || '' });
      window.location.href = 'index.html';
    } else {
      const res = await fetch('https://solitary-waterfall-406d.flarpzflarpz2255.workers.dev/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, name })
      });
      const data = await res.json();
      if (!res.ok) { errorEl.textContent = data.error || 'Ошибка'; return; }

      setCurrentUser({ user_id: data.user_id, email, name });
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Произошла ошибка';
  }
});

// default
setMode('signin');
