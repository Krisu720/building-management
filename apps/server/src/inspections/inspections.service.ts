import { ROLES, type CreateInspection } from '@building-management/contracts';
import {
  apartments,
  buildings,
  inspectionHistory,
  inspections,
  user,
  type Database,
} from '@building-management/db';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, getTableColumns, inArray, isNull, or, type SQL } from 'drizzle-orm';

function hasRole(roleValue: string | null | undefined, target: string) {
  return (roleValue ?? '')
    .split(',')
    .some((value) => value.trim() === target);
}

@Injectable()
export class InspectionsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(data: CreateInspection, changedBy: string) {
    const apartmentIds = data.scope === 'apartment' ? (data.apartmentIds ?? []) : [];
    const technicianId = data.technicianId ?? null;
    const scheduledAt = new Date(data.scheduledAt);
    const typeLabel = data.type === 'other' ? (data.typeLabel ?? null) : null;

    await this.assertBuildingAndApartments(data.buildingId, apartmentIds);
    if (technicianId) {
      await this.assertTechnician(technicianId);
    }

    const targets: (string | null)[] = data.scope === 'building' ? [null] : apartmentIds;

    return this.db.transaction(async (tx) => {
      const created = await tx
        .insert(inspections)
        .values(
          targets.map((apartmentId) => ({
            type: data.type,
            typeLabel,
            buildingId: data.buildingId,
            apartmentId,
            scheduledAt,
            technicianId,
          })),
        )
        .returning();

      await tx.insert(inspectionHistory).values(
        created.map((inspection) => ({
          inspectionId: inspection.id,
          status: inspection.status,
          scheduledAt: inspection.scheduledAt,
          changedBy,
        })),
      );

      return created;
    });
  }

  findAll() {
    return this.list();
  }

  async findMine(userId: string) {
    const [currentUser] = await this.db
      .select({
        role: user.role,
        apartmentId: user.apartmentId,
        buildingId: apartments.buildingId,
      })
      .from(user)
      .leftJoin(apartments, eq(apartments.id, user.apartmentId))
      .where(eq(user.id, userId));

    if (!currentUser) return [];

    const conditions: SQL[] = [];
    if (hasRole(currentUser.role, ROLES.TECHNICIAN)) {
      conditions.push(eq(inspections.technicianId, userId));
    }
    if (currentUser.apartmentId && currentUser.buildingId) {
      conditions.push(eq(inspections.apartmentId, currentUser.apartmentId));
      const buildingCommonArea = and(
        isNull(inspections.apartmentId),
        eq(inspections.buildingId, currentUser.buildingId),
      );
      if (buildingCommonArea) conditions.push(buildingCommonArea);
    }

    if (conditions.length === 0) return [];

    return this.list(conditions.length === 1 ? conditions[0] : or(...conditions));
  }

  private async list(where?: SQL) {
    const rows = await this.db
      .select({
        ...getTableColumns(inspections),
        building: { id: buildings.id, name: buildings.name, address: buildings.address },
        apartmentRef: { id: apartments.id, number: apartments.number },
        technicianRef: { id: user.id, name: user.name, email: user.email },
      })
      .from(inspections)
      .innerJoin(buildings, eq(buildings.id, inspections.buildingId))
      .leftJoin(apartments, eq(apartments.id, inspections.apartmentId))
      .leftJoin(user, eq(user.id, inspections.technicianId))
      .where(where)
      .orderBy(asc(inspections.scheduledAt), desc(inspections.createdAt));

    return rows.map(({ apartmentRef, technicianRef, ...inspection }) => ({
      ...inspection,
      apartment: apartmentRef?.id ? apartmentRef : null,
      technician: technicianRef?.id ? technicianRef : null,
    }));
  }

  private async assertBuildingAndApartments(buildingId: string, apartmentIds: string[]) {
    const [building] = await this.db
      .select({ id: buildings.id })
      .from(buildings)
      .where(eq(buildings.id, buildingId));
    if (!building) throw new BadRequestException('Wybrany budynek nie istnieje');

    if (apartmentIds.length === 0) return;
    const found = await this.db
      .select({ id: apartments.id, buildingId: apartments.buildingId })
      .from(apartments)
      .where(inArray(apartments.id, apartmentIds));

    if (
      found.length !== apartmentIds.length ||
      found.some((apartment) => apartment.buildingId !== buildingId)
    ) {
      throw new BadRequestException('Wybrane mieszkanie nie należy do wybranego budynku');
    }
  }

  private async assertTechnician(technicianId: string) {
    const [technician] = await this.db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, technicianId));

    if (!technician || !hasRole(technician.role, ROLES.TECHNICIAN)) {
      throw new BadRequestException('Wybrany technik nie istnieje');
    }
  }
}
