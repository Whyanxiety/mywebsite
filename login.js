// login.js — локальная auth (localStorage) с SHA-256 хешем пароля

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

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]'); }
  catch { return []; }
}
function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }

function setCurrentUser(u) { localStorage.setItem('currentUser', JSON.stringify(u)); }

// SHA-256 helper
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
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

  const users = getUsers();

  try {
    if (mode === 'signin') {
      const user = users.find(u => u.email === email);
      if (!user) { errorEl.textContent = 'Пользователь не найден'; return; }
      const hash = await hashPassword(password);
      if (hash !== user.passwordHash) { errorEl.textContent = 'Неверный пароль'; return; }
      // success
      setCurrentUser({ email: user.email, name: user.name });
      window.location.href = 'index.html';
    } else {
      // register
      if (users.some(u => u.email === email)) { errorEl.textContent = 'Email уже зарегистрирован'; return; }
      const hash = await hashPassword(password);
      const newUser = { email, name, passwordHash: hash, createdAt: Date.now() };
      users.push(newUser);
      saveUsers(users);
      setCurrentUser({ email: newUser.email, name: newUser.name });
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Произошла ошибка';
  }
});

// default
setMode('signin');
