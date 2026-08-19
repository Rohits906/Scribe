# Scribe

A notes app split into a Node.js API and a TypeScript (React + Vite) client.

```
Scribe/
├── backend/     Node.js + Express API (ESM JavaScript)
│   └── src/
│       ├── server.js          HTTP server + graceful shutdown
│       ├── app.js             Express app: middleware + route mounting
│       ├── config/            Env-driven configuration
│       ├── routes/            URL → controller mapping
│       ├── controllers/       Request/response handling, validation
│       ├── services/          Business logic and data access
│       ├── middleware/        404 + centralized error handler
│       └── utils/             HttpError and shared helpers
└── frontend/    React + TypeScript client (Vite)
    └── src/
        ├── main.tsx           App bootstrap
        ├── App.tsx            Root component
        ├── api/               Typed fetch client + endpoint wrappers
        ├── components/        Presentational components
        ├── hooks/             Data-fetching / stateful logic
        ├── types/             Shared domain types
        └── styles/            Global CSS
```

## Getting started

Run each app in its own terminal.

```bash
# Terminal 1 — API on http://localhost:4000
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 — client on http://localhost:5173
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend, so the browser talks to a single
origin in development. For a deployed frontend, set `VITE_API_BASE_URL` instead.

## API

Everything is mounted under `/api`. Responses are enveloped as `{ "data": ... }`,
errors as `{ "error": { "message": ... } }`.

| Method | Path              | Description        |
| ------ | ----------------- | ------------------ |
| GET    | `/api/health`     | Liveness check     |
| GET    | `/api/notes`      | List notes         |
| POST   | `/api/notes`      | Create a note      |
| GET    | `/api/notes/:id`  | Fetch one note     |
| PUT    | `/api/notes/:id`  | Update a note      |
| DELETE | `/api/notes/:id`  | Delete a note      |

Notes live in an in-memory `Map` (`backend/src/services/note.service.js`) — they reset
on restart. Swap that module for a real database when you pick one; nothing above it
needs to change.

## Scripts

**backend:** `npm run dev` (watch mode) · `npm start` · `npm test`
**frontend:** `npm run dev` · `npm run build` · `npm run typecheck` · `npm run preview`
