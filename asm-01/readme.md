# Task Management CRUD API

A clean, straightforward backend API for managing a to-do list built with Node.js and Express. Data stays in-memory for simplicity, and interactive docs are available via Swagger UI.

---

## Features

- Complete CRUD lifecycle for tasks
- Fast in-memory data store
- Basic request validation (guards against empty or missing task titles)
- Built-in interactive OpenAPI/Swagger UI docs
- Proper HTTP response codes (`200`, `201`, `204`, `400`, `404`)

---

## Requirements

- Node.js (v14+)
- npm

---

## Getting Started

1. **Clone the repo:**
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd <YOUR_REPOSITORY_FOLDER_NAME>

2. **Install dependencies:**
   npm install

3. **Run the server:**
   node server.js

The server starts locally at http://localhost:3000.

---

## Endpoints

| Method | Endpoint | Description | Payload | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | API Metadata | None | `200 OK` | N/A |
| **GET** | `/health` | Health Check | None | `200 OK` | N/A |
| **GET** | `/tasks` | Get all tasks | None | `200 OK` | N/A |
| **GET** | `/tasks/:id` | Get single task | None | `200 OK` | `404 Not Found` |
| **POST** | `/tasks` | Create task | `{"title": "string"}` | `201 Created` | `400 Bad Request` |
| **PUT** | `/tasks/:id` | Update task | `{"title": "string", "done": boolean}` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/tasks/:id` | Remove task | None | `204 No Content` | `404 Not Found` |

---

## Interactive Docs

You can test every endpoint directly from your browser without using curl or Postman:

http://localhost:3000/docs

---

## Quick Test Example

### Adding a new task (POST `/tasks`)

**Request:**
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Buy groceries\"}"

**Response:**
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 46

{
  "id": 4,
  "title": "Buy groceries",
  "done": false
}
