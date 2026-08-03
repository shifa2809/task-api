\# Task API



A simple REST API for managing tasks, built with Node.js and Express. Supports full CRUD operations (Create, Read, Update, Delete) with proper HTTP status codes and input validation. Interactive documentation is provided via Swagger UI.



\## Requirements



\- Node.js installed



\## Install \& Run



npm install

node shifaap.js





The server runs at http://localhost:3000



Interactive API docs are available at http://localhost:3000/docs



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

Content-Length: 45

ETag: W/"2d-Gv8HDdZD1sn+UqMseo56OTgQmek"

Date: Mon, 03 Aug 2026 17:15:43 GMT

Connection: keep-alive

Keep-Alive: timeout=5



{"id":1,"title":"Buy groceries","done":false}



\## Swagger UI



!\[Swagger UI](swagger.png)

