// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret';
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // serve static files (html/css/js/images)

// helpers to read/write db.json (synchronously — simple & reliable for small project)
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], recipes: [] };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// middleware: authenticate by Bearer token
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Нет токена' });
  const [type, token] = auth.split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'Неправильный токен' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
}

// --- Auth routes ---
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

  const db = readDB();
  const existing = db.users.find(u => u.email === email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), email: email.toLowerCase(), password: hashed, name: name||'' };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

  const db = readDB();
  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(400).json({ error: 'Неверные учётные данные' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Неверные учётные данные' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ id: user.id, email: user.email, name: user.name });
});

// --- Recipes routes ---
app.get('/api/recipes', (req, res) => {
  const db = readDB();
  // return recipes without exposing user passwords. Keep ownerId so client can check ownership.
  res.json(db.recipes || []);
});

app.post('/api/recipes', authMiddleware, (req, res) => {
  const { title, ingredients, steps, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });

  const db = readDB();
  const recipe = {
    id: uuidv4(),
    title,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    steps: steps || '',
    image: image || 'images/card.png',
    ownerId: req.user.id,
    createdAt: new Date().toISOString()
  };
  db.recipes.push(recipe);
  writeDB(db);
  res.json(recipe);
});

app.put('/api/recipes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, ingredients, steps, image } = req.body;

  const db = readDB();
  const idx = db.recipes.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Рецепт не найден' });

  const recipe = db.recipes[idx];
  if (recipe.ownerId !== req.user.id) return res.status(403).json({ error: 'Нет права редактировать этот рецепт' });

  recipe.title = title || recipe.title;
  recipe.ingredients = Array.isArray(ingredients) ? ingredients : recipe.ingredients;
  recipe.steps = steps || recipe.steps;
  recipe.image = image || recipe.image;
  recipe.updatedAt = new Date().toISOString();

  db.recipes[idx] = recipe;
  writeDB(db);
  res.json(recipe);
});

app.delete('/api/recipes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = db.recipes.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Рецепт не найден' });

  const recipe = db.recipes[idx];
  if (recipe.ownerId !== req.user.id) return res.status(403).json({ error: 'Нет права удалять этот рецепт' });

  db.recipes.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// Fallback: serve index.html for root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
