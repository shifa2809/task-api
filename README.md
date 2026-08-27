# Task API
A simple REST API for managing tasks, built with Node.js and Express, running against a PostgreSQL database in Docker. Supports full CRUD operations with proper HTTP status codes, input validation, and interactive Swagger documentation. Authentication is handled via Supabase Auth (sign up, log in, log out) with JWT-protected routes. The entire stack — app and database — starts with a single command, and data persists across restarts via a Docker volume.

## Requirements
- Docker Desktop installed and running
- A free Supabase account and project (see Environment variables below)

## Run the whole stack (one command)
```
docker compose up
```
This builds the app image, starts a PostgreSQL container and the app container together, creates the `tasks` table if missing, and seeds three example tasks on first run. The API runs at http://localhost:3000

To stop: `docker compose down` (your data is kept in a volume).

## Environment variables
Copy `.env.example` to `.env` and adjust with your own values:
```
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/tasks
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
```
- `DATABASE_URL` — your Postgres connection string (used by the `/tasks` CRUD routes).
- `SUPABASE_URL` and `SUPABASE_KEY` — from your Supabase project's **Settings → API** page. Use the `anon`/`public` key only — never the `service_role` key.
- When running via Docker Compose, the app connects to the database using the service name `db` (configured in `compose.yaml`).

## Database
This project uses **PostgreSQL**, running in a Docker container.

**Why Postgres in Docker?** Postgres is a production-grade database server used by a huge share of real backends. Running it in a container means no manual install, identical behavior on any machine, and a throwaway, reproducible setup. A Docker volume keeps the data on disk so it survives container restarts.

**Where is the data stored?** In a Docker named volume (`taskdata`), mapped to Postgres's data directory inside the container. The `tasks` table is created automatically on first run, and three example tasks are seeded only if the table is empty.

**Example SQL query:**
```
SELECT * FROM tasks WHERE done = true;
```

### Database view
![Database](database-postgres.png)

## Authentication
User accounts are managed by **Supabase Auth**, which handles password hashing and JWT signing — this project never stores or hashes a password itself. Clients sign up and log in to receive an access token (JWT), then send that token as a bearer token to reach protected routes.

```
Authorization: Bearer <access_token>
```

The token is verified against Supabase on every protected request via a single reusable Express middleware.

## Endpoints

### Tasks
| Method | Path       | Description        | Success | Errors   | Auth |
|--------|------------|--------------------|---------|----------|------|
| GET    | /          | API info           | 200     | —        | No   |
| GET    | /health    | Health check       | 200     | —        | No   |
| GET    | /tasks     | List all tasks     | 200     | —        | No   |
| GET    | /tasks/:id | Get one task by id | 200     | 404      | No   |
| POST   | /tasks     | Create a new task  | 201     | 400      | No   |
| PUT    | /tasks/:id | Update a task      | 200     | 400, 404 | No   |
| DELETE | /tasks/:id | Delete a task      | 204     | 404      | No   |

### Auth & protected routes
| Method | Path                  | Description                          | Auth required? | Success | Errors   |
|--------|-----------------------|---------------------------------------|-----------------|---------|----------|
| POST   | /auth/signup          | Create a new user account             | No              | 201     | 400      |
| POST   | /auth/login           | Log in, receive a JWT                 | No              | 200     | 400, 401 |
| POST   | /auth/logout          | End the user's session                | Yes             | 204     | 401      |
| GET    | /public/info          | Public, open data                     | No              | 200     | —        |
| GET    | /protected/profile    | Read the logged-in user's profile     | Yes             | 200     | 401      |
| GET    | /protected/dashboard  | Read the logged-in user's dashboard   | Yes             | 200     | 401      |

## Example Request
```
curl -i http://localhost:3000/tasks/1
```
Response:
```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
{"id":1,"title":"Buy groceries","done":false}
```

## Example Auth Flow
```
# Sign up
curl -i -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Log in
curl -i -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Access a protected route (replace TOKEN with the access_token from login)
curl -i http://localhost:3000/protected/profile -H "Authorization: Bearer TOKEN"
```

## Swagger UI
![Swagger UI](swagger.png)
![Swagger UI - Authorized protected route](swagger-auth.png)
