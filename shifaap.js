const express = require('express');
const app = express();
const port = 3000;

// This line lets Express read JSON sent in the request body
app.use(express.json());

// In-memory "database"
const tasks = [
  { id: 1, title: 'Buy groceries', done: false },
  { id: 2, title: 'Finish assignment', done: false },
  { id: 3, title: 'Call the dentist', done: true }
];

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
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// Create a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  // Validation: title must exist and not be empty
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Figure out the next id
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = { id: nextId, title: title, done: false };
  tasks.push(newTask);

  res.status(201).json(newTask);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});