import { apartments, buildings, issueHistory, issues, user, type Database } from '@building-management/db';
import type { CreateIssue, ListIssuesQuery } from '@building-management/contracts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, getTableColumns, type SQL } from 'drizzle-orm';

@Injectable()
export class IssuesService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(data: CreateIssue, reporterId: string) {
    const apartmentId = data.apartmentId ?? null;
    await this.assertLocation(data.buildingId, apartmentId);

    return this.db.transaction(async (tx) => {
      const [issue] = await tx
        .insert(issues)
        .values({
          title: data.title,
          description: data.description,
          buildingId: data.buildingId,
          apartmentId,
          reporterId,
        })
        .returning();
      await tx
        .insert(issueHistory)
        .values({ issueId: issue!.id, status: issue!.status, changedBy: reporterId });
      return issue!;
    });
  }

  findAll(query: ListIssuesQuery = {}) {
    return this.list({ number: query.number });
  }

  findByReporter(reporterId: string) {
    return this.list({ reporterId });
  }

  private async list(filters: { reporterId?: string; number?: number } = {}) {
    const conditions: SQL[] = [];
    if (filters.reporterId) conditions.push(eq(issues.reporterId, filters.reporterId));
    if (filters.number !== undefined) conditions.push(eq(issues.number, filters.number));

    const rows = await this.db
      .select({
        ...getTableColumns(issues),
        building: { id: buildings.id, name: buildings.name, address: buildings.address },
        apartmentRef: { id: apartments.id, number: apartments.number },
        reporterRef: { id: user.id, name: user.name, email: user.email },
      })
      .from(issues)
      .innerJoin(buildings, eq(buildings.id, issues.buildingId))
      .leftJoin(apartments, eq(apartments.id, issues.apartmentId))
      .leftJoin(user, eq(user.id, issues.reporterId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(issues.createdAt));

    return rows.map(({ apartmentRef, reporterRef, ...issue }) => ({
      ...issue,
      apartment: apartmentRef?.id ? apartmentRef : null,
      reporter: reporterRef?.id ? reporterRef : null,
    }));
  }

  private async assertLocation(buildingId: string, apartmentId: string | null) {
    const [building] = await this.db
      .select({ id: buildings.id })
      .from(buildings)
      .where(eq(buildings.id, buildingId));
    if (!building) throw new BadRequestException('Wybrany budynek nie istnieje');

    if (!apartmentId) return;
    const [apartment] = await this.db
      .select({ buildingId: apartments.buildingId })
      .from(apartments)
      .where(eq(apartments.id, apartmentId));
    if (apartment?.buildingId !== buildingId) {
      throw new BadRequestException('Wybrane mieszkanie nie należy do wybranego budynku');
    }
  }
}
