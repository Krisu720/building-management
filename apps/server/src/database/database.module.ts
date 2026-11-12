import { createDb } from '@building-management/db';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { ENV } from '../env.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({ db: createDb(ENV.DATABASE_URL) }),
    }),
  ],
})
export class DatabaseModule {}
