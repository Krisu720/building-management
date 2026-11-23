import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type pg from 'pg';
import {
  cleanUp,
  connectDb,
  insertBuilding,
  signUpAdmin,
  testEmailDomain,
  type TestUser,
} from './helpers';

const runId = randomUUID().slice(0, 8);
const emailDomain = testEmailDomain(runId);
const building = { name: `Budynek E2E ${runId}`, address: 'ul. Przeglądowa 5, Gdańsk' };
const buildingOption = `${building.name} — ${building.address}`;
const technician = { name: `Tomasz Technik ${runId}` };
const buildingIds: string[] = [];

test.use({ timezoneId: 'Europe/Warsaw' });

let db: pg.Client;
let buildingId: string;
let technicianId: string;

test.beforeAll(async () => {
  db = await connectDb();
  const created = await insertBuilding(db, building, ['1', '2', '3']);
  buildingId = created.id;
  buildingIds.push(buildingId);

  technicianId = randomUUID();
  await db.query(
    `insert into "user" (id, name, email, role) values ($1, $2, $3, 'technician')`,
    [technicianId, technician.name, `${technicianId}@${emailDomain}`],
  );
});

test.afterAll(async () => {
  await cleanUp(db, { buildingIds, emailDomain });
});

function dateInDays(days: number) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(
    new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  );
}

async function openForm(page: Page, baseURL: string): Promise<{ admin: TestUser; form: Locator }> {
  const admin = await signUpAdmin(db, page.request, baseURL, emailDomain);
  await page.goto('/inspections/new');
  await expect(
    page.getByRole('heading', { name: 'Zaplanuj przegląd' }),
  ).toBeVisible();
  const form = page.locator('form');
  await expect(
    form.getByRole('combobox', { name: 'Budynek' }).getByRole('option', { name: buildingOption }),
  ).toBeAttached();
  await expect(
    form
      .getByRole('combobox', { name: 'Technik (opcjonalnie)' })
      .getByRole('option', { name: technician.name }),
  ).toBeAttached();
  return { admin, form };
}

async function browserISOString(page: Page, date: string, time: string) {
  return page.evaluate(
    ([d, t]) => new Date(`${d}T${t}`).toISOString(),
    [date, time] as const,
  );
}

type InspectionRow = {
  type: string;
  type_label: string | null;
  apartment_number: string | null;
  technician_id: string | null;
  status: string;
  scheduled_at: Date;
  history: { status: string; changed_by: string }[];
};

async function inspectionsInBuilding(type: string) {
  const { rows } = await db.query<InspectionRow>(
    `select i.type, i.type_label, a.number as apartment_number, i.technician_id,
            i.status, i.scheduled_at,
            (select json_agg(json_build_object('status', h.status, 'changed_by', h.changed_by))
               from inspection_history h where h.inspection_id = i.id) as history
       from inspections i left join apartments a on a.id = i.apartment_id
      where i.building_id = $1 and i.type = $2
      order by a.number nulls first`,
    [buildingId, type],
  );
  return rows;
}

test('administrator planuje przegląd części wspólnej z przypisanym technikiem', async ({
  page,
  baseURL,
}) => {
  const { admin, form } = await openForm(page, baseURL!);
  const audience = page.getByRole('complementary', { name: 'Odbiorcy przeglądu' });
  await expect(audience).toContainText('Wybierz budynek, żeby zobaczyć odbiorców przeglądu.');

  await expect(form.getByRole('radio', { name: 'Część wspólna' })).toBeChecked();

  const type = form.getByRole('combobox', { name: 'Rodzaj przeglądu' });
  await type.fill('gazowa');
  await page.getByRole('option', { name: 'Instalacja gazowa' }).click();
  await expect(type).toHaveValue('Instalacja gazowa');

  await form
    .getByRole('combobox', { name: 'Budynek' })
    .selectOption({ label: buildingOption });
  await expect(audience).toContainText(building.name);
  await expect(audience).toContainText(building.address);
  await expect(audience).toContainText('Przegląd dotyczy wszystkich mieszkańców tego budynku.');

  const date = dateInDays(30);
  await form.getByLabel('Data').fill(date);
  await form.getByLabel('Godzina').fill('10:30');
  await form
    .getByRole('combobox', { name: 'Technik (opcjonalnie)' })
    .selectOption({ label: technician.name });

  await form.getByRole('button', { name: 'Zaplanuj przegląd' }).click();

  const confirmation = form.getByRole('status');
  await expect(confirmation).toContainText('Przegląd został zaplanowany');
  await expect(confirmation).toContainText('Instalacja gazowa');
  await expect(confirmation).toContainText(
    `${building.name}, ${building.address} · Część wspólna`,
  );
  await expect(confirmation).toContainText(`Technik: ${technician.name}`);
  await expect(confirmation).toBeFocused();

  await expect(type).toHaveValue('');
  await expect(form.getByRole('combobox', { name: 'Budynek' })).toHaveValue('');
  await expect(form.getByLabel('Data')).toHaveValue('');

  const scheduledAt = await browserISOString(page, date, '10:30');
  expect(await inspectionsInBuilding('gas')).toEqual([
    {
      type: 'gas',
      type_label: null,
      apartment_number: null,
      technician_id: technicianId,
      status: 'scheduled',
      scheduled_at: new Date(scheduledAt),
      history: [{ status: 'scheduled', changed_by: admin.id }],
    },
  ]);

  await page.goto('/inspections');
  const item = page
    .getByRole('list', { name: 'Zaplanowane przeglądy' })
    .getByRole('article', { name: 'Instalacja gazowa' })
    .filter({ hasText: building.name });
  await expect(item).toContainText(`${building.name} — ${building.address}`);
  await expect(item).toContainText('Część wspólna');
  await expect(item).toContainText('Zaplanowany');
  await expect(item).toContainText(technician.name);
  await expect(item.locator('time')).toHaveAttribute('datetime', scheduledAt);
});

