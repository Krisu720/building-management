import { apartments, buildings, type Database } from '@building-management/db';
import type { CreateBuilding, UpdateBuilding } from '@building-management/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq } from 'drizzle-orm';

@Injectable()
export class BuildingsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findAll() {
    return this.db.select().from(buildings).orderBy(asc(buildings.name));
  }

  async findAllWithApartments() {
    const [buildingRows, apartmentRows] = await Promise.all([
      this.db.select().from(buildings).orderBy(asc(buildings.name)),
      this.db
        .select({
          id: apartments.id,
          buildingId: apartments.buildingId,
          number: apartments.number,
        })
        .from(apartments)
        .orderBy(asc(apartments.number)),
    ]);

    const apartmentsByBuilding = new Map<string, { id: string; number: string }[]>();
    for (const apartment of apartmentRows) {
      const list = apartmentsByBuilding.get(apartment.buildingId) ?? [];
      list.push({ id: apartment.id, number: apartment.number });
      apartmentsByBuilding.set(apartment.buildingId, list);
    }

    return buildingRows.map((building) => ({
      ...building,
      apartments: sortApartments(apartmentsByBuilding.get(building.id) ?? []),
    }));
  }

  async findOne(id: string) {
    const [row] = await this.db.select().from(buildings).where(eq(buildings.id, id));
    return row ?? notFound(id);
  }

  async create(data: CreateBuilding, adminId?: string) {
    const apartmentNumbers = data.apartments ?? [];

    return this.db.transaction(async (tx) => {
      const [building] = await tx
        .insert(buildings)
        .values({
          name: data.name,
          address: data.address,
          adminId: adminId ?? null,
        })
        .returning();

      const createdApartments =
        apartmentNumbers.length > 0
          ? await tx
              .insert(apartments)
              .values(
                apartmentNumbers.map((number) => ({
                  buildingId: building!.id,
                  number,
                })),
              )
              .returning({ id: apartments.id, number: apartments.number })
          : [];

      return {
        ...building!,
        apartments: sortApartments(createdApartments),
      };
    });
  }

  async update(id: string, data: UpdateBuilding) {
    const [row] = await this.db
      .update(buildings)
      .set(data)
      .where(eq(buildings.id, id))
      .returning();
    return row ?? notFound(id);
  }

  async remove(id: string) {
    const [row] = await this.db
      .delete(buildings)
      .where(eq(buildings.id, id))
      .returning({ id: buildings.id });
    if (!row) notFound(id);
  }
}

function sortApartments(rows: { id: string; number: string }[]) {
  return rows.sort((a, b) => a.number.localeCompare(b.number, 'pl', { numeric: true }));
}

function notFound(id: string): never {
  throw new NotFoundException(`Budynek ${id} nie istnieje`);
}
