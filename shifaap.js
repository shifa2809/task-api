const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const swaggerUi = require('swagger-ui-express');
const openapiDoc = require('./openapi.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

// Load environment variables from .env
require('dotenv').config();

// Connect to Postgres using the connection string from .env
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// On startup: create the tasks table if missing, seed 3 tasks if empty
async function initDb() {
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
}
initDb();
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

app.get('/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  res.json(tasks);
});
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run(title, 0);
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(newTask);
});
// Update an existing task
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

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

  // Use the new value if provided, otherwise keep the existing one
  const newTitle = title !== undefined ? title : task.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : task.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updatedTask);
});
// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);

  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});