/**
 * Create an approved company and its COMPANY_ADMIN login.
 *
 *   yarn create:company-admin --company "GH Motors" --email ama@ghmotors.com \
 *     --first-name Ama --last-name Mensah [--subdomain gh-motors] [--password ...] [--phone ...] [--yes]
 *
 * Compiled with the app, so on a deployed container (devDependencies pruned)
 * run it directly: node dist/scripts/create-company-admin --company ...
 *
 * Uses DATABASE_URL from backend/.env (or the environment). Prints the target
 * database and asks before writing unless --yes is passed. Without --password
 * a random one is generated and printed once.
 */
import 'dotenv/config';
import { randomBytes } from 'crypto';
import { createInterface } from 'readline/promises';
import { parseArgs } from 'util';
import * as argon from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { RESOURCES } from '../src/shared/types/permissions.types';
import { slugify } from '../src/shared/utils/slugify';

const USAGE = `Usage:
  yarn create:company-admin --company "GH Motors" --email ama@ghmotors.com \\
    --first-name Ama --last-name Mensah [--subdomain gh-motors] [--password <min 8 chars>] [--phone +233...] [--yes]`;

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  const { values } = parseArgs({
    options: {
      company: { type: 'string' },
      subdomain: { type: 'string' },
      email: { type: 'string' },
      password: { type: 'string' },
      'first-name': { type: 'string' },
      'last-name': { type: 'string' },
      phone: { type: 'string' },
      yes: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  const companyName = values.company?.trim();
  const email = values.email?.trim().toLowerCase();
  const firstName = values['first-name']?.trim();
  const lastName = values['last-name']?.trim();
  if (!companyName || !email || !firstName || !lastName) {
    fail(`--company, --email, --first-name and --last-name are required.\n\n${USAGE}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`"${email}" is not a valid email.`);

  const subdomain = values.subdomain?.trim() || slugify(companyName);
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    fail('Subdomain can only contain lowercase letters, numbers and hyphens.');
  }

  const generated = !values.password;
  const password = values.password ?? randomBytes(9).toString('base64url');
  if (password.length < 8) fail('Password must be at least 8 characters.');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) fail('DATABASE_URL is not set (backend/.env or environment).');
  const dbHost = new URL(databaseUrl.replace(/^prisma\+/, '')).host;

  console.log(`
  Database   ${dbHost}
  Company    ${companyName}  (subdomain: ${subdomain}, status: APPROVED)
  Admin      ${firstName} ${lastName} <${email}>`);

  if (!values.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\n  Create this company? [y/N] ');
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('  Cancelled.');
      return;
    }
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      fail(`A user with email ${email} already exists.`);
    }
    if (await prisma.company.findUnique({ where: { subdomain } })) {
      fail(`Subdomain "${subdomain}" is taken. Pass a different --subdomain.`);
    }

    const passwordHash = await argon.hash(password);

    // same shape as CompanyService._createCompany: company + admin + "Full Access" role
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name: companyName,
          subdomain,
          status: 'APPROVED',
          users: {
            create: {
              firstName,
              lastName,
              email,
              phone: values.phone,
              password: passwordHash,
              systemRole: 'COMPANY_ADMIN',
            },
          },
        },
        include: { users: true },
      });

      const role = await tx.role.create({
        data: {
          name: 'Full Access',
          description:
            'Complete control — equivalent to the owner except billing and account-level actions',
          companyId: created.id,
          permissions: {
            create: RESOURCES.map((resource) => ({
              resource,
              actions: ['create', 'read', 'update', 'delete'],
            })),
          },
        },
      });

      await tx.user.update({
        where: { id: created.users[0].id },
        data: { roleId: role.id },
      });

      return created;
    });

    console.log(`
  ✔ Created ${company.name}

    Company ID   ${company.id}
    Subdomain    ${company.subdomain}
    Login        ${email}
    Password     ${generated ? `${password}   ← generated, shown only once` : '(the one you passed)'}
`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
