import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import type pg from 'pg';
import {
  cleanUp,
  connectDb,
  insertApartments,
  insertBuilding,
  signUp,
  signUpAdmin,
  testEmailDomain,
} from './helpers';

const runId = randomUUID().slice(0, 8);
const emailDomain = testEmailDomain(runId);
const lipowa = { name: `Budynek E2E ${runId} Lipowa`, address: 'ul. Lipowa 7, Warszawa' };
const klonowa = { name: `Budynek E2E ${runId} Klonowa`, address: 'ul. Klonowa 3, Kraków' };
const buildingIds: string[] = [];

let db: pg.Client;
let lipowaId: string;
let lipowaApartments: Map<string, string>;
let klonowaApartments: Map<string, string>;

test.beforeAll(async () => {
  db = await connectDb();
  const first = await insertBuilding(db, lipowa, ['12', '14']);
  const second = await insertBuilding(db, klonowa, ['3']);
  buildingIds.push(first.id, second.id);
  lipowaId = first.id;
  lipowaApartments = first.apartments;
  klonowaApartments = second.apartments;
});

test.afterAll(async () => {
  await cleanUp(db, { buildingIds, emailDomain });
});

async function assignApartment(userId: string, apartmentId: string | null) {
  await db.query('update "user" set apartment_id = $1 where id = $2', [
    apartmentId,
    userId,
  ]);
}

function residentRow(page: Page, name: string) {
  return page
    .getByRole('table')
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name, exact: true }) });
}

function apartmentCell(page: Page, name: string) {
  return residentRow(page, name).getByRole('cell').nth(1);
}

test('administrator widzi mieszkańca przypisanego do mieszkania na liście mieszkańców', async ({
  page,
  request,
  baseURL,
}) => {
  const resident = await signUp(request, baseURL!, {
    name: `Jan Mieszkaniec ${runId}`,
    emailDomain,
  });
  const admin = await signUpAdmin(db, page.request, baseURL!, emailDomain);

  await page.goto('/residents');
  await expect(page.getByRole('heading', { name: 'Mieszkańcy', level: 1 })).toBeVisible();
  const row = residentRow(page, resident.name);
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell').nth(0)).toHaveText(resident.email);
  await expect(
    apartmentCell(page, resident.name).getByRole('button', {
      name: `Przypisz mieszkanie: ${resident.name}`,
    }),
  ).toBeVisible();
  await expect(residentRow(page, admin.name)).toHaveCount(0);

  await assignApartment(resident.id, lipowaApartments.get('12')!);
  await page.reload();
  const cell = apartmentCell(page, resident.name);
  await expect(cell).toContainText(lipowa.name);
  await expect(cell).toContainText(`${lipowa.address} · mieszkanie 12`);

  await assignApartment(resident.id, klonowaApartments.get('3')!);
  await page.reload();
  await expect(cell).toContainText(klonowa.name);
  await expect(cell).toContainText(`${klonowa.address} · mieszkanie 3`);
  await expect(cell).not.toContainText(lipowa.name);

  const api = await page.request.get('/api/residents');
  expect(api.status()).toBe(200);
  const residents = (await api.json()) as { id: string }[];
  expect(residents.find(({ id }) => id === resident.id)).toMatchObject({
    name: resident.name,
    email: resident.email,
    buildingName: klonowa.name,
    buildingAddress: klonowa.address,
    apartmentNumber: '3',
  });
});

test('mieszkaniec po przypisaniu do mieszkania widzi przeglądy swojego mieszkania i budynku', async ({
  page,
  baseURL,
}) => {
  const scheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const inspections = [
    { typeLabel: `Kontrola wspólna ${runId}`, buildingId: lipowaId, apartmentId: null },
    { typeLabel: `Kontrola m12 ${runId}`, buildingId: lipowaId, apartmentId: lipowaApartments.get('12')! },
    { typeLabel: `Kontrola m14 ${runId}`, buildingId: lipowaId, apartmentId: lipowaApartments.get('14')! },
    { typeLabel: `Kontrola Klonowa ${runId}`, buildingId: buildingIds[1]!, apartmentId: null },
  ];
  for (const inspection of inspections) {
    await db.query(
      `insert into inspections (type, type_label, building_id, apartment_id, scheduled_at)
       values ('other', $1, $2, $3, $4)`,
      [inspection.typeLabel, inspection.buildingId, inspection.apartmentId, scheduledAt],
    );
  }

  const resident = await signUp(page.request, baseURL!, {
    name: `Ewa Mieszkanka ${runId}`,
    emailDomain,
  });

  await page.goto('/inspections');
  await expect(
    page.getByRole('heading', { name: 'Moje przeglądy' }),
  ).toBeVisible();
  await expect(page.getByText('Brak przeglądów do wyświetlenia.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Zaplanuj przegląd' })).toHaveCount(0);

  await assignApartment(resident.id, lipowaApartments.get('12')!);
  await page.reload();

  const list = page.getByRole('list', { name: 'Moje przeglądy' });
  const common = list.getByRole('article', { name: inspections[0]!.typeLabel });
  await expect(common).toContainText(`${lipowa.name} — ${lipowa.address}`);
  await expect(common).toContainText('Część wspólna');
  await expect(common).toContainText('Zaplanowany');
  const own = list.getByRole('article', { name: inspections[1]!.typeLabel });
  await expect(own).toContainText('Mieszkanie 12');
  await expect(own).toContainText('Bez przypisania');
  await expect(list.getByRole('article')).toHaveCount(2);

  const mine = await page.request.get('/api/inspections/mine');
  expect(mine.status()).toBe(200);
  const labels = ((await mine.json()) as { typeLabel: string }[]).map(
    ({ typeLabel }) => typeLabel,
  );
  expect(labels.sort()).toEqual([inspections[0]!.typeLabel, inspections[1]!.typeLabel].sort());
});

