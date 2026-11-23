import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import type pg from 'pg';
import {
  cleanUp,
  connectDb,
  signUp,
  signUpAdmin,
  testEmailDomain,
} from './helpers';

const runId = randomUUID().slice(0, 8);
const emailDomain = testEmailDomain(runId);
const buildingIds: string[] = [];

let db: pg.Client;

test.beforeAll(async () => {
  db = await connectDb();
});

test.afterAll(async () => {
  await cleanUp(db, { buildingIds, emailDomain });
});

function buildingRow(page: Page, name: string) {
  return page
    .getByRole('table')
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name }) });
}

test('administrator dodaje budynek z mieszkaniami przez formularz', async ({
  page,
  baseURL,
}) => {
  await signUpAdmin(db, page.request, baseURL!, emailDomain);
  const name = `Budynek E2E ${runId} Brzozowa`;
  const address = 'ul. Brzozowa 9, 30-001 Kraków';

  await page.goto('/buildings');
  const openFormButton = page
    .getByRole('main')
    .locator('header')
    .getByRole('button', { name: 'Dodaj budynek' });
  await expect(openFormButton).toHaveAttribute('aria-expanded', 'false');
  await openFormButton.click();
  await expect(openFormButton).toHaveAttribute('aria-expanded', 'true');

  const form = page.getByRole('region', { name: 'Nowy budynek' });
  const nameInput = form.getByRole('textbox', { name: 'Nazwa budynku' });
  const addressInput = form.getByRole('textbox', { name: 'Adres' });
  const numberInput = form.getByRole('textbox', { name: 'Numer mieszkania' });
  const submit = form.getByRole('button', { name: 'Dodaj budynek' });
  await expect(nameInput).toBeFocused();

  await submit.click();
  await expect(form.getByText('Wpisz nazwę budynku.')).toBeVisible();
  await expect(form.getByText('Wpisz adres budynku.')).toBeVisible();
  await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
  await expect(addressInput).toHaveAttribute('aria-invalid', 'true');

  await nameInput.fill(`  ${name}  `);
  await addressInput.fill(address);

  await form.getByRole('button', { name: 'Zatwierdź' }).click();
  await expect(form.getByText('Wpisz numer mieszkania.')).toBeVisible();

  await numberInput.fill('10');
  await numberInput.press('Enter');
  await expect(numberInput).toHaveValue('');
  await expect(numberInput).toBeFocused();
  await numberInput.fill('2');
  await form.getByRole('button', { name: 'Zatwierdź' }).click();
  await numberInput.fill('7');
  await numberInput.press('Enter');

  await numberInput.fill(' 2 ');
  await numberInput.press('Enter');
  await expect(form.getByText('Ten numer już jest na liście.')).toBeVisible();
  await numberInput.fill('');

  const confirmed = form.getByRole('list', { name: 'Zatwierdzone mieszkania' });
  await expect(confirmed.getByRole('listitem')).toHaveText([
    'Mieszkanie 10',
    'Mieszkanie 2',
    'Mieszkanie 7',
  ]);
  await confirmed.getByRole('button', { name: 'Usuń mieszkanie 7' }).click();
  await expect(confirmed.getByRole('listitem')).toHaveText([
    'Mieszkanie 10',
    'Mieszkanie 2',
  ]);

  await submit.click();
  await expect(form).toBeHidden();
  await expect(openFormButton).toBeFocused();
  await expect(openFormButton).toHaveAttribute('aria-expanded', 'false');

  const { rows } = await db.query<{ id: string; address: string }>(
    'select id, address from buildings where name = $1',
    [name],
  );
  expect(rows).toHaveLength(1);
  buildingIds.push(rows[0]!.id);
  expect(rows[0]!.address).toBe(address);
  const apartments = await db.query<{ number: string }>(
    'select number from apartments where building_id = $1 order by number',
    [rows[0]!.id],
  );
  expect(apartments.rows.map(({ number }) => number)).toEqual(['10', '2']);

  const row = buildingRow(page, name);
  await expect(row.getByRole('cell').nth(0)).toHaveText(address);
  await expect(row.getByRole('cell').nth(1)).toHaveText('2');
  const toggle = row.getByRole('button', { name });
  await toggle.click();
  const details = page.locator(`[id="${await toggle.getAttribute('aria-controls')}"]`);
  await expect(details.getByRole('listitem')).toHaveText(['Mieszkanie 2', 'Mieszkanie 10']);
});

test('tylko administrator może tworzyć budynki i oglądać ich listę', async ({
  page,
  request,
  baseURL,
}) => {
  const data = { name: `Budynek E2E ${runId} bez uprawnień`, address: 'ul. Zakazana 1' };

  const anonymous = await request.post('/api/buildings', { data });
  expect(anonymous.status()).toBe(401);

  await signUp(page.request, baseURL!, { name: 'Jan Mieszkaniec', emailDomain });
  const resident = await page.request.post('/api/buildings', { data });
  expect(resident.status()).toBe(403);

  const { rowCount } = await db.query('select 1 from buildings where name = $1', [
    data.name,
  ]);
  expect(rowCount).toBe(0);

  await page.goto('/buildings');
  await expect(
    page.getByText('Ta strona jest dostępna dla administratora.'),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});
