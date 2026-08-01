const express = require('express');
const app = express();
const port = 3000;

// In-memory "database" — just a list of task objects
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

// Return the whole list
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Return one task by its id
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});