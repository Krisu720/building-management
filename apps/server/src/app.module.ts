import { Module } from '@nestjs/common';
import { ApartmentsModule } from './apartments/apartments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BuildingsModule } from './buildings/buildings.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { InspectionsModule } from './inspections/inspections.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { ResidentsModule } from './residents/residents.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    BuildingsModule,
    ApartmentsModule,
    IssuesModule,
    ResidentsModule,
    UsersModule,
    InspectionsModule,
  ],
})
export class AppModule {}
