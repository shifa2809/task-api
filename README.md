\# Task API



A simple REST API for managing tasks, built with Node.js and Express, with data stored in a SQLite database. Supports full CRUD operations (Create, Read, Update, Delete) with proper HTTP status codes, input validation, and interactive Swagger documentation. Task data persists across server restarts.



\## Requirements



\- Node.js installed



\## Install \& Run



npm install

node shifaap.js





The server runs at http://localhost:3000



Interactive API docs are available at http://localhost:3000/docs



\## Database



This project uses \*\*SQLite\*\* for data storage.



\*\*Why SQLite?\*\* It's a lightweight, serverless database stored in a single file — no separate database server to install or configure. That makes it ideal for a small project: zero setup, and the whole database travels with the code.



\*\*Where is the data stored?\*\* In a file called `tasks.db` in the project root. It's created automatically the first time you run the server — the `tasks` table is created if it doesn't exist, and three example tasks are inserted only if the table is empty. Your data survives server restarts.



\*\*Example SQL query\*\* (run in DB Browser for SQLite):



SELECT \* FROM tasks WHERE done = 1;





This returns only the completed tasks.



\### Database viewer



!\[Database](database.png)



\## Endpoints



| Method | Path       | Description        | Success | Errors   |

|--------|------------|--------------------|---------|----------|

| GET    | /          | API info           | 200     | —        |

| GET    | /health    | Health check       | 200     | —        |

| GET    | /tasks     | List all tasks     | 200     | —        |

| GET    | /tasks/:id | Get one task by id | 200     | 404      |

| POST   | /tasks     | Create a new task  | 201     | 400      |

| PUT    | /tasks/:id | Update a task      | 200     | 400, 404 |

| DELETE | /tasks/:id | Delete a task      | 204     | 404      |



\## Example Request



curl -i http://localhost:3000/tasks/1





Response:

HTTP/1.1 200 OK

X-Powered-By: Express

Content-Type: application/json; charset=utf-8

Content-Length: 41

ETag: W/"29-IJxbGr/MYx26TjA7XbxW+lvJP78"

Date: Wed, 05 Aug 2026 17:10:52 GMT

Connection: keep-alive

Keep-Alive: timeout=5



\## Swagger UI



!\[Swagger UI](swagger.png)

