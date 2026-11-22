import { AssignResidentApartmentSchema } from '@building-management/contracts';
import type { Database } from '@building-management/db';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ResidentsService } from './residents.service.js';

function createMockDb(selectResults: unknown[][]) {
  let selectIndex = 0;
  const updateSetCalls: unknown[] = [];

  const tx = {
    select: vi.fn(() => {
      const result = selectResults[selectIndex++] ?? [];
      const chain = Object.assign(Promise.resolve(result), {
        from: vi.fn(() => chain),
        leftJoin: vi.fn(() => chain),
        where: vi.fn(() => chain),
        orderBy: vi.fn(() => chain),
      });
      return chain;
    }),
    update: vi.fn(() => ({
      set: vi.fn((vals: unknown) => {
        updateSetCalls.push(vals);
        return {
          where: vi.fn(async () => undefined),
        };
      }),
    })),
  };

  const db = {
    transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  } as unknown as Database;

  return { db, tx, updateSetCalls };
}

describe('AssignResidentApartmentSchema', () => {
  it('accepts a valid uuid or null', () => {
    expect(
      AssignResidentApartmentSchema.safeParse({
        apartmentId: '22222222-2222-4222-8222-222222222222',
      }).success,
    ).toBe(true);
    expect(AssignResidentApartmentSchema.safeParse({ apartmentId: null }).success).toBe(true);
  });

  it('rejects a non-uuid string', () => {
    expect(AssignResidentApartmentSchema.safeParse({ apartmentId: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('ResidentsService.assignApartment', () => {
  const apartmentId = '22222222-2222-4222-8222-222222222222';
  const createdAt = new Date('2026-11-20T10:00:00.000Z');

  it('assigns an apartment to an existing resident and returns updated item', async () => {
    const { db, updateSetCalls } = createMockDb([
      [{ id: 'res-1' }],
      [{ id: apartmentId }],
      [
        {
          id: 'res-1',
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          createdAt,
          apartmentNumber: '12A',
          buildingName: 'Blok 1',
          buildingAddress: 'ul. Polna 2',
        },
      ],
    ]);
    const service = new ResidentsService(db);

    const result = await service.assignApartment('res-1', apartmentId);

    expect(updateSetCalls).toEqual([{ apartmentId }]);
    expect(result).toEqual({
      id: 'res-1',
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      buildingName: 'Blok 1',
      buildingAddress: 'ul. Polna 2',
      apartmentNumber: '12A',
      createdAt,
    });
  });

  it('unassigns an apartment when apartmentId is null', async () => {
    const { db, tx, updateSetCalls } = createMockDb([
      [{ id: 'res-1' }],
      [
        {
          id: 'res-1',
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          createdAt,
          apartmentNumber: null,
          buildingName: null,
          buildingAddress: null,
        },
      ],
    ]);
    const service = new ResidentsService(db);

    const result = await service.assignApartment('res-1', null);

    expect(tx.select).toHaveBeenCalledTimes(2);
    expect(updateSetCalls).toEqual([{ apartmentId: null }]);
    expect(result.apartmentNumber).toBeNull();
    expect(result.buildingName).toBeNull();
    expect(result.buildingAddress).toBeNull();
  });

  it('throws NotFoundException when resident does not exist', async () => {
    const { db } = createMockDb([[]]);
    const service = new ResidentsService(db);

    await expect(service.assignApartment('missing-id', apartmentId)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when apartment does not exist', async () => {
    const { db } = createMockDb([[{ id: 'res-1' }], []]);
    const service = new ResidentsService(db);

    await expect(service.assignApartment('res-1', apartmentId)).rejects.toThrow(BadRequestException);
  });
});