test('administrator planuje przegląd własnego rodzaju dla wybranych mieszkań', async ({
  page,
  baseURL,
}) => {
  const { form } = await openForm(page, baseURL!);
  const audience = page.getByRole('complementary', { name: 'Odbiorcy przeglądu' });
  const typeLabel = `Przegląd wentylacji ${runId}`;

  await form.getByRole('radio', { name: 'Wybrane mieszkania' }).check();
  const apartmentsGroup = form.getByRole('group', { name: 'Mieszkania' });
  await expect(apartmentsGroup).toContainText('Najpierw wybierz budynek.');

  const type = form.getByRole('combobox', { name: 'Rodzaj przeglądu' });
  await type.fill(typeLabel);
  await expect(page.getByRole('option', { name: `Użyj: ${typeLabel}` })).toBeVisible();
  await type.press('Escape');
  await expect(type).toHaveValue(typeLabel);

  await form
    .getByRole('combobox', { name: 'Budynek' })
    .selectOption({ label: buildingOption });
  await expect(apartmentsGroup.getByRole('checkbox')).toHaveCount(3);
  await expect(audience).toContainText('Zaznacz mieszkania, których dotyczy przegląd.');

  await apartmentsGroup.getByRole('checkbox', { name: 'Mieszkanie 1' }).check();
  await apartmentsGroup.getByRole('checkbox', { name: 'Mieszkanie 3' }).check();
  await expect(audience).toContainText('Przegląd dotyczy osób z poniższych mieszkań.');
  await expect(
    audience.getByRole('list', { name: 'Wybrane mieszkania' }).getByRole('listitem'),
  ).toHaveText(['Mieszkanie 1', 'Mieszkanie 3']);

  const date = dateInDays(45);
  await form.getByLabel('Data').fill(date);
  await form.getByLabel('Godzina').fill('08:15');

  await form.getByRole('button', { name: 'Zaplanuj przegląd' }).click();

  const confirmation = form.getByRole('status');
  await expect(confirmation).toContainText('Zaplanowano przeglądy (2)');
  await expect(confirmation).toContainText(typeLabel);
  await expect(confirmation).toContainText(
    `${building.name}, ${building.address} · Mieszkania: 1, 3`,
  );
  await expect(confirmation).not.toContainText('Technik:');

  const scheduledAt = new Date(await browserISOString(page, date, '08:15'));
  const rows = (await inspectionsInBuilding('other')).filter(
    (row) => row.type_label === typeLabel,
  );
  expect(rows).toEqual(
    ['1', '3'].map((number) => ({
      type: 'other',
      type_label: typeLabel,
      apartment_number: number,
      technician_id: null,
      status: 'scheduled',
      scheduled_at: scheduledAt,
      history: [expect.objectContaining({ status: 'scheduled' })],
    })),
  );

  await page.goto('/inspections');
  const items = page
    .getByRole('list', { name: 'Zaplanowane przeglądy' })
    .getByRole('article', { name: typeLabel });
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('Bez przypisania');
  await expect(items.filter({ hasText: 'Mieszkanie 1' })).toHaveCount(1);
  await expect(items.filter({ hasText: 'Mieszkanie 3' })).toHaveCount(1);
  await expect(items.filter({ hasText: 'Mieszkanie 2' })).toHaveCount(0);
});

test('formularz przeglądu pokazuje błędy walidacji i nic nie zapisuje', async ({
  page,
  baseURL,
}) => {
  const { form } = await openForm(page, baseURL!);
  const submit = form.getByRole('button', { name: 'Zaplanuj przegląd' });

  await submit.click();
  await expect(form.getByText('Wpisz rodzaj przeglądu.')).toBeVisible();
  await expect(form.getByText('Wybierz budynek.')).toBeVisible();
  await expect(form.getByText('Wybierz datę przeglądu.')).toBeVisible();
  await expect(form.getByText('Wybierz godzinę przeglądu.')).toBeVisible();
  await expect(
    form.getByRole('combobox', { name: 'Rodzaj przeglądu' }),
  ).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByRole('combobox', { name: 'Budynek' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );

  await form.getByRole('radio', { name: 'Wybrane mieszkania' }).check();
  await form.getByRole('combobox', { name: 'Rodzaj przeglądu' }).fill('Instalacja elektryczna');
  await form.getByRole('combobox', { name: 'Rodzaj przeglądu' }).press('Escape');
  await form
    .getByRole('combobox', { name: 'Budynek' })
    .selectOption({ label: buildingOption });
  await form.getByLabel('Data').fill(dateInDays(-1));
  await form.getByLabel('Godzina').fill('12:00');
  await submit.click();

  await expect(
    form.getByText('Wybierz co najmniej jedno mieszkanie w tym budynku.'),
  ).toBeVisible();
  await expect(form.getByText('Wybierz termin w przyszłości.')).toBeVisible();
  await expect(form.getByText('Wpisz rodzaj przeglądu.')).toHaveCount(0);
  await expect(form.getByText('Wybierz budynek.')).toHaveCount(0);
  await expect(form.getByRole('status')).toHaveCount(0);

  expect(await inspectionsInBuilding('electrical')).toEqual([]);

  await form.getByRole('button', { name: 'Wyczyść formularz' }).click();
  await expect(form.getByRole('combobox', { name: 'Rodzaj przeglądu' })).toHaveValue('');
  await expect(form.getByRole('radio', { name: 'Część wspólna' })).toBeChecked();
  await expect(form.getByRole('group', { name: 'Mieszkania' })).toHaveCount(0);
});
