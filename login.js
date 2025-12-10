const btnSignIn = document.getElementById("btnSignIn");
const btnSignUp = document.getElementById("btnSignUp");
const nameField = document.getElementById("nameField");
const submitBtn = document.getElementById("submitBtn");
const form = document.getElementById("authForm");
const errorBox = document.getElementById("error");

let mode = "login";

btnSignIn.onclick = () => {
  mode = "login";
  btnSignIn.classList.add("active");
  btnSignUp.classList.remove("active");
  nameField.classList.add("hidden");
  submitBtn.textContent = "Войти";
  errorBox.textContent = "";
};

btnSignUp.onclick = () => {
  mode = "register";
  btnSignUp.classList.add("active");
  btnSignIn.classList.remove("active");
  nameField.classList.remove("hidden");
  submitBtn.textContent = "Создать аккаунт";
  errorBox.textContent = "";
};

form.onsubmit = async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const name = document.getElementById("name").value.trim();

  if (!email || !pass) {
    errorBox.textContent = "Заполните email и пароль";
    return;
  }

  try {
    if (mode === "register") {
      const { data, error } = await window.supabase.auth.signUp({
        email: email,
        password: pass,
        options: { data: { name: name || "" } }
      });
      if (error) throw error;
      alert("Аккаунт создан! Теперь войдите.");
      btnSignIn.click();
    }

    if (mode === "login") {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: pass
      });
      if (error) throw error;
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error(err);
    errorBox.textContent = err.message || "Ошибка";
  }
};
