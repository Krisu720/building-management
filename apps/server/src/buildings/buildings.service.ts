import { buildings, type Database } from '@building-management/db';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc } from 'drizzle-orm';

@Injectable()
export class BuildingsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findAll() {
    return this.db.select().from(buildings).orderBy(asc(buildings.name));
  }
}
