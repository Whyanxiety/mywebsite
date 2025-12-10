// app.js — управление рецептами через Supabase

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xliizzhladrslfruhija.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
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

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
  catch { return null; }
}
function setCurrentUser(u) { if (u) localStorage.setItem('currentUser', JSON.stringify(u)); else localStorage.removeItem('currentUser'); }

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
async function loadRecipes() {
  currentUser = getCurrentUser();
  if (!currentUser) { recipes = []; renderList(); return; }

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error(error); recipes = []; renderList(); return; }

  recipes = data;
  renderList(searchInput.value);
}

function renderList(filter = '') {
  listEl.innerHTML = '';
  const q = filter.trim().toLowerCase();
  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(q) ||
    (r.ingredients || []).join(' ').toLowerCase().includes(q)
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
    card.querySelector('.card-ingredients').textContent = (r.ingredients || []).slice(0, 3).join(', ');

    const viewBtn = card.querySelector('.view');
    const editBtn = card.querySelector('.edit');
    const delBtn = card.querySelector('.delete');
    const actions = card.querySelector('.card-actions');

    const isOwner = currentUser && currentUser.user_id === r.user_id;

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
    delBtn.onclick = async () => {
      if (!confirm(`Удалить рецепт "${r.title}"?`)) return;
      try {
        await supabase.from('recipes').delete().eq('id', r.id).eq('user_id', currentUser.user_id);
        await loadRecipes();
      } catch(err) {
        console.error(err);
        alert('Ошибка удаления');
      }
    };

    listEl.appendChild(node);
  });
}

// ---------- Modal / Form ----------
customImage?.addEventListener('change', e => {
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
    document.getElementById('ingredients').value = (recipe.ingredients || []).join('\n');
    document.getElementById('steps').value = recipe.steps || '';
    previewImg.src = recipe.image || 'images/card.png';
  } else {
    modalTitle.textContent = 'Новый рецепт';
    previewImg.src = 'images/card.png';
  }
}
function closeModalFn() { modal.classList.add('hidden'); }

function openViewModal(recipe) {
  alert(`🍴 ${recipe.title}\n\nИнгредиенты:\n${(recipe.ingredients || []).join('\n')}\n\nИнструкция:\n${recipe.steps || ''}`);
}

// submit recipe
recipeForm.addEventListener('submit', async e => {
  e.preventDefault();
  currentUser = getCurrentUser();
  if (!currentUser) { window.location.href = 'login.html'; return; }

  const id = document.getElementById('recipeId').value;
  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value.split('\n').map(x=>x.trim()).filter(Boolean);
  const steps = document.getElementById('steps').value.trim();
  const image = previewImg.src;

  if (!title) return alert('Введите название рецепта');

  try {
    if (id) {
      await supabase.from('recipes').update({ title, ingredients, steps, image }).eq('id', id);
    } else {
      await supabase.from('recipes').insert({ user_id: currentUser.user_id, title, ingredients, steps, image });
    }
    await loadRecipes();
    closeModalFn();
  } catch (err) {
    console.error(err);
    alert('Ошибка сохранения рецепта');
  }
});

// handlers
addBtn.onclick = () => openModal();
closeModal.onclick = closeModalFn;
cancelBtn.onclick = closeModalFn;
searchInput.oninput = () => renderList(searchInput.value);

// initial load
(async function init(){
  updateAuthUI();
  await loadRecipes();
})();
