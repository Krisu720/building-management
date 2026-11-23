import { randomUUID } from 'node:crypto';
import { expect, type APIRequestContext } from '@playwright/test';
import pg from 'pg';

export const password = 'haslo-testowe-123';

export async function connectDb() {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('Brak DATABASE_URL. Uruchom przez `pnpm test:e2e`.');
  }
  const db = new pg.Client({ connectionString });
  await db.connect();
  return db;
}

export function testEmailDomain(runId: string) {
  return `e2e-${runId}.test`;
}

export type TestUser = { id: string; name: string; email: string };

export async function signUp(
  request: APIRequestContext,
  baseURL: string,
  { name, emailDomain }: { name: string; emailDomain: string },
): Promise<TestUser> {
  const email = `${randomUUID()}@${emailDomain}`;
  const response = await request.post('/api/auth/sign-up/email', {
    headers: { origin: baseURL },
    data: { name, email, password },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { user: { id: string } };
  return { id: body.user.id, name, email };
}

export async function setRole(db: pg.Client, userId: string, role: string) {
  await db.query('update "user" set role = $1 where id = $2', [role, userId]);
}

export async function signUpAdmin(
  db: pg.Client,
  request: APIRequestContext,
  baseURL: string,
  emailDomain: string,
) {
  const admin = await signUp(request, baseURL, {
    name: 'Anna Administratorka',
    emailDomain,
  });
  await setRole(db, admin.id, 'admin');
  return admin;
}

export async function insertBuilding(
  db: pg.Client,
  building: { name: string; address: string },
  apartmentNumbers: readonly string[] = [],
) {
  const { rows } = await db.query<{ id: string }>(
    'insert into buildings (name, address) values ($1, $2) returning id',
    [building.name, building.address],
  );
  const id = rows[0]!.id;
  const apartments = await insertApartments(db, id, apartmentNumbers);
  return { id, apartments };
}

export async function insertApartments(
  db: pg.Client,
  buildingId: string,
  numbers: readonly string[],
) {
  const apartments = new Map<string, string>();
  for (const number of numbers) {
    const { rows } = await db.query<{ id: string }>(
      'insert into apartments (building_id, number) values ($1, $2) returning id',
      [buildingId, number],
    );
    apartments.set(number, rows[0]!.id);
  }
  return apartments;
}

export async function cleanUp(
  db: pg.Client | undefined,
  { buildingIds, emailDomain }: { buildingIds: string[]; emailDomain: string },
) {
  if (!db) return;
  if (buildingIds.length) {
    await db.query('delete from buildings where id = any($1::uuid[])', [
      buildingIds,
    ]);
  }
  await db.query('delete from "user" where email like $1', [`%@${emailDomain}`]);
  await db.end();
}
