const btnSignIn = document.getElementById('btnSignIn');
const btnSignUp = document.getElementById('btnSignUp');
const nameField = document.getElementById('nameField');
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const errorEl = document.getElementById('error');

let mode = 'signin';

btnSignIn && btnSignIn.addEventListener('click', () => setMode('signin'));
btnSignUp && btnSignUp.addEventListener('click', () => setMode('signup'));

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

function setCurrentUser(u) {
  localStorage.setItem('currentUser', JSON.stringify(u));
}

authForm.addEventListener('submit', async e => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const name = (document.getElementById('name')?.value.trim()) || '';

  if (!email || !password) { errorEl.textContent = 'Заполните email и пароль'; return; }

  try {
    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setCurrentUser({ user_id: data.user.id, email, name: data.user.user_metadata?.name || '' });
      window.location.href = 'index.html';
    } else {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { name } } 
      });
      if (error) throw error;
      setCurrentUser({ user_id: data.user.id, email, name });
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message;
  }
});

setMode('signin');
