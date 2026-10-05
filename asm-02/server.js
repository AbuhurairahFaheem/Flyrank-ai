const express = require('express')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app=express()
const PORT = 3000

const Database = require('better-sqlite3');
const db = new Database('tasks.db');


db.pragma('journal_mode = WAL');

// Create table if missing
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const seedTasks = [
    { title: "Learn Express basics", done: 1 },
    { title: "Build a CRUD API", done: 0 },
    { title: "Publish code to GitHub", done: 0 }
  ];

  // Insert seed tasks within a transaction
  const insertMany = db.transaction((tasks) => {
    for (const task of tasks) {
      insertStmt.run(task.title, task.done);
    }
  });

  insertMany(seedTasks);
  console.log('Database seeded with 3 example tasks.');
}



// Middleware to parse JSON bodies in incoming requests
app.use(express.json());

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Stage 0: Basic server setup
// app.get('/', (req, res)=>{res.send('Hello, server!');});



// Stage 1: Root endpoint returning API metadata
app.get('/', (req, res) => {
    res.json({ 
        name: "Task API", 
        version: "1.0", 
        endpoints: ["/tasks"] 
    });
});

// Stage 1: Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: "ok" 
    });
});

// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });



// // Stage 2 with 3 example tasks
// let tasks = [
//     { id: 1, title: "Learn Express basics", done: true },
//     { id: 2, title: "Build a CRUD API", done: false },
//     { id: 3, title: "Publish code to GitHub", done: false }
// ];

// // Stage 2: GET /tasks - returns the whole list of tasks
// app.get('/tasks', (req, res) => {
//     res.json(tasks);
// });

// Helper to format SQLite row (turns integer 0/1 back to true/false boolean)
function formatTask(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        done: Boolean(row.done)
    };
}

// Stage 1: GET /tasks - read all tasks from SQLite
app.get('/tasks', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, title, done FROM tasks');
        const rows = stmt.all();
        const formattedTasks = rows.map(formatTask);
        res.json(formattedTasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stage 1: GET /tasks/:id - read a single task using parameterized query
app.get('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    // If ID is not a valid number, return 404 right away
    if (isNaN(id)) {
        return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    try {
        // Use parameterized query with '?' placeholder
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

// // Stage 2: GET /tasks/:id - returns one task by its ID
// app.get('/tasks/:id', (req, res) => {
//     const id = parseInt(req.params.id, 10); // Parse the path parameter to a number
//     const task = tasks.find(t => t.id === id);

//     if (!task) {
//         // Return 404 with a JSON error if the task is not found
//         return res.status(404).json({ error: `Task ${id} not found` });
//     }

//     res.json(task);
// });


// // Stage 3: POST /tasks - Create a new task
// app.post('/tasks', (req, res) => {
//     const { title } = req.body; // Extract title from request body

//     // Validation: Server never trusts the client! Check if title is missing or empty
//     if (!title || typeof title !== 'string' || title.trim() === '') {
//         return res.status(400).json({ error: "Title is required and must be a non-empty string" });
//     }

//     // Generate the next free ID
//     const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

//     // Create the new task object
//     const newTask = {
//         id: newId,
//         title: title.trim(),
//         done: false // Defaults to false
//     };

//     // Add it to our in-memory list
//     tasks.push(newTask);

//     // Return status 201 (Created) along with the new task
//     res.status(201).json(newTask);
// });

// Stage 2: POST /tasks - Create a new task and persist in db
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: "Title is required and must be a non-empty string" });
    }

    try {
        const cleanTitle = title.trim();
        const stmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
        
        // better-sqlite3 returns info with lastInsertRowid
        const info = stmt.run(cleanTitle, 0);

        const newTask = {
            id: Number(info.lastInsertRowid),
            title: cleanTitle,
            done: false
        };

        // Return status 201 (Created)
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Error inserting task:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stage 4: PUT /tasks/:id - Update an existing task's title and/or done status
app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex(t => t.id === id);

    // 1. Check if the task exists
    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task ${id} not found` }); // [cite: 92]
    }

    const { title, done } = req.body;

    // 2. Validate input if title is provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return res.status(400).json({ error: "Title must be a non-empty string" });
    }

    // 3. Validate input if done is provided
    if (done !== undefined && typeof done !== 'boolean') {
        return res.status(400).json({ error: "Done must be a boolean (true/false)" }); 
    }

    // 4. Update fields if they were passed in the body
    if (title !== undefined) tasks[taskIndex].title = title.trim();
    if (done !== undefined) tasks[taskIndex].done = done;

    // 5. Return the newly updated task
    res.json(tasks[taskIndex]);
});

// Stage 4: DELETE /tasks/:id - Remove a task
app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex(t => t.id === id);

    // Check if the task exists
    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task ${id} not found` });
    }

    // Remove the task from our array
    tasks.splice(taskIndex, 1);

    // Return status 204 (No Content) with an empty response body
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on: ${PORT}`);
});

