import { Module } from '@nestjs/common';
import { ApartmentsModule } from './apartments/apartments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BuildingsModule } from './buildings/buildings.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IssuesModule } from './issues/issues.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, HealthModule, BuildingsModule, ApartmentsModule, IssuesModule],
})
export class AppModule {}
