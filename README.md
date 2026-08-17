\# Task API



A simple REST API for managing tasks, built with Node.js and Express, running against a PostgreSQL database in Docker. Supports full CRUD operations with proper HTTP status codes, input validation, and interactive Swagger documentation. The entire stack — app and database — starts with a single command, and data persists across restarts via a Docker volume.



\## Requirements



\- Docker Desktop installed and running



\## Run the whole stack (one command)



docker compose up





This builds the app image, starts a PostgreSQL container and the app container together, creates the `tasks` table if missing, and seeds three example tasks on first run. The API runs at http://localhost:3000



To stop: `docker compose down` (your data is kept in a volume).



\## Environment variables



Copy `.env.example` to `.env` and adjust if needed:



DATABASE\_URL=postgres://postgres:yourpassword@localhost:5432/tasks

PORT=3000





When running via Docker Compose, the app connects to the database using the service name `db` (configured in `compose.yaml`).



\## Database



This project uses \*\*PostgreSQL\*\*, running in a Docker container.



\*\*Why Postgres in Docker?\*\* Postgres is a production-grade database server used by a huge share of real backends. Running it in a container means no manual install, identical behavior on any machine, and a throwaway, reproducible setup. A Docker volume keeps the data on disk so it survives container restarts.



\*\*Where is the data stored?\*\* In a Docker named volume (`taskdata`), mapped to Postgres's data directory inside the container. The `tasks` table is created automatically on first run, and three example tasks are seeded only if the table is empty.



\*\*Example SQL query:\*\*



SELECT \* FROM tasks WHERE done = true;





\### Database view



!\[Database](database-postgres.png)



\## Endpoints



| Method | Path       | Description        | Success | Errors   | Auth |

|--------|------------|--------------------|---------|----------|------|

| GET    | /          | API info           | 200     | —        | No   |

| GET    | /health    | Health check       | 200     | —        | No   |

| GET    | /tasks     | List all tasks     | 200     | —        | No   |

| GET    | /tasks/:id | Get one task by id | 200     | 404      | No   |

| POST   | /tasks     | Create a new task  | 201     | 400      | No   |

| PUT    | /tasks/:id | Update a task      | 200     | 400, 404 | No   |

| DELETE | /tasks/:id | Delete a task      | 204     | 404      | No   |



\## Example Request



curl -i http://localhost:3000/tasks/1





Response:



HTTP/1.1 200 OK

X-Powered-By: Express

Content-Type: application/json; charset=utf-8



{"id":1,"title":"Buy groceries","done":false}





\## Swagger UI



!\[Swagger UI](swagger.png)

