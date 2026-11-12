import { Module } from '@nestjs/common';
import { BuildingsModule } from './buildings/buildings.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [DatabaseModule, HealthModule, BuildingsModule],
})
export class AppModule {}
