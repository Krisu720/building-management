import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

const runId = randomUUID().slice(0, 8);
const emailDomain = `e2e-${runId}.test`;
const building = {
  name: `Budynek E2E ${runId}`,
  address: 'ul. Testowa 1, Warszawa',
};
// 1×1 px PNG
const photo = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAQH/7I9PfQAAAABJRU5ErkJggg==',
  'base64',
);

let db: pg.Client;
let buildingId: string;

test.beforeAll(async () => {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('Brak DATABASE_URL. Uruchom przez `pnpm test:e2e`.');
  }
  db = new pg.Client({ connectionString });
  await db.connect();

  const { rows } = await db.query<{ id: string }>(
    'insert into buildings (name, address) values ($1, $2) returning id',
    [building.name, building.address],
  );
  buildingId = rows[0]!.id;
  await db.query(
    `insert into apartments (building_id, number) values ($1, '12'), ($1, '14')`,
    [buildingId],
  );
});

test.afterAll(async () => {
  if (!db) return;
  await db.query('delete from buildings where id = $1', [buildingId]);
  await db.query('delete from "user" where email like $1', [`%@${emailDomain}`]);
  await db.end();
});

async function signUpResident(page: Page, baseURL: string) {
  const response = await page.request.post('/api/auth/sign-up/email', {
    headers: { origin: baseURL },
    data: {
      name: 'Jan Mieszkaniec',
      email: `${randomUUID()}@${emailDomain}`,
      password: 'haslo-testowe-123',
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function openForm(page: Page, baseURL: string) {
  await signUpResident(page, baseURL);
  await page.goto('/requests');
  await expect(
    page.getByRole('heading', { name: 'Zgłoś usterkę' }),
  ).toBeVisible();
  return page.locator('form');
}

async function submittedIssueNumber(page: Page) {
  const status = page.getByRole('status');
  await expect(status).toContainText(
    'Zgłoszenie zostało zapisane. Numer zgłoszenia:',
  );
  const label = (await status.locator('p').nth(1).textContent())?.trim();
  expect(label).toMatch(/^#\d+$/);
  return { label: label!, number: Number(label!.slice(1)) };
}

test('mieszkaniec wysyła zgłoszenie usterki w mieszkaniu', async ({
  page,
  baseURL,
}) => {
  const form = await openForm(page, baseURL!);

  await expect(form.getByRole('radio', { name: 'Mieszkanie' })).toBeChecked();
  await form
    .getByRole('textbox', { name: 'Rodzaj usterki' })
    .fill('Cieknący kran w kuchni');

  const apartment = form.getByRole('combobox', { name: 'Mieszkanie' });
  await expect(apartment).toBeDisabled();
  await form
    .getByRole('combobox', { name: 'Budynek' })
    .selectOption({ label: `${building.name} — ${building.address}` });
  await expect(apartment).toBeEnabled();
  await apartment.selectOption({ label: 'Mieszkanie 12' });

  const description = 'Kran cieknie od wczoraj, woda kapie nawet po zakręceniu.';
  await form.getByRole('textbox', { name: 'Opis problemu' }).fill(description);
  await expect(form.getByText(`${description.length} / 1200`)).toBeVisible();

  await form.locator('input[type="file"]').setInputFiles({
    name: 'kran.png',
    mimeType: 'image/png',
    buffer: photo,
  });
  await expect(
    form.getByRole('list', { name: 'Dodane zdjęcia' }).getByText('kran.png'),
  ).toBeVisible();
  await expect(form.getByText('1 / 5')).toBeVisible();

  await form.getByRole('button', { name: 'Wyślij zgłoszenie' }).click();

  await expect(
    page.getByRole('heading', { name: 'Zgłoszenie wysłane' }),
  ).toBeVisible();
  const issue = await submittedIssueNumber(page);
  await expect(
    page.getByRole('heading', { name: 'Cieknący kran w kuchni' }),
  ).toBeVisible();
  const details = page.locator('dl').filter({ hasText: 'Dotyczy' });
  await expect(details).toContainText('Mieszkania');
  await expect(details).toContainText(`${building.name} — ${building.address}`);
  await expect(details).toContainText('Numer mieszkania12');
  await expect(page.getByText(description)).toBeVisible();

  const { rows } = await db.query<{
    title: string;
    description: string;
    status: string;
    building_id: string;
    apartment_number: string | null;
  }>(
    `select i.title, i.description, i.status, i.building_id, a.number as apartment_number
       from issues i left join apartments a on a.id = i.apartment_id
      where i.number = $1`,
    [issue.number],
  );
  expect(rows).toEqual([
    {
      title: 'Cieknący kran w kuchni',
      description,
      status: 'new',
      building_id: buildingId,
      apartment_number: '12',
    },
  ]);

  await page
    .getByRole('main')
    .getByRole('link', { name: 'Moje zgłoszenia' })
    .click();
  await expect(page).toHaveURL(/\/my-requests$/);
  const item = page
    .getByRole('list', { name: 'Moje zgłoszenia' })
    .getByRole('article', { name: 'Cieknący kran w kuchni' });
  await expect(item).toContainText('Nowe');
  await expect(item).toContainText('Mieszkanie 12');
  await expect(item).toContainText(issue.label);
});

test('mieszkaniec wysyła zgłoszenie usterki w części wspólnej', async ({
  page,
  baseURL,
}) => {
  const form = await openForm(page, baseURL!);

  await form.getByRole('radio', { name: 'Część wspólna' }).check();
  await form
    .getByRole('textbox', { name: 'Rodzaj usterki' })
    .fill('Nie działa winda');
  await form
    .getByRole('combobox', { name: 'Budynek' })
    .selectOption({ label: `${building.name} — ${building.address}` });
  await form
    .getByRole('textbox', { name: 'Miejsce usterki' })
    .fill('Klatka B, parter');
  await form
    .getByRole('textbox', { name: 'Opis problemu' })
    .fill('Winda stoi na parterze i nie reaguje na przyciski.');

  await form.getByRole('button', { name: 'Wyślij zgłoszenie' }).click();

  await expect(page.getByRole('heading', { name: 'Nie działa winda' })).toBeVisible();
  const issue = await submittedIssueNumber(page);
  const details = page.locator('dl').filter({ hasText: 'Dotyczy' });
  await expect(details).toContainText('Części wspólnej');
  await expect(details).not.toContainText('Numer mieszkania');
  await expect(page.getByText('Miejsce usterki: Klatka B, parter')).toBeVisible();

  const { rows } = await db.query<{ apartment_id: string | null; description: string }>(
    'select apartment_id, description from issues where number = $1',
    [issue.number],
  );
  expect(rows).toEqual([
    {
      apartment_id: null,
      description:
        'Miejsce usterki: Klatka B, parter\n\nWinda stoi na parterze i nie reaguje na przyciski.',
    },
  ]);

  await page.getByRole('button', { name: 'Wyślij kolejne zgłoszenie' }).click();
  await expect(
    page.getByRole('heading', { name: 'Szczegóły zgłoszenia' }),
  ).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'Rodzaj usterki' })).toHaveValue('');
  await expect(form.getByRole('textbox', { name: 'Rodzaj usterki' })).toBeFocused();
});

test('formularz pokazuje błędy walidacji przy pustych polach', async ({
  page,
  baseURL,
}) => {
  const form = await openForm(page, baseURL!);
  const submit = form.getByRole('button', { name: 'Wyślij zgłoszenie' });

  await expect(submit).toBeDisabled();
  await form.getByRole('radio', { name: 'Część wspólna' }).check();
  await submit.click();

  await expect(form.getByText('Wpisz temat usterki.')).toBeVisible();
  await expect(form.getByText('Wybierz budynek.')).toBeVisible();
  await expect(form.getByText('Podaj miejsce usterki.')).toBeVisible();
  await expect(form.getByText('Opisz problem.')).toBeVisible();
  await expect(
    form.getByRole('textbox', { name: 'Rodzaj usterki' }),
  ).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByRole('heading', { name: 'Szczegóły zgłoszenia' }),
  ).toBeVisible();
});
