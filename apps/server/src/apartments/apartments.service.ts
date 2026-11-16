import { apartments, type Database } from '@building-management/db';
import type { ListApartmentsQuery } from '@building-management/contracts';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq } from 'drizzle-orm';

@Injectable()
export class ApartmentsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findAll({ buildingId }: ListApartmentsQuery) {
    return this.db
      .select()
      .from(apartments)
      .where(buildingId ? eq(apartments.buildingId, buildingId) : undefined)
      .orderBy(asc(apartments.buildingId), asc(apartments.number));
  }
}
