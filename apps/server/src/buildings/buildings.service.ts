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
      apartments: (apartmentsByBuilding.get(building.id) ?? []).sort((a, b) =>
        a.number.localeCompare(b.number, 'pl', { numeric: true }),
      ),
    }));
  }

  async findOne(id: string) {
    const [row] = await this.db.select().from(buildings).where(eq(buildings.id, id));
    return row ?? notFound(id);
  }

  async create(data: CreateBuilding) {
    const [row] = await this.db.insert(buildings).values(data).returning();
    return row!;
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

function notFound(id: string): never {
  throw new NotFoundException(`Budynek ${id} nie istnieje`);
}
