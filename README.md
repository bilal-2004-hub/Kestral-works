# Kestrel Works — company website, client portal and admin dashboard

A production-shaped full-stack application in three parts that share one Firebase/Firestore database and one API:

1. **Public website** — hero, services, video, portfolio, process, about, testimonials, contact.
2. **Client portal** — each client sees only their own projects, tasks, feedback, reviews and notifications.
3. **Admin dashboard** — clients, projects, tasks, feedback replies, review moderation, website enquiries.

Stack: React 18 + Vite + Tailwind · Node.js + Express · Firebase Admin / Firestore · Firebase Auth & JWT auth.

---

## Running it locally

You need Node 18+ and a Firebase project with Firestore enabled.

```bash
# 1. Backend
cd server
cp .env.example .env          # fill in Firebase credentials and JWT secrets
npm install
npm run seed                  # optional: demo admin, clients, projects, tasks, one review in Firestore
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
├── config/        env loading, Firebase Admin init, shared enums
├── controllers/   thin HTTP layer — parse, call a service, respond
├── middleware/    auth (Firebase token / JWT), role gates, validation, uploads, rate limits, error handler
├── routes/        one router per resource, mounted in routes/index.js
├── services/      business logic, reusable across controllers (firestoreService)
├── utils/         ApiError, response shape, pagination, tokens, logger
├── validators/    express-validator rule sets
├── scripts/       seedFirestore.js & seed.js
├── app.js         express app: security, parsing, routes, error handling
└── server.js      listen, graceful shutdown

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

- Passwords are encrypted with bcrypt when registered locally, and password hashes are never returned in user API responses. Firebase Auth can also be used directly for client & admin authentication.
- A short-lived **access token** (15 min) is held in memory by the React app; the **refresh token** is an httpOnly, SameSite cookie scoped to `/api/auth`. On a 401 the axios interceptor refreshes once and replays the request.
- Every protected route verifies credentials and loads the user from Firestore, so deactivating an account takes effect immediately.
- **Ownership is enforced in data queries.** Projects, tasks, feedback, comments, and reviews verify ownership and project access before returning or mutating data.
- `helmet`, `hpp`, CORS allow-listing, request size limits and three tiers of rate limiting (general, auth, contact form) are applied in `app.js`.
- Uploads are restricted by MIME type and size, stored in Firebase Storage (or local storage fallback), and recorded in Firestore.
- The global error handler maps known failures to friendly messages and masks everything else as a 500 — internal errors and stack traces are logged, never sent to the browser.

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

## Deploying to Railway

### Backend (Railway)
1. Link your repository or deploy the `server/` directory on Railway.
2. In Railway Service Settings, set root directory to `/server` (or run from root with start command: `node server/server.js`).
3. Set Environment Variables in Railway:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend-domain.com`
   - `JWT_ACCESS_SECRET=<generated_secret>`
   - `JWT_REFRESH_SECRET=<generated_secret>`
   - `FIREBASE_PROJECT_ID=my-company-portal-2eeb1`
   - `FIREBASE_CLIENT_EMAIL=<service_account_email>`
   - `FIREBASE_PRIVATE_KEY=<service_account_private_key_with_escaped_newlines>`
   - `FIREBASE_STORAGE_BUCKET=my-company-portal-2eeb1.firebasestorage.app`
   *(Do NOT set `MONGO_URI` — MongoDB has been completely removed).*

### Frontend
- Run `npm run build` from `client/` to produce `client/dist`.
- Deploy to Vercel, Netlify, or Railway static service.
- Set `VITE_API_URL` to your Railway backend URL.
