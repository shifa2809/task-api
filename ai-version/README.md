# Supabase Auth API

Secure REST API in Node.js/Express using Supabase as the identity provider.

## Setup

```bash
npm install
cp .env.example .env
# then fill in SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
npm start
```

Server runs on `http://localhost:3000` by default.
Swagger UI: `http://localhost:3000/api-docs`

## Where to get the env values

In your Supabase dashboard: **Project Settings → API**.

- `SUPABASE_URL` — Project URL
- `SUPABASE_ANON_KEY` — `anon` `public` key (safe for signup/login/token verification)
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` key (server-side only, never expose it).
  Used only by `/auth/logout` to revoke a session via the Supabase admin API. If you
  omit it, logout still returns 204 but only performs a local sign-out rather than a
  guaranteed server-side revoke — see the comment in `src/routes/auth.js`.

Note: by default Supabase requires email confirmation before a new user can log in.
For local testing, either confirm the user via the Supabase dashboard, or disable
"Confirm email" under Authentication → Providers → Email while developing.

## Routes

| Method | Path                 | Auth required | Notes                                      |
|--------|----------------------|---------------|---------------------------------------------|
| POST   | `/auth/signup`       | No            | `{ email, password }` → 201                |
| POST   | `/auth/login`        | No            | `{ email, password }` → 200 + access_token |
| POST   | `/auth/logout`       | Yes (Bearer)  | → 204                                      |
| GET    | `/public/info`       | No            | → 200                                      |
| GET    | `/protected/profile` | Yes (Bearer)  | → 200 with id, email, created_at           |

## Project structure

```
server.js                    entry point
src/
  app.js                     Express app + route/Swagger wiring
  supabaseClient.js          anon + admin Supabase clients
  middleware/requireAuth.js  single reusable bearer-token auth middleware
  routes/
    auth.js                  signup, login, logout
    public.js                open info route
    protected.js             profile route
  docs/swagger.js            OpenAPI spec (swagger-jsdoc) + bearerAuth scheme
```

## Trying it via Swagger UI

1. `POST /auth/signup` to create a user.
2. `POST /auth/login` to get an `access_token`.
3. Click **Authorize** (top right of Swagger UI) and paste the token in as
   `<token>` (no need to type "Bearer " — the scheme handles that).
4. Call `GET /protected/profile` or `POST /auth/logout` — they'll now include
   the token automatically.

## Testing without Swagger

```bash
# signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Sup3rSecret!"}'

# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Sup3rSecret!"}'

# protected route (replace TOKEN)
curl http://localhost:3000/protected/profile \
  -H "Authorization: Bearer TOKEN"

# logout (replace TOKEN)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer TOKEN"
```
