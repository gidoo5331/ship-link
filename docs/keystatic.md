# Website content (Keystatic)

The website (`apps/website`) reads its content from files edited in
[Keystatic](https://keystatic.com), a CMS that lives at `/keystatic`. This is a
stopgap so clients can try editing the site. Later the ShipLink backend takes
over, and only `apps/website/lib/content.ts` needs to change.

## What's editable

| In the editor | Stored in | Used by |
|---|---|---|
| Company details (name, logo, tagline, home text, about, contacts) | `content/company.json`, `public/images/company/` | navbar, footer, home, about, contact, page titles |
| Cars | `content/cars/<slug>.json`, `public/images/cars/<slug>/images/<n>.<ext>` | `/cars`, `/cars/<slug>`, featured cars on home |
| Products | `content/products/<slug>.json`, `public/images/products/<slug>/images/<n>.<ext>` | `/products`, `/products/<slug>` |
| Product categories | `content/categories/<slug>.json` | product tabs (sorted by "Order") |

Paths are relative to `apps/website`. The schema is in
`apps/website/keystatic.config.ts`.

Notes:

- Unticking **Available** hides a car or product from the site. It stays in the editor.
- The first photo is the cover image.
- Keystatic names photos `images/0.jpg`, `images/1.jpg`, and so on, by position. It
  renames them when you reorder photos, so don't link to the image files directly.
- The listing name or product name sets the web address (the slug).
- A category only shows on `/products` if it has at least one available product.

## Editing locally

```bash
cd apps/website
yarn dev            # then open http://localhost:3001/keystatic
```

With `NEXT_PUBLIC_KEYSTATIC_STORAGE=local` (the default), saves go straight to
the files above. Review them with `git diff` and commit them like code.

## Letting clients edit the deployed site

Vercel's filesystem is read-only, so the deployed editor has to save through
GitHub. Every save is a commit, and Vercel then redeploys. Changes go live in
about 1–2 minutes, not instantly.

### Option A: Keystatic Cloud (recommended for clients)

Clients sign in with an email address and don't need a GitHub account.

1. Sign in at [keystatic.cloud](https://keystatic.cloud), create a team and a
   project, and connect the `gidoo5331/ship-link` repo. Keystatic's GitHub App
   needs access to the repo.
2. In the Vercel project for the website, set:
   - `NEXT_PUBLIC_KEYSTATIC_STORAGE=cloud`
   - `NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT=<team>/<project>`
3. Redeploy, then invite clients from the project's settings on keystatic.cloud.
4. Clients edit at `https://<site>/keystatic`.

The free plan covers a small number of users. Check keystatic.cloud for the
current limits.

### Option B: GitHub sign-in

Every editor needs a GitHub account with write access to the repo. This suits
the team better than clients.

1. Locally, set `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` in `apps/website/.env` and
   open `/keystatic`. Keystatic walks you through creating a GitHub App and
   writes these into `.env`: `KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and
   `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
2. Install the GitHub App on the repo.
3. Copy those values and `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` into Vercel.
4. In the GitHub App settings, add `https://<site>/api/keystatic/github/oauth/callback`
   as a callback URL.

**Never commit `.env`.** The repo is public, and these values are secrets.

### Branches

Remote saves commit to the repo's default branch (`main`). Production deploys
from `main`, so client edits go live there. To give clients a test site,
deploy a separate Vercel preview from another branch. Keystatic lets you pick
that branch in the editor's branch menu.

Merge or rebase regularly, so client content commits and code changes on other
branches don't conflict in `content/` or `public/images/`.

## Environment variables

See `apps/website/.env.example`.
