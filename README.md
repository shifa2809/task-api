# Task API

A simple REST API for managing tasks, built with Node.js and Express, running against a PostgreSQL database in Docker. Supports full CRUD operations with proper HTTP status codes, input validation, and interactive Swagger documentation. Authentication is handled via Supabase Auth (sign up, log in, log out) with JWT-protected routes. The entire stack — app and database — starts with a single command, and data persists across restarts via a Docker volume.

## Requirements

* Docker Desktop installed and running
* A free Supabase account and project (see Environment variables below)

## Run the whole stack (one command)

```
docker compose up
```

This builds the app image, starts a PostgreSQL container and the app container together, creates the `tasks` table if missing, and seeds three example tasks on first run. The API runs at http://localhost:3000

To stop: `docker compose down` (your data is kept in a volume).

## Environment variables

Copy `.env.example` to `.env` and adjust with your own values:

```
DATABASE\_URL=postgres://postgres:yourpassword@localhost:5432/tasks
SUPABASE\_URL=your\_supabase\_project\_url
SUPABASE\_KEY=your\_supabase\_anon\_key
PORT=3000
```

* `DATABASE\_URL` — your Postgres connection string (used by the `/tasks` CRUD routes).
* `SUPABASE\_URL` and `SUPABASE\_KEY` — from your Supabase project's **Settings → API** page. Use the `anon`/`public` key only — never the `service\_role` key.
* When running via Docker Compose, the app connects to the database using the service name `db` (configured in `compose.yaml`).

## Database

This project uses **PostgreSQL**, running in a Docker container.

**Why Postgres in Docker?** Postgres is a production-grade database server used by a huge share of real backends. Running it in a container means no manual install, identical behavior on any machine, and a throwaway, reproducible setup. A Docker volume keeps the data on disk so it survives container restarts.

**Where is the data stored?** In a Docker named volume (`taskdata`), mapped to Postgres's data directory inside the container. The `tasks` table is created automatically on first run, and three example tasks are seeded only if the table is empty.

**Example SQL query:**

```
SELECT \* FROM tasks WHERE done = true;
```

### Database view

!\[Database](database-postgres.png)

## Authentication

User accounts are managed by **Supabase Auth**, which handles password hashing and JWT signing — this project never stores or hashes a password itself. Clients sign up and log in to receive an access token (JWT), then send that token as a bearer token to reach protected routes.

```
Authorization: Bearer <access\_token>
```

The token is verified against Supabase on every protected request via a single reusable Express middleware.

## Endpoints

### Tasks

|Method|Path|Description|Success|Errors|Auth|
|-|-|-|-|-|-|
|GET|/|API info|200|—|No|
|GET|/health|Health check|200|—|No|
|GET|/tasks|List all tasks|200|—|No|
|GET|/tasks/:id|Get one task by id|200|404|No|
|POST|/tasks|Create a new task|201|400|No|
|PUT|/tasks/:id|Update a task|200|400, 404|No|
|DELETE|/tasks/:id|Delete a task|204|404|No|

### Auth \& protected routes

|Method|Path|Description|Auth required?|Success|Errors|
|-|-|-|-|-|-|
|POST|/auth/signup|Create a new user account|No|201|400|
|POST|/auth/login|Log in, receive a JWT|No|200|400, 401|
|POST|/auth/logout|End the user's session|Yes|204|401|
|GET|/public/info|Public, open data|No|200|—|
|GET|/protected/profile|Read the logged-in user's profile|Yes|200|401|
|GET|/protected/dashboard|Read the logged-in user's dashboard|Yes|200|401|

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
curl -i -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d "{\\"email\\":\\"test@example.com\\",\\"password\\":\\"password123\\"}"

# Log in
curl -i -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"test@example.com\\",\\"password\\":\\"password123\\"}"

# Access a protected route (replace TOKEN with the access\_token from login)
curl -i http://localhost:3000/protected/profile -H "Authorization: Bearer TOKEN"
```

## Swagger UI

!\[Swagger UI](swagger.png)
!\[Swagger UI - Authorized protected route](swagger-auth.png)

\## AI vs Me (Stage 7 — Bonus)



My prompt

"Build a secure REST API in Node.js with Express that handles user authentication using Supabase as the identity provider. I need these five routes:

\- `POST /auth/signup` — create a new user account with email and password, return `201` on success, `400` if email/password missing

\- `POST /auth/login` — log in and return a JWT access token, return `200` on success, `400` for missing input, `401` for invalid credentials

\- `POST /auth/logout` — end the session, requires a valid bearer token, return `204` on success

\- `GET /public/info` — an open route, no auth needed, returns a simple message with `200`

\- `GET /protected/profile` — returns the logged-in user's id, email, and created date; requires a valid bearer token in the `Authorization` header; return `401` if the token is missing, malformed, or invalid/expired



Token verification should be built as a single reusable Express middleware function, not duplicated logic in each route. Apply that middleware to both `/protected/profile` and `/auth/logout`.



Also add Swagger UI documentation (using `swagger-ui-express`) with a bearer auth security scheme, so protected routes show a lock icon and can be tested with the 'Authorize' button.



Use the `@supabase/supabase-js` SDK, and load Supabase credentials from environment variables (`.env`)."



The AI's code lives in `ai-version/` and was not merged into my Stages 0–6 code.



\### 1. Token extraction — did it handle "Bearer <token>" correctly?

Yes — and slightly more defensively than my own version. It splits the header and explicitly checks `parts.length === 2 \&\& parts\[0] === 'Bearer'`, returning a clear "malformed header" error if the format is off (e.g. missing the word "Bearer", or extra spaces). My version used `startsWith('Bearer ')`, which works but doesn't call out malformed headers as distinctly.



2\. What security flaws might it have introduced?

The AI's `/auth/logout` uses my Supabase \*\*`service\_role` key\*\* (via `supabaseAdmin.auth.admin.signOut()`) to force-revoke the session server-side. The assignment explicitly warns: \*"Never use the service\_role key here — it bypasses all security."\* My own implementation only ever uses the safe `anon` key, matching spec. The AI made this choice on its own, without being asked for guaranteed server-side revocation — introducing a much more powerful, unrestricted key into the server for a feature that wasn't required. It doesn't leak the key or log tokens anywhere, and correctly rejects invalid/expired tokens without leaking internal error details — but the service\_role usage itself is the flaw.



3\. What did my prompt forget to specify, and what did the AI silently decide?

\- \*\*File structure\*\*: I didn't specify one file vs. many — the AI split everything into `src/app.js`, `routes/`, `middleware/`, and `docs/` instead of a single file like mine.

\- \*\*The service\_role key / admin logout\*\*: entirely the AI's own addition, not requested, and against the spirit of the assignment's security guidance.

\- \*\*Extra response fields\*\*: login returns `refresh\_token`, `expires\_at`, and a `user` object — more than I asked for.

\- \*\*A 404 fallback and generic error handler\*\*: a reasonable defensive addition I hadn't specified either way.

\- \*\*Swagger approach\*\*: used `swagger-jsdoc` comment annotations per route instead of a static `openapi.json` file — different mechanism, same end result (a working Authorize button and lock icons).



One rematch

If I re-ran this prompt, I'd add one line: \*"Do not use the Supabase service\_role key anywhere — use only the anon key for all operations."\* That single addition would have prevented the biggest issue found in the review.

