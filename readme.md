# FlyRank Backend Track: Task Management API

**Author:** Abuhurairah  
**Track:** FlyRank Internship - Backend Development  
**Stack:** Node.js, Express, SQLite (`better-sqlite3`), Swagger UI  

A persistent RESTful CRUD API built with Node.js and Express. This project illustrates the transition from an ephemeral in-memory storage layer (Assignment 1) to a durable disk-backed SQLite database (Assignment 2), ensuring state persists across application restarts without breaking endpoint contracts.

---

## Architecture Evolution

- **Assignment 1 (In-Memory):** State was stored inside a JavaScript runtime array. Restarting the process resulted in complete data loss.
- **Assignment 2 (SQLite Persistence):** Replaced the storage array with a local `tasks.db` database powered by `better-sqlite3`. Client contracts (endpoints, payloads, and response status codes) remained 100% unchanged.

### Why SQLite?
1. **Zero Configuration:** SQLite is a serverless, self-contained engine that requires no independent daemon, socket setup, or external server process.
2. **Single-File Portability:** The entire database lives in a local file (`tasks.db`), ensuring reproducible setup on any clone.
3. **Data Durability & Crash Safety:** ACID-compliant storage guarantees data persists across restarts and crashes while remaining fast due to synchronous file bindings.

---

## Features

- **Full CRUD Lifecycle:** Create, read, update, and delete tasks seamlessly.
- **Zero-Setup Initialization:** Automatically provisions `tasks.db` and the `tasks` schema if missing.
- **Idempotent Seeding:** Seeds three starter tasks only when the database is empty, preventing duplicate seeding on restart.
- **Parameterized SQL Queries:** Guards against SQL injection attacks using prepared statements with placeholders (`?`).
- **Interactive Documentation:** Live OpenAPI/Swagger documentation available directly in the browser.
- **Strict Input Validation:** Enforces non-empty strings and valid datatypes with informative JSON error responses (`400 Bad Request`, `404 Not Found`).

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Success | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | API Metadata | None | `200 OK` | — |
| **GET** | `/health` | Health Check | None | `200 OK` | — |
| **GET** | `/tasks` | Retrieve all tasks | None | `200 OK` | — |
| **GET** | `/tasks/:id` | Retrieve single task | None | `200 OK` | `404 Not Found` |
| **POST** | `/tasks` | Create new task | `{"title": "string"}` | `201 Created` | `400 Bad Request` |
| **PUT** | `/tasks/:id` | Update task title/status | `{"title"?: "string", "done"?: boolean}` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/tasks/:id` | Remove a task | None | `204 No Content` | `404 Not Found` |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [Git](https://git-scm.com/)

### 1. Clone & Install
```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
npm install
```

### 2. Run the Application
```bash
node server.js
```
The server will boot on `http://localhost:3000`. On its very first run, `tasks.db` will be created automatically and populated with 3 initial tasks.

### 3. Interactive Documentation
Explore and test the API visually via Swagger UI:
```text
http://localhost:3000/docs
```

---

## Verification & Manual SQL Inspection (Stage 4)

The database file `tasks.db` can be inspected directly using [DB Browser for SQLite](https://sqlitebrowser.org/).

### DB Browser Screenshot
*(Place your screenshot file in the repository or an `assets/` folder and update the link below)*

![DB Browser Screenshot](docs/db-browser-screenshot.png)

### Manual SQL Query
Ran during Stage 4 verification via DB Browser's "Execute SQL" console:

```sql
SELECT id, title, done FROM tasks WHERE done = 0;
```
**Output / Observation:** Returned all active/uncompleted tasks directly from `tasks.db`, matching the output of the API's `GET /tasks` endpoint.

---

## Git Workflow & Progression

This repository maintains an honest commit history reflecting the step-by-step migration:
1. `Stage 0: create SQLite database`
2. `Stage 1: database read endpoints`
3. `Stage 2: insert into database`
4. `Stage 3: update and delete with SQL`
5. `Stage 4: explored SQLite`
6. `Stage 5: database documentation`