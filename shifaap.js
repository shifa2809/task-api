const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const swaggerUi = require('swagger-ui-express');
const openapiDoc = require('./openapi.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
const { supabase } = require('./supabaseClient');
app.get('/test-supabase', async (req, res) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Supabase client is working', data });
});
// Sign up a new user
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data.user);
});

// Log in an existing user
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
// Public route - no auth needed
app.get('/public/info', (req, res) => {
  res.status(200).json({ message: 'Welcome stranger! This info is public.' });
});
// Middleware: verifies the bearer token, attaches user to req.user
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] === '') {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  req.token = token; // useful for logout
  next();
}
app.post('/auth/logout', requireAuth, async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});
app.get('/protected/dashboard', requireAuth, (req, res) => {
  res.status(200).json({ message: `Welcome to your dashboard, ${req.user.email}` });
});

// Protected route - just checks a token was sent (not verified yet)
app.get('/protected/profile', requireAuth, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at,
  });
});
// Connect to Postgres using the connection string from .env
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// On startup: create the tasks table if missing, seed 3 tasks if empty
// On startup: create the tasks table if missing, seed 3 tasks if empty
// Retries the connection, since the database may take a few seconds to be ready
async function initDb() {
  const retries = 10;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT false
        )
      `);

      const result = await pool.query('SELECT COUNT(*) FROM tasks');
      if (parseInt(result.rows[0].count) === 0) {
        await pool.query(
          `INSERT INTO tasks (title, done) VALUES
            ('Buy groceries', false),
            ('Finish assignment', false),
            ('Call the dentist', true)`
        );
      }

      console.log('Database ready');
      return; // success — stop retrying
    } catch (err) {
      console.log(`Database not ready (attempt ${attempt}/${retries}), retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('Could not connect to the database after several attempts');
}
// initDb(); // disabled for A4 — not using own Postgres DB this assignment
app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  res.json(result.rows);
});
app.get('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  const task = result.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
app.post('/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
    [title, false]
  );

  res.status(201).json(result.rows[0]);
});
// Update an existing task
app.put('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);

  const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  const task = existing.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Provide title and/or done' });
  }
  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  const newTitle = title !== undefined ? title : task.title;
  const newDone = done !== undefined ? done : task.done;

  const result = await pool.query(
    'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
    [newTitle, newDone, id]
  );

  res.json(result.rows[0]);
});

 // Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);

  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.status(204).send();
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});