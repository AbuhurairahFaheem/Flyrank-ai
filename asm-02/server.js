const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;


// 1. DATABASE INITIALIZATION 
// Open or create tasks.db
const db = new Database('tasks.db');

db.pragma('journal_mode = WAL');

// Create the tasks table if it does not already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

// initial tasks only if the table is currently empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const seedTasks = [
    { title: "Learn Express basics", done: 1 },
    { title: "Build a CRUD API", done: 0 },
    { title: "Publish code to GitHub", done: 0 }
  ];

  // Insert tasks together inside a single transaction
  const insertMany = db.transaction((taskList) => {
    for (const task of taskList) {
      insertStmt.run(task.title, task.done);
    }
  });

  insertMany(seedTasks);
  console.log('Database seeded with 3 example tasks.');
}

// 2. MIDDLEWARE & DOCS
// Parse incoming JSON request bodies
app.use(express.json());

// Serve interactive Swagger UI documentation at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Helper to convert SQLite integer (0/1) back into a JavaScript boolean (false/true)
function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done)
  };
}


// 4. API ROUTES
// Root endpoint: API metadata
app.get('/', (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: "ok"
  });
});

// GET /tasks: Retrieve all tasks from database
app.get('/tasks', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, title, done FROM tasks');
    const rows = stmt.all();
    res.json(rows.map(formatTask));
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tasks/:id: Retrieve a single task by ID
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Reject non-numeric ID immediately
  if (isNaN(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  try {
    // Parameterized query using '?' placeholder for safety
    const stmt = db.prepare('SELECT id, title, done FROM tasks WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }

    res.json(formatTask(row));
  } catch (err) {
    console.error('Error fetching task by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks: Create a new task and store it in SQLite
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  // Validation: ensure title exists and is not an empty string
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: "Title is required and must be a non-empty string" });
  }

  try {
    const cleanTitle = title.trim();
    const stmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    
    // SQLite automatically assigns the autoincrement ID
    const info = stmt.run(cleanTitle, 0);

    const newTask = {
      id: Number(info.lastInsertRowid),
      title: cleanTitle,
      done: false
    };

    // 201 Created
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error inserting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /tasks/:id: Update an existing task's title and/or done status
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  try {
    // 1. Check if the task exists
    const existingTask = db.prepare('SELECT id, title, done FROM tasks WHERE id = ?').get(id);
    if (!existingTask) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }

    const { title, done } = req.body;

    // 2. Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: "Title must be a non-empty string" });
    }

    // 3. Validate done if provided
    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: "Done must be a boolean (true/false)" });
    }

    const updatedTitle = title !== undefined ? title.trim() : existingTask.title;
    const updatedDone = done !== undefined ? (done ? 1 : 0) : existingTask.done;

    // 5. Update row using parameterized query
    const updateStmt = db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?');
    updateStmt.run(updatedTitle, updatedDone, id);

    // 6. Return updated task with 200 OK
    res.json({
      id: id,
      title: updatedTitle,
      done: Boolean(updatedDone)
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /tasks/:id: Remove a task from the database
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  try {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const info = stmt.run(id);

    // If changes === 0, no record was found with that ID
    if (info.changes === 0) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }

    // 204 No Content with empty response body
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// 5. SERVER START
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});