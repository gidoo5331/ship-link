/**
 * Seed a company's catalog with the website's demo cars and products
 * (apps/website/data/cars.ts and products.ts).
 *
 *   yarn seed:demo-catalog --subdomain smoke-motors [--draft] [--yes]
 *
 * - Creates the categories it needs (Cars, Generators, Lighting…) if missing.
 * - Skips any product whose slug the company already has, so it's safe to re-run.
 * - Products are published (so they show on the website) unless --draft.
 * - Images stay as the demo's external URLs; replace them with real photos in the portal.
 *
 * Uses DATABASE_URL from backend/.env. Shows the target database and asks first unless --yes.
 * Plain .mjs (not part of the Nest build) so it can import the website's .ts data files
 * via Node's type stripping.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import pg from 'pg';

const { cars } = await import('../../apps/website/data/cars.ts');
const { products } = await import('../../apps/website/data/products.ts');

const USAGE = 'Usage: yarn seed:demo-catalog --subdomain <company-subdomain> [--draft] [--yes]';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const { values } = parseArgs({
  options: {
    subdomain: { type: 'string' },
    draft: { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});
if (values.help) {
  console.log(USAGE);
  process.exit(0);
}
if (!values.subdomain) fail(`--subdomain is required.\n\n${USAGE}`);

// ── Demo data, shaped like Product rows ──────────────────────────────────────

const CAR_SPECS = ['Year', 'Condition', 'Colour', 'Mileage', 'Engine', 'Transmission'];

const demo = [
  ...cars.map((car) => ({
    slug: car.slug,
    name: `${car.year} ${car.make} ${car.model}`,
    category: 'Cars',
    description: car.description,
    price: car.price,
    available: car.available,
    images: car.images,
    specs: [
      { label: 'Year', value: String(car.year) },
      { label: 'Condition', value: car.condition },
      { label: 'Colour', value: car.color },
      { label: 'Mileage', value: `${car.mileage.toLocaleString('en-US')} km` },
      { label: 'Engine', value: car.engineSize },
      { label: 'Transmission', value: car.transmission },
    ],
    features: car.features,
  })),
  ...products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    available: p.available,
    images: p.images,
    specs: p.specs.map((s) => ({ label: s.label, value: String(s.value) })),
    features: p.features,
  })),
];

// one category per distinct name; spec template from its first product
const categoryNames = [...new Set(demo.map((d) => d.category))];
const specTemplate = (name) =>
  name === 'Cars' ? CAR_SPECS : (demo.find((d) => d.category === name)?.specs.map((s) => s.label) ?? []);

// ── Run ──────────────────────────────────────────────────────────────────────

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) fail('DATABASE_URL is not set (backend/.env or environment).');

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const company = (
    await client.query('SELECT id, name FROM companies WHERE subdomain = $1', [values.subdomain])
  ).rows[0];
  if (!company) fail(`No company with subdomain "${values.subdomain}".`);

  const existing = new Set(
    (await client.query('SELECT slug FROM products WHERE "companyId" = $1', [company.id])).rows.map(
      (r) => r.slug,
    ),
  );
  const toAdd = demo.filter((d) => !existing.has(d.slug));

  console.log(`
  Database    ${new URL(databaseUrl.replace(/^prisma\+/, '')).host}
  Company     ${company.name} (${values.subdomain})
  Categories  ${categoryNames.join(', ')} (created if missing)
  Products    ${toAdd.length} to add, ${demo.length - toAdd.length} already there
  Status      ${values.draft ? 'drafts' : 'published (visible on the website)'}`);

  if (toAdd.length === 0) {
    console.log('\n  Nothing to do.\n');
    process.exit(0);
  }

  if (!values.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\n  Seed these products? [y/N] ');
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('  Cancelled.');
      process.exit(0);
    }
  }

  await client.query('BEGIN');

  // categories: reuse by slug, create the rest at the end of the list
  const categoryIds = new Map();
  let nextOrder =
    ((await client.query('SELECT MAX("sortOrder") AS m FROM categories WHERE "companyId" = $1', [company.id]))
      .rows[0].m ?? -1) + 1;
  for (const name of categoryNames) {
    const slug = slugify(name);
    const found = (
      await client.query('SELECT id FROM categories WHERE "companyId" = $1 AND slug = $2', [company.id, slug])
    ).rows[0];
    if (found) {
      categoryIds.set(name, found.id);
      continue;
    }
    const id = randomUUID();
    await client.query(
      `INSERT INTO categories (id, "companyId", name, slug, "sortOrder", "specTemplate", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [id, company.id, name, slug, nextOrder++, specTemplate(name)],
    );
    categoryIds.set(name, id);
  }

  const publish = !values.draft;
  for (const d of toAdd) {
    await client.query(
      `INSERT INTO products (
         id, "companyId", "categoryId", slug, name, description, price, currency,
         status, availability, images, specs, features, "publishedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD',
         $8::"ProductStatus", $9::"ProductAvailability", $10, $11::jsonb, $12, $13, now(), now())`,
      [
        randomUUID(),
        company.id,
        categoryIds.get(d.category),
        d.slug,
        d.name,
        d.description,
        d.price,
        publish ? 'PUBLISHED' : 'DRAFT',
        d.available ? 'AVAILABLE' : 'SOLD',
        d.images,
        JSON.stringify(d.specs),
        d.features,
        publish ? new Date() : null,
      ],
    );
  }

  await client.query('COMMIT');
  console.log(`\n  ✔ Added ${toAdd.length} products to ${company.name}.\n`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await client.end();
}