test('administrator przypisuje mieszkańca do mieszkania z listy mieszkańców', async ({
  page,
  request,
  baseURL,
}) => {
  const resident = await signUp(request, baseURL!, {
    name: `Marta Najemczyni ${runId}`,
    emailDomain,
  });
  await signUpAdmin(db, page.request, baseURL!, emailDomain);

  await page.goto('/residents');
  const assign = apartmentCell(page, resident.name).getByRole('button', {
    name: `Przypisz mieszkanie: ${resident.name}`,
  });
  await assign.click();

  const dialog = page.getByRole('dialog', { name: 'Przypisz mieszkanie' });
  await expect(dialog).toBeVisible();
  const save = dialog.getByRole('button', { name: 'Zapisz przypisanie' });
  const apartment = dialog.getByRole('combobox', { name: 'Mieszkanie' });
  await expect(save).toBeDisabled();
  await expect(apartment).toBeDisabled();

  const building = dialog.getByRole('combobox', { name: 'Budynek' });
  await building.fill(lipowa.name);
  await page
    .getByRole('option', { name: `${lipowa.name} — ${lipowa.address}` })
    .click();
  await expect(building).toHaveValue(`${lipowa.name} — ${lipowa.address}`);

  await expect(apartment).toBeEnabled();
  await apartment.click();
  await expect(page.getByRole('option')).toHaveText(['Mieszkanie 12', 'Mieszkanie 14']);
  await page.getByRole('option', { name: 'Mieszkanie 14' }).click();
  await expect(apartment).toHaveValue('Mieszkanie 14');

  await save.click();
  await expect(dialog).toBeHidden();

  const cell = apartmentCell(page, resident.name);
  await expect(cell).toContainText(lipowa.name);
  await expect(cell).toContainText(`${lipowa.address} · mieszkanie 14`);

  const { rows } = await db.query<{ apartment_id: string | null }>(
    'select apartment_id from "user" where id = $1',
    [resident.id],
  );
  expect(rows).toEqual([{ apartment_id: lipowaApartments.get('14')! }]);

  await page.reload();
  await expect(apartmentCell(page, resident.name)).toContainText(
    `${lipowa.address} · mieszkanie 14`,
  );
});

test('usunięcie mieszkania zdejmuje przypisanie mieszkańca', async ({
  page,
  request,
  baseURL,
}) => {
  const resident = await signUp(request, baseURL!, {
    name: `Piotr Lokator ${runId}`,
    emailDomain,
  });
  const temporary = await insertApartments(db, lipowaId, [`T-${runId}`]);
  const apartmentId = temporary.get(`T-${runId}`)!;
  await assignApartment(resident.id, apartmentId);
  await signUpAdmin(db, page.request, baseURL!, emailDomain);

  await page.goto('/residents');
  await expect(apartmentCell(page, resident.name)).toContainText(
    `mieszkanie T-${runId}`,
  );

  await db.query('delete from apartments where id = $1', [apartmentId]);
  const { rows } = await db.query<{ apartment_id: string | null }>(
    'select apartment_id from "user" where id = $1',
    [resident.id],
  );
  expect(rows).toEqual([{ apartment_id: null }]);

  await page.reload();
  await expect(
    apartmentCell(page, resident.name).getByRole('button', {
      name: `Przypisz mieszkanie: ${resident.name}`,
    }),
  ).toBeVisible();
});

test('lista mieszkańców jest dostępna tylko dla administratora', async ({
  page,
  baseURL,
}) => {
  await signUp(page.request, baseURL!, { name: 'Jan Mieszkaniec', emailDomain });

  const api = await page.request.get('/api/residents');
  expect(api.status()).toBe(403);

  await page.goto('/residents');
  await expect(
    page.getByText('Ta strona jest dostępna dla administratora.'),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});
