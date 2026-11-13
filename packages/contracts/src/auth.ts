import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export const statements = {
  ...defaultStatements,
  building: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statements);

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  TECHNICIAN: 'technician',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const roles = {
  [ROLES.ADMIN]: ac.newRole({
    ...adminAc.statements,
    building: ['create', 'read', 'update', 'delete'],
  }),
  [ROLES.USER]: ac.newRole({
    building: ['read'],
  }),
  [ROLES.TECHNICIAN]: ac.newRole({
    building: ['read', 'update'],
  }),
};

export const DEFAULT_ROLE: Role = ROLES.USER;
