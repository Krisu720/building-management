import type { ListUsersQuery } from '@building-management/contracts';
import { user, type Database } from '@building-management/db';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, sql } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findAll({ role }: ListUsersQuery) {
    return this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      .from(user)
      .where(
        role ? sql`${role} = ANY(string_to_array(replace(${user.role}, ' ', ''), ','))` : undefined,
      )
      .orderBy(asc(user.name));
  }
}
