import { ROLES } from '@building-management/contracts';
import { apartments, buildings, user, type Database } from '@building-management/db';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';

const isResident = sql`${ROLES.USER} = ANY(string_to_array(replace(${user.role}, ' ', ''), ','))`;

type QueryableDb = Pick<Database, 'select'>;

@Injectable()
export class ResidentsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findAll() {
    return this.selectResidents(this.db, isResident);
  }

  async assignApartment(residentId: string, apartmentId: string | null) {
    return this.db.transaction(async (tx) => {
      const [resident] = await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.id, residentId), isResident));

      if (!resident) {
        throw new NotFoundException(`Mieszkaniec ${residentId} nie istnieje`);
      }

      if (apartmentId !== null) {
        const [apartment] = await tx
          .select({ id: apartments.id })
          .from(apartments)
          .where(eq(apartments.id, apartmentId));

        if (!apartment) {
          throw new BadRequestException('Wybrane mieszkanie nie istnieje');
        }
      }

      await tx.update(user).set({ apartmentId }).where(eq(user.id, residentId));

      const [updated] = await this.selectResidents(tx, eq(user.id, residentId));
      return updated!;
    });
  }

  private async selectResidents(db: QueryableDb, where: SQL) {
    const rows = await db
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
      .where(where)
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
