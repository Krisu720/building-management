import { apartments, buildings, issueHistory, issues, type Database } from '@building-management/db';
import type { CreateIssue } from '@building-management/contracts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';

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
