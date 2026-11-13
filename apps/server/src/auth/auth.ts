import { ac, DEFAULT_ROLE, ROLES, roles } from '@building-management/contracts';
import { schema, type Database } from '@building-management/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { AccessControl } from 'better-auth/plugins/access';
import { ENV } from '../env.js';

export function createAuth(db: Database) {
  return betterAuth({
    appName: 'Building Management',
    baseURL: ENV.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: ENV.BETTER_AUTH_SECRET,
    trustedOrigins: [ENV.WEB_URL],
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: { enabled: true },
    plugins: [
      admin({
        ac: ac as unknown as AccessControl,
        roles,
        defaultRole: DEFAULT_ROLE,
        adminRoles: [ROLES.ADMIN],
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
