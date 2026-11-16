import { relations } from 'drizzle-orm';
import { apartments } from './apartments.js';
import { user } from './auth.js';
import { buildings } from './buildings.js';
import { inspectionHistory, inspections } from './inspections.js';
import { issueHistory, issues } from './issues.js';
import { photos } from './photos.js';

export const userRelations = relations(user, ({ one, many }) => ({
  apartment: one(apartments, { fields: [user.apartmentId], references: [apartments.id] }),
  administeredBuildings: many(buildings),
  reportedIssues: many(issues, { relationName: 'issueReporter' }),
  assignedIssues: many(issues, { relationName: 'issueTechnician' }),
  assignedInspections: many(inspections),
}));

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  admin: one(user, { fields: [buildings.adminId], references: [user.id] }),
  apartments: many(apartments),
  inspections: many(inspections),
  issues: many(issues),
}));

export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  building: one(buildings, { fields: [apartments.buildingId], references: [buildings.id] }),
  residents: many(user),
  inspections: many(inspections),
  issues: many(issues),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  building: one(buildings, { fields: [inspections.buildingId], references: [buildings.id] }),
  apartment: one(apartments, { fields: [inspections.apartmentId], references: [apartments.id] }),
  technician: one(user, { fields: [inspections.technicianId], references: [user.id] }),
  history: many(inspectionHistory),
  photos: many(photos),
}));

export const inspectionHistoryRelations = relations(inspectionHistory, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionHistory.inspectionId],
    references: [inspections.id],
  }),
  changedByUser: one(user, { fields: [inspectionHistory.changedBy], references: [user.id] }),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  building: one(buildings, { fields: [issues.buildingId], references: [buildings.id] }),
  apartment: one(apartments, { fields: [issues.apartmentId], references: [apartments.id] }),
  reporter: one(user, {
    fields: [issues.reporterId],
    references: [user.id],
    relationName: 'issueReporter',
  }),
  technician: one(user, {
    fields: [issues.technicianId],
    references: [user.id],
    relationName: 'issueTechnician',
  }),
  history: many(issueHistory),
  photos: many(photos),
}));

export const issueHistoryRelations = relations(issueHistory, ({ one }) => ({
  issue: one(issues, { fields: [issueHistory.issueId], references: [issues.id] }),
  changedByUser: one(user, { fields: [issueHistory.changedBy], references: [user.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  issue: one(issues, { fields: [photos.issueId], references: [issues.id] }),
  inspection: one(inspections, { fields: [photos.inspectionId], references: [inspections.id] }),
}));
