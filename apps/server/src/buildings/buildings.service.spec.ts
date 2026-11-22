import { CreateBuildingSchema } from '@building-management/contracts';
import type { Database } from '@building-management/db';
import { describe, expect, it, vi } from 'vitest';
import { BuildingsService } from './buildings.service.js';

function createMockDb(createdBuilding: Record<string, unknown>, createdApartments: { id: string; number: string }[] = []) {
  const insertValuesCalls: unknown[] = [];
  let insertCallCount = 0;

  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn((vals: unknown) => {
        insertValuesCalls.push(vals);
        insertCallCount += 1;
        const result = insertCallCount === 1 ? [createdBuilding] : createdApartments;
        return {
          returning: vi.fn(async () => result),
        };
      }),
    })),
  };

  const db = {
    transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  } as unknown as Database;

  return { db, tx, insertValuesCalls };
}

describe('CreateBuildingSchema', () => {
  it('accepts a building without apartments', () => {
    const parsed = CreateBuildingSchema.safeParse({
      name: '  Kamienica A  ',
      address: '  ul. Kwiatowa 1  ',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: 'Kamienica A',
        address: 'ul. Kwiatowa 1',
      });
    }
  });

  it('accepts unique apartment numbers and trims them', () => {
    const parsed = CreateBuildingSchema.safeParse({
      name: 'Blok 1',
      address: 'ul. Polna 2',
      apartments: [' 1 ', '2A', '10'],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.apartments).toEqual(['1', '2A', '10']);
    }
  });

  it('rejects duplicate apartment numbers case-insensitively', () => {
    const parsed = CreateBuildingSchema.safeParse({
      name: 'Blok 1',
      address: 'ul. Polna 2',
      apartments: ['50A', ' 50a '],
    });

    expect(parsed.success).toBe(false);
  });
});

describe('BuildingsService.create', () => {
  const now = new Date('2026-11-23T00:00:00.000Z');
  const buildingRow = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Blok 1',
    address: 'ul. Polna 2',
    adminId: 'admin-1',
    createdAt: now,
    updatedAt: now,
  };

  it('creates a building with sorted apartments in a transaction', async () => {
    const { db, tx, insertValuesCalls } = createMockDb(buildingRow, [
      { id: 'apt-10', number: '10' },
      { id: 'apt-2', number: '2' },
      { id: 'apt-2a', number: '2A' },
    ]);
    const service = new BuildingsService(db);

    const result = await service.create(
      { name: 'Blok 1', address: 'ul. Polna 2', apartments: ['10', '2', '2A'] },
      'admin-1',
    );

    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(insertValuesCalls[0]).toEqual({
      name: 'Blok 1',
      address: 'ul. Polna 2',
      adminId: 'admin-1',
    });
    expect(insertValuesCalls[1]).toEqual([
      { buildingId: buildingRow.id, number: '10' },
      { buildingId: buildingRow.id, number: '2' },
      { buildingId: buildingRow.id, number: '2A' },
    ]);
    expect(result.apartments).toEqual([
      { id: 'apt-2', number: '2' },
      { id: 'apt-2a', number: '2A' },
      { id: 'apt-10', number: '10' },
    ]);
  });

  it('skips apartment insert when no apartments are provided', async () => {
    const { db, tx } = createMockDb(buildingRow);
    const service = new BuildingsService(db);

    const result = await service.create({ name: 'Blok 1', address: 'ul. Polna 2' }, 'admin-1');

    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(result.apartments).toEqual([]);
  });
});
