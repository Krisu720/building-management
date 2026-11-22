import { ROLES } from '@building-management/contracts';
import { apartments, buildings, user, type Database } from '@building-management/db';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, desc, eq, sql } from 'drizzle-orm';

@Injectable()
export class ResidentsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findAll() {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        apartmentNumber: apartments.number,
        buildingName: buildings.name,
        buildingAddress: buildings.address,
      })
      .from(user)
      .leftJoin(apartments, eq(apartments.id, user.apartmentId))
      .leftJoin(buildings, eq(buildings.id, apartments.buildingId))
      .where(sql`${ROLES.USER} = ANY(string_to_array(replace(${user.role}, ' ', ''), ','))`)
      .orderBy(desc(user.createdAt), asc(user.name));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      buildingName: row.apartmentNumber ? row.buildingName : null,
      buildingAddress: row.apartmentNumber ? row.buildingAddress : null,
      apartmentNumber: row.apartmentNumber ?? null,
      createdAt: row.createdAt,
    }));
  }
}
