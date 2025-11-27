// app.js
const API = '/api';
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
let currentUser = null;

// util: get token
function getToken() { return localStorage.getItem('token'); }
function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

async function fetchUser() {
  const token = getToken();
  if (!token) { currentUser = null; updateAuthUI(); return; }
  try {
    const res = await fetch(API + '/me', { headers: authHeaders() });
    if (!res.ok) throw new Error('not auth');
    currentUser = await res.json();
  } catch {
    currentUser = null;
    localStorage.removeItem('token');
  }
  updateAuthUI();
}

function updateAuthUI() {
  if (currentUser) {
    authBtn.textContent = 'Выйти';
    addBtn.style.display = 'inline-block';
  } else {
    authBtn.textContent = 'Войти / Зарегистрироваться';
    addBtn.style.display = 'none';
  }
}

// Fetch recipes from server
async function loadRecipes() {
  try {
    const res = await fetch(API + '/recipes');
    recipes = await res.json();
    renderList(searchInput.value);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p style="color:#fff;text-align:center;">Не удалось загрузить рецепты</p>';
  }
}

// render list
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

    // ownership check
    const isOwner = currentUser && currentUser.id === r.ownerId;

    if (!isOwner) {
      // hide edit/delete, show large view
      editBtn.style.display = 'none';
      delBtn.style.display = 'none';
      actions.classList.add('full');
      viewBtn.onclick = () => {
        openViewModal(r);
      };
    } else {
      // owner: show edit/delete and small view
      actions.classList.remove('full');
      viewBtn.onclick = () => {
        openViewModal(r);
      };
      editBtn.onclick = () => openModal(true, r);
      delBtn.onclick = async () => {
        if (!confirm(`Удалить рецепт "${r.title}"?`)) return;
        try {
          const res = await fetch(`${API}/recipes/${r.id}`, {
            method: 'DELETE',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' }
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Ошибка удаления');
          }
          await loadRecipes();
        } catch (err) {
          alert(err.message || 'Ошибка');
        }
      };
    }

    listEl.appendChild(node);
  });
}

// preview image picker
customImage && customImage.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => (previewImg.src = ev.target.result);
  reader.readAsDataURL(file);
});

// modal handling
function openModal(forEdit=false, recipe=null) {
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
  alert(`🍴 ${recipe.title}\n\nИнгредиенты:\n${recipe.ingredients.join(', ')}\n\nИнструкция:\n${recipe.steps}`);
}

// submit recipe
recipeForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentUser) { window.location.href = 'login.html'; return; }

  const id = document.getElementById('recipeId').value;
  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
  const steps = document.getElementById('steps').value.trim();
  const image = previewImg.src;

  if (!title) return alert('Введите название рецепта');

  try {
    if (id) {
      const res = await fetch(`${API}/recipes/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, steps, image })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка редактирования');
      }
    } else {
      const res = await fetch(`${API}/recipes`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, steps, image })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка создания');
      }
    }
    await loadRecipes();
    closeModalFn();
  } catch (err) {
    alert(err.message || 'Ошибка');
  }
});

// handlers
addBtn.onclick = () => openModal();
closeModal.onclick = closeModalFn;
cancelBtn.onclick = closeModalFn;
searchInput.oninput = () => renderList(searchInput.value);

// auth button (login/logout)
authBtn.onclick = () => {
  if (currentUser) {
    // logout
    if (confirm('Выйти?')) {
      localStorage.removeItem('token');
      currentUser = null;
      updateAuthUI();
      renderList(searchInput.value);
    }
  } else {
    window.location.href = 'login.html';
  }
};

// initial load
(async function init(){
  await fetchUser();
  await loadRecipes();
})();
