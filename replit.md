# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── edu-assistant/      # AI Education Assistant frontend (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## AI Education Assistant

A full-stack AI-powered Q&A chatbot for students built with:
- React + Vite frontend with landing page and chat interface
- TF-IDF + Cosine Similarity matching for semantic search against the knowledge base
- 51 curated Q&A entries covering CS, AI, Programming, and Databases
- PostgreSQL storage for sessions, messages, and knowledge base

### Admin Panel

- Admin login at `/admin` — credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` secrets
- Admin dashboard at `/admin/dashboard` — protected by JWT (stored in localStorage `admin_token`)
  - Knowledge Base tab: full CRUD (add, edit, delete) for all knowledge entries
  - Chat Sessions tab: list all sessions with expandable message history
- Backend admin routes: `POST /api/admin/login`, `GET|POST|PUT|DELETE /api/admin/knowledge`, `GET /api/admin/sessions`

### User Authentication

- Users can sign up at `/signup` (username, email, password) or log in at `/login`
- JWT stored in localStorage `user_token`, expires in 7 days
- Chat page is protected — unauthenticated users are redirected to `/login`
- Navbar shows "Sign In" / "Get Started" for guests and username + logout for signed-in users
- Backend: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- Passwords hashed with bcryptjs (12 rounds)
- **Forgot Password**: `POST /api/auth/forgot-password` (generates 8-char uppercase token, expires 1hr); `POST /api/auth/reset-password` (verifies token, updates password); token stored in `password_reset_tokens` table
- **Profile Page**: `/profile` — shows username, email, join date, total sessions, total messages sent
- **User Profile Endpoint**: `GET /api/auth/profile` — returns user stats aggregated from chatSessions and chatMessages tables

### Seeding

To re-seed the knowledge base: `pnpm --filter @workspace/scripts run seed-knowledge`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/edu-assistant` (`@workspace/edu-assistant`)

React + Vite frontend for the AI Education Assistant.

- Landing page with hero, about, architecture, features, knowledge base preview, and developer sections
- Chat page with full-screen ChatGPT-like interface including:
  - **Dark/Light mode toggle** — persisted in localStorage, respects system preference on first load
  - **Pinned chats** — pin sessions to top of sidebar; pin indicator (📌) shown inline
  - **Share conversation** — generates a public share link; read-only `/share/:token` page for viewers
  - **Summarize conversation** — AI-generated bullet-point summary modal via GPT
  - **Change password** — modal in profile dropdown, requires current password verification
  - **Keyboard shortcuts modal** — opened via `?` key or toolbar button
  - **19+ other chat features** (see progress summary)
- Public **ShareView** page at `/share/:token` for shared conversations
- Uses `@workspace/api-client-react` hooks for API communication
- Dependencies: framer-motion, react-markdown, remark-gfm, clsx, tailwind-merge, recharts

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `health.ts`: GET /api/healthz
  - `chat.ts`: POST /api/chat/sessions, GET/POST /api/chat/sessions/:id/messages
  - `knowledge.ts`: GET /api/knowledge
- TF-IDF matching: `src/lib/tfidf.ts` — tokenization, TF-IDF vectorization, cosine similarity
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/chatSessions.ts` — chat sessions table
- `src/schema/chatMessages.ts` — chat messages table (user + assistant)
- `src/schema/knowledgeBase.ts` — curated knowledge base Q&A

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

- `seed-knowledge`: Seeds the knowledge base with 51 curated CS/AI Q&A entries
