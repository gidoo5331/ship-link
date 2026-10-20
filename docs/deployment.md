# Deployment & Hosting Context — ship-link

Use this file as context when debugging deployment, build, or runtime issues.
**Never commit real secrets.** Env var names are listed below; values live only in the hosting dashboards and local `.env`.
Instance-specific values (public URL, Neon project ID) are in `docs/deployment.local.md`, which is gitignored.

---

## Stack overview

| Layer | Tech | Host | Plan |
|---|---|---|---|
| Backend API | NestJS (Node 22) + Prisma | **Northflank** (managed cloud) | Developer Sandbox (free) |
| Database | PostgreSQL 18 | **Neon** (serverless Postgres) | Free plan |
| Frontend | Next.js | **Vercel** (planned / in progress) | Hobby (free) |
| File storage | — | Not set up yet (options: Neon Object storage or Cloudflare R2) | — |

- **Repo:** `gidoo5331/ship-link` (GitHub, **monorepo**)
- **Backend lives in:** `/backend`
- **Deploy branch:** `main`

---

## Backend — Northflank

- **Service name:** `ship-link`
- **Region:** Europe – West (London)
- **Resources:** 0.1 vCPU / **256 MB RAM** (very tight — watch for OOM)
- **CI/CD:** enabled — every push to `main` triggers a build + deploy

### Build config
- **Build type:** Heroku Buildpack (Node.js) — **no Dockerfile**
- **Build context:** `/backend`
- **Package manager:** Yarn v1 (buildpack detects `yarn.lock`)
- Buildpack runs `yarn install` → `yarn run build` → prunes devDependencies → runs `yarn start`

### Runtime config
- **Start command:** must be `node dist/src/main` (via Northflank **CMD override** and/or `"start"` script in `package.json`)
- **Port:** app must listen on `process.env.PORT` and host `0.0.0.0`; port must match the one in Northflank **Networking** (HTTP, public)

### Required `backend/package.json` scripts
```json
"scripts": {
  "build": "prisma generate && nest build",
  "postinstall": "prisma generate",
  "start": "node dist/src/main",
  "start:dev": "nest start --watch"
},
"engines": { "node": "22.x" }
```
- Node **22** is required: Prisma 7 pulls in `@prisma/streams-local`, which needs `>=22.0.0`
- `@prisma/client` must be in **dependencies**
- `prisma` CLI can stay in **devDependencies** (available at build time only)

### Required `main.ts` pattern
```ts
app.setGlobalPrefix('api/v1');
// CORS_ORIGINS env var (comma-separated); unset → allow all in dev, none in production
app.enableCors({ origin: corsOrigins, credentials: true });
await app.listen(process.env.PORT || 3000, '0.0.0.0');
```

---

## Database — Neon

- **Project:** `ship-link` 
- **Branch:** `production` (default)
- **Postgres version:** 18
- **Behaviour:** compute **scales to zero after ~5 min idle** (cannot be disabled on free). Wakes in a few hundred ms — first query after idle is slightly slower. Not an outage.
- Free plan limits: ~1 GB storage, limited compute hours (keep max autoscale low, e.g. 0.25–0.5 CU)

### Prisma connection config
The project uses **Prisma 7**: the connection URL lives in `backend/prisma.config.ts`, not in `schema.prisma`
(a `url` / `directUrl` in the `datasource` block is rejected in Prisma 7). The runtime client connects through
`@prisma/adapter-pg` using `DATABASE_URL`.

```ts
// prisma.config.ts — URL used by the CLI (migrate, db push)
datasource: {
  url: process.env["DATABASE_URL"],
},
```
- Runtime (app, via adapter-pg): Neon **pooled** URL (`-pooler` host)
- Migrations (CLI): `prisma.config.ts` uses `DIRECT_URL` (Neon **direct**, no `-pooler`) when set, else falls back to `DATABASE_URL`

### Migrations
Run locally from `/backend` with Neon URLs in `.env`:
```bash
npx prisma migrate deploy   # if using migrations
npx prisma db push          # only if project never used migrations
```

---

## Environment variables (names only)

Set in Northflank → Service → **Environment → Runtime variables**. Restart service after changes.

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (`-pooler`, `?sslmode=require`) |
| `DIRECT_URL` | Neon **direct** connection string (`?sslmode=require`) |
| `JWT_SECRET` | Auth signing secret |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (e.g. the Vercel URL) |
| `NODE_OPTIONS` | `--max-old-space-size=200` (keeps Node under 256 MB) |
| *(others)* | Any other keys from local `backend/.env` |

Northflank also injects `NF_*` variables automatically (e.g. `NF_REGION`, `NF_HOSTS`) — don't override them.


---

## Issues already hit & fixes

| Symptom | Cause | Fix |
|---|---|---|
| Build fails: `TS2339: Property 'role' / 'user' / 'rolePermission' does not exist on type 'PrismaService'` | Prisma client not generated on build server | `"build": "prisma generate && nest build"` + `"postinstall": "prisma generate"` |
| Runtime: `/bin/sh: nest: not found`, exit code 127, container restarting | `start` script was `nest start`; Nest CLI is a devDependency and gets pruned | Start command `node dist/src/main` (CMD override and/or `package.json`) |
| Build fails: `@prisma/streams-local: The engine "node" is incompatible ... Expected ">=22.0.0". Got "20.x"` | `engines.node` set to `20.x`; Prisma 7 needs Node 22 | `"engines": { "node": "22.x" }` |
| Runtime: `Error: Cannot find module '/workspace/dist/main'` | `prisma.config.ts` and `generated/` are compiled too, so output root is the backend folder → entry is `dist/src/main.js` | Start command `node dist/src/main` |
| Browser shows `no healthy upstream` | App not running / crashing, or port mismatch | Check Logs; confirm start command, port, `0.0.0.0`, env vars |

---

## Debugging checklist

1. **Northflank → Builds:** did the latest build pass? If not, read build logs (TypeScript/Prisma errors).
2. **Northflank → Logs (live tailing):** look for `Nest application successfully started`.
   - `exit code 127` / `not found` → start command wrong
   - Prisma / `P1001` / connection errors → `DATABASE_URL` missing/wrong, or `sslmode=require` missing
   - repeated restarts with no error → likely **OOMKilled** (check **Events**); reduce memory use
3. **Northflank → Networking:** port matches app's listen port; set to HTTP + public.
4. **Northflank → Environment:** all required vars present; restart after editing.
5. **Neon dashboard → Monitoring / SQL Editor:** DB reachable, tables exist.
6. **CORS errors in browser:** add the Vercel URL to the `CORS_ORIGINS` env var and restart.

## Constraints to keep in mind
- 256 MB RAM: avoid heavy in-process work, large in-memory caches, or loading big files into memory.
- Free tiers on all services — no paid add-ons without asking.
- Don't change the build context, region, or hosting providers without confirming first.
