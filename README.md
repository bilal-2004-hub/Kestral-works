# Kestrel Works — company website, client portal and admin dashboard

A production-shaped MERN application in three parts that share one database and one API:

1. **Public website** — hero, services, video, portfolio, process, about, testimonials, contact.
2. **Client portal** — each client sees only their own projects, tasks, feedback, reviews and notifications.
3. **Admin dashboard** — clients, projects, tasks, feedback replies, review moderation, website enquiries.

Stack: React 18 + Vite + Tailwind · Node.js + Express · MongoDB + Mongoose · JWT auth with bcrypt hashing.

---

## Running it locally

You need Node 18+ and a MongoDB instance (local `mongod` or a free Atlas cluster).

```bash
# 1. Backend
cd server
cp .env.example .env          # fill in MONGO_URI and the two JWT secrets
npm install
npm run seed                  # optional: demo admin, clients, projects, tasks, one review
npm run dev                   # http://localhost:5000

# 2. Frontend (second terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to port 5000, so no CORS setup is needed in development.

### Generating the JWT secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it twice — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.

### Seeded logins

| Role   | Email                  | Password        |
|--------|------------------------|-----------------|
| Admin  | `admin@kestrel.dev`    | `ChangeMe123!`  |
| Client | `ayesha@northwind.co`  | `ClientPass123!`|
| Client | `daniel@lumen.io`      | `ClientPass123!`|

Change the admin password immediately on any real deployment.

---

## Project structure

```
server/
├── config/        env loading, DB connection, shared enums
├── controllers/   thin HTTP layer — parse, call a service, respond
├── middleware/    auth, role gates, validation, uploads, rate limits, error handler
├── models/        Mongoose schemas: User, Project, Task, Comment, Feedback,
│                  Review, Notification, ContactMessage, File
├── routes/        one router per resource, mounted in routes/index.js
├── services/      business logic, reusable across controllers
├── utils/         ApiError, response shape, pagination, tokens, logger
├── validators/    express-validator rule sets
├── scripts/seed.js
├── app.js         express app: security, parsing, routes, error handling
└── server.js      DB connect, listen, graceful shutdown

client/src/
├── components/ui/       Button, Card, Modal, Table, StatusBadge, Skeleton, EmptyState…
├── components/public/   Hero, Services, VideoSection, Portfolio, Process, About,
│                        Testimonials, ContactForm, Navbar, Footer
├── components/portal/   PageHeader, NotificationBell
├── context/             AuthContext (session), ToastContext (notices)
├── hooks/               useFetch / useAction (loading + error state), useDebounce
├── layouts/             PublicLayout, DashboardLayout (portal and admin share it)
├── pages/               public · auth · portal · admin
├── routes/              AppRoutes (lazy-loaded), ProtectedRoute
├── services/            axios instance with silent refresh, endpoint map
└── utils/               formatters, shared constants
```

---

## How the security works

- Passwords are hashed with bcrypt (12 rounds by default) in a Mongoose pre-save hook, and the
  `password` field is `select: false`, so it never leaves the database by accident.
- A short-lived **access token** (15 min) is held in memory by the React app; the **refresh token**
  is an httpOnly, SameSite cookie scoped to `/api/auth`. On a 401 the axios interceptor refreshes
  once and replays the request.
- Every protected route re-loads the user from the database, so deactivating an account takes
  effect immediately, and tokens issued before a password change are rejected.
- **Ownership is enforced in the query, not after it.** `Project.find({ client: user._id, ... })`
  means changing an id in the URL returns 404, not someone else's project. The same pattern covers
  tasks, comments, feedback and reviews — this is the IDOR protection.
- `helmet`, `express-mongo-sanitize`, `hpp`, CORS allow-listing, request size limits and three
  tiers of rate limiting (general, auth, contact form) are applied in `app.js`.
- Uploads are restricted by MIME type and size, stored under a random filename, and recorded in a
  `File` document tied to a project so access can be authorised.
- The global error handler maps known failures to friendly messages and masks everything else as a
  500 — internal errors and stack traces are logged, never sent to the browser.

---

## API

All responses share one shape:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "pages": 4, "total": 37 } }
```

Errors return `{ "success": false, "message": "...", "errors": { "field": "why" } }`.

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` `/login` `/refresh` `/logout` | public |
| POST | `/api/auth/forgot-password` `/reset-password` | public |
| GET / PATCH | `/api/auth/me`, `/api/auth/password` | signed in |
| GET | `/api/projects/public` | public |
| GET | `/api/projects`, `/api/projects/:id` | signed in (scoped) |
| POST / PUT / PATCH / DELETE | `/api/projects…` | admin, manager |
| GET / POST / PUT / DELETE | `/api/tasks…` | read scoped, writes staff |
| GET / POST | `/api/comments/project/:projectId`, `/api/comments` | project members |
| GET / POST | `/api/feedback`, `/api/feedback/:id/replies` | client raises, staff replies |
| PATCH | `/api/feedback/:id/status` | admin, manager |
| GET | `/api/reviews/public` | public — approved only |
| POST | `/api/reviews` | client, completed projects only |
| PATCH / DELETE | `/api/reviews/:id/moderate`, `/api/reviews/:id` | admin |
| GET / PUT | `/api/notifications`, `/api/notifications/:id/read` | owner |
| POST | `/api/contact` | public, rate limited |
| GET / PATCH / DELETE | `/api/contact…` | admin, manager |
| GET | `/api/dashboard/client`, `/api/dashboard/admin` | role-matched |
| POST / DELETE | `/api/files` | signed in, project-scoped |

---

## Performance choices

- Routes behind sign-in are `React.lazy`-loaded, and vendor code is split into its own chunk, so a
  website visitor never downloads the portal or admin bundles.
- The promo video mounts its iframe only after a click — no third-party bytes on first paint.
- Lists are paginated on the server; dashboard figures use aggregation and `countDocuments`
  rather than loading rows.
- Compound indexes on `{ client, status }`, `{ project, status, dueDate }` and
  `{ user, isRead, createdAt }` back the queries each screen actually runs.
- Search inputs are debounced; notifications poll once a minute (swap for websockets when volume
  justifies it).

---

## Deploying

**Backend** — any Node host (Render, Railway, Fly, a VPS behind nginx). Set every variable from
`.env.example`, set `NODE_ENV=production` and `CLIENT_URL` to your real frontend origin, and put
uploads on a persistent volume or move `middleware/upload.js` to S3-compatible storage.

**Frontend** — `npm run build` produces `client/dist`, which any static host serves. Set
`VITE_API_URL` to the deployed API origin and make sure that origin is in `CLIENT_URL` on the
server. Configure a catch-all rewrite to `index.html` so client-side routes resolve.

**Database** — MongoDB Atlas. Indexes are declared in the schemas and created on connection.

---

## What to do next

The pieces most worth adding after your first deploy, in order: email templates for project and
task notifications; websockets in place of the notification poll; file upload UI in the project
pages (the API and `File` model are ready); an audit log for admin actions; and automated tests
around the ownership rules in `services/project.service.js` and `services/task.service.js`.
