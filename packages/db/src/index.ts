import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export { schema };
export * from './schema/index.js';

/**
 * Tworzy instancję Drizzle z puli node-postgres. Konfigurację (connection string)
 * przekazuje aplikacja — pakiet nie czyta env samodzielnie.
 */
export function createDb(connectionString: string) {
  return drizzle({
    connection: { connectionString },
    schema,
    casing: 'snake_case',
  });
}

export type Database = ReturnType<typeof createDb>;
