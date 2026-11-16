import type { IssueFormValues } from './issue-form-schema';

export type IssueDraft = {
  title: string;
  description: string;
  buildingId: string;
  apartmentId: string | null;
};

export function createIssueDraft(values: IssueFormValues): IssueDraft {
  const description = values.description;
  const location =
    values.scope === 'common' ? values.commonLocation : undefined;

  return {
    title: values.title,
    description:
      values.scope === 'common' && location
        ? 'Miejsce usterki: ' + location + '\n\n' + description
        : description,
    buildingId: values.buildingId,
    apartmentId: values.scope === 'apartment' ? values.apartmentId : null,
  };
}
