// app.js — локальная версия (localStorage, без API)
const listEl = document.getElementById('list');
const addBtn = document.getElementById('addBtn');
const authBtn = document.getElementById('authBtn');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const recipeForm = document.getElementById('recipeForm');
const modalTitle = document.getElementById('modalTitle');
const cardTemplate = document.getElementById('cardTemplate');
const previewImg = document.getElementById('preview');
const customImage = document.getElementById('customImage');

let recipes = [];
let currentUser = null; // { email, name }

// ---------- Helpers: localStorage ----------
function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]'); }
  catch { return []; }
}
function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }

function getRecipes() {
  try { return JSON.parse(localStorage.getItem('recipes') || '[]'); }
  catch { return []; }
}
function saveRecipes(r){ localStorage.setItem('recipes', JSON.stringify(r)); }

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
  catch { return null; }
}
function setCurrentUser(u) { if (u) localStorage.setItem('currentUser', JSON.stringify(u)); else localStorage.removeItem('currentUser'); }

// ---------- UI / Auth ----------
function updateAuthUI() {
  currentUser = getCurrentUser();
  if (currentUser) {
    authBtn.textContent = 'Выйти';
    addBtn.style.display = 'inline-block';
  } else {
    authBtn.textContent = 'Войти / Зарегистрироваться';
    addBtn.style.display = 'none';
  }
}

// auth button behavior
authBtn.onclick = () => {
  if (currentUser) {
    if (confirm('Выйти?')) {
      setCurrentUser(null);
      currentUser = null;
      updateAuthUI();
      renderList(searchInput.value);
    }
  } else {
    window.location.href = 'login.html';
  }
};

// ---------- Load / Render ----------
function loadRecipes() {
  recipes = getRecipes();
  renderList(searchInput.value);
}

function renderList(filter = '') {
  listEl.innerHTML = '';
  const q = filter.trim().toLowerCase();
  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.ingredients.join(' ').toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    listEl.innerHTML = '<p style="color:#fff;text-align:center;">Нет рецептов...</p>';
    return;
  }

  filtered.forEach(r => {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector('.card');
    card.querySelector('.card-img').src = r.image || 'images/card.png';
    card.querySelector('.card-title').textContent = r.title;
    card.querySelector('.card-ingredients').textContent = r.ingredients.slice(0, 3).join(', ');

    const viewBtn = card.querySelector('.view');
    const editBtn = card.querySelector('.edit');
    const delBtn = card.querySelector('.delete');
    const actions = card.querySelector('.card-actions');

    const isOwner = currentUser && currentUser.email === r.ownerEmail;

    if (!isOwner) {
      editBtn.style.display = 'none';
      delBtn.style.display = 'none';
      actions.classList.add('full');
    } else {
      editBtn.style.display = '';
      delBtn.style.display = '';
      actions.classList.remove('full');
    }

    viewBtn.onclick = () => openViewModal(r);
    editBtn.onclick = () => openModal(true, r);
    delBtn.onclick = () => {
      if (!confirm(`Удалить рецепт "${r.title}"?`)) return;
      recipes = recipes.filter(x => x.id !== r.id);
      saveRecipes(recipes);
      loadRecipes();
    };

    listEl.appendChild(node);
  });
}

// ---------- Modal / Form ----------
customImage && customImage.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => (previewImg.src = ev.target.result);
  reader.readAsDataURL(file);
});

function openModal(forEdit=false, recipe=null) {
  currentUser = getCurrentUser();
  if (!currentUser) { window.location.href = 'login.html'; return; }
  modal.classList.remove('hidden');
  recipeForm.reset();
  document.getElementById('recipeId').value = '';
  if (forEdit && recipe) {
    modalTitle.textContent = 'Редактировать рецепт';
    document.getElementById('recipeId').value = recipe.id;
    document.getElementById('title').value = recipe.title;
    document.getElementById('ingredients').value = recipe.ingredients.join('\n');
    document.getElementById('steps').value = recipe.steps;
    previewImg.src = recipe.image || 'images/card.png';
  } else {
    modalTitle.textContent = 'Новый рецепт';
    previewImg.src = 'images/card.png';
  }
}
function closeModalFn() { modal.classList.add('hidden'); }

function openViewModal(recipe) {
  // простое модальное окно через alert — можно заменить на красивое окно
  alert(`🍴 ${recipe.title}\n\nИнгредиенты:\n${recipe.ingredients.join(', ')}\n\nИнструкция:\n${recipe.steps}`);
}

// submit recipe
recipeForm.addEventListener('submit', e => {
  e.preventDefault();
  currentUser = getCurrentUser();
  if (!currentUser) { window.location.href = 'login.html'; return; }

  const id = document.getElementById('recipeId').value;
  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
  const steps = document.getElementById('steps').value.trim();
  const image = previewImg.src;

  if (!title) return alert('Введите название рецепта');

  if (id) {
    // edit
    const idx = recipes.findIndex(r => r.id === id);
    if (idx === -1) return alert('Рецепт не найден');
    // ownership check
    if (recipes[idx].ownerEmail !== currentUser.email) return alert('Нет прав редактировать');
    recipes[idx] = { ...recipes[idx], title, ingredients, steps, image, updatedAt: Date.now() };
  } else {
    // create
    const newRecipe = {
      id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8),
      title,
      ingredients,
      steps,
      image,
      ownerEmail: currentUser.email,
      ownerName: currentUser.name || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    recipes.unshift(newRecipe); // newest first
  }

  saveRecipes(recipes);
  loadRecipes();
  closeModalFn();
});

// handlers
addBtn.onclick = () => openModal();
closeModal.onclick = closeModalFn;
cancelBtn.onclick = closeModalFn;
searchInput.oninput = () => renderList(searchInput.value);

// initial load
(function init(){
  updateAuthUI();
  loadRecipes();
})();
