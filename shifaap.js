const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const swaggerUi = require('swagger-ui-express');
const openapiDoc = require('./openapi.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

// Connect to the SQLite database (creates tasks.db if it doesn't exist)
const Database = require('better-sqlite3');
const db = new Database('tasks.db');

// Create the tasks table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);

// Insert 3 example tasks ONLY if the table is empty
const count = db.prepare('SELECT COUNT(*) AS n FROM tasks').get();
if (count.n === 0) {
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Buy groceries', 0);
  insert.run('Finish assignment', 0);
  insert.run('Call the dentist', 1);
}app.get('/', (req, res) => {
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

  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  const newTask = { id: nextId, title: title, done: false };
  tasks.push(newTask);

  res.status(201).json(newTask);
});

// Update an existing task
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body;

  // Reject a body that offers nothing valid to update
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Provide title and/or done' });
  }
  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  // Update only the fields that were provided
  if (title !== undefined) task.title = title;
  if (done !== undefined) task.done = done;

  res.json(task);
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});