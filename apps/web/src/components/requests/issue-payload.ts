import type { CreateIssue } from '@/lib/api/models';
import { getIssueDescription, type IssueFormValues } from './issue-form-schema';

export function createIssuePayload(values: IssueFormValues): CreateIssue {
  return {
    title: values.title,
    description: getIssueDescription(values),
    buildingId: values.buildingId,
    apartmentId: values.scope === 'apartment' ? values.apartmentId : null,
  };
}
