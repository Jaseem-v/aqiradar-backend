# AQIRadar Backend

Standalone **Express + Mongoose + TypeScript** REST API for the AQIRadar admin.
JWT authentication, role-based access, and CRUD for Posts, Purifiers, Cities and Users.

Uses a **separate MongoDB database** (`aqi_admin`) on the existing cluster so it never
touches the existing Payload data in the `aqi` database.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # a working .env is already committed for local dev
npm run seed              # creates the admin user + seeds purifiers & cities
npm run dev               # http://localhost:5000
```

Default admin (from `.env`): `admin@aqiradar.local` / `changeme123` — change these.

## Scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Dev server with hot reload (tsx watch)   |
| `npm run build`   | Compile TypeScript → `dist/`             |
| `npm start`       | Run compiled server                      |
| `npm run seed`    | Seed admin user, purifiers, cities (idempotent) |

## API

Base URL: `http://localhost:5000/api`

Auth: send `Authorization: Bearer <token>` for protected routes.

| Method | Route             | Access        |
| ------ | ----------------- | ------------- |
| POST   | `/auth/login`     | public        |
| GET    | `/auth/me`        | authenticated |
| GET    | `/posts`, `/purifiers`, `/cities` | public (list & get) |
| POST/PATCH/DELETE | `/posts`, `/purifiers`, `/cities` | authenticated |
| GET    | `/media`          | public (list)  |
| POST   | `/media`          | authenticated (multipart, field `file`) |
| DELETE | `/media/:id`      | authenticated  |
| *      | `/users`          | **admin only** |

List endpoints support `?page=`, `?limit=`, `?search=`, `?sort=`.

## Images / uploads

`POST /api/media` accepts a multipart `file` (images only, max `MAX_UPLOAD_MB`), stores it via
the configured **storage driver**, records metadata in the `media` collection, and returns a
`url`. Deleting a media record also deletes the underlying file (via whichever driver stored it).

### Storage drivers (env-controlled, with local fallback)

Set `STORAGE_DRIVER=s3` or `local`. If unset it defaults to `s3` when `S3_BUCKET` is present,
otherwise `local`. **If `s3` is selected but not fully configured, it automatically falls back
to local disk** (logged on boot).

- **local** — files saved to `backend/uploads/` (gitignored), served at `/uploads/<file>`.
  Not durable on serverless/ephemeral hosts.
- **s3** — AWS S3 or any S3-compatible store (Cloudflare R2, MinIO, DigitalOcean Spaces).
  Configure `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and
  optionally `S3_ENDPOINT`, `S3_PUBLIC_URL` (CDN), `S3_PREFIX`, `S3_FORCE_PATH_STYLE`.

The driver abstraction lives in `src/storage/` (`local.ts`, `s3.ts`, `index.ts`); each `media`
record stores its `driver` and `key`, so switching drivers later won't break deletes of old files.

## Backfill existing content

`npm run backfill` migrates existing content from the Payload database (`aqi`) into `aqi_admin`:

- **media** — metadata + URLs (marked `driver: "external"`)
- **posts** — lexical rich-text bodies converted to HTML; cover images and embedded uploads
  resolved to URLs

Idempotent (media upsert by filename, posts upsert by slug) and read-only against the source.
Configure the source with `BACKFILL_SOURCE_URI` (defaults to the same cluster, db `aqi`).
Backfilled media use the Payload relative paths (e.g. `/api/media/file/x.jpg`); set
`FRONTEND_URL` before running to rewrite them as absolute URLs.

## Environment

See `.env.example`. Key vars: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, `PORT`,
and the `SEED_ADMIN_*` values used by `npm run seed`.
