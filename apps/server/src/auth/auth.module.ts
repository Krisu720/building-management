import type { Database } from '@building-management/db';
import { Module } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from './auth.js';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [getDrizzleToken()],
      useFactory: (db: Database) => ({
        auth: createAuth(db),
        // Biblioteka włącza CORS bez PATCH; w dev frontend idzie przez proxy Vite (same-origin).
        disableTrustedOriginsCors: true,
      }),
    }),
  ],
})
export class AuthModule {}
