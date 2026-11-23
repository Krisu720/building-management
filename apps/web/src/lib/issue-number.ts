export function formatIssueNumber(number: number): string {
  return `#${number}`;
}

export function matchesIssueNumberQuery(number: number, query: string): boolean {
  const normalized = query.trim().replace(/^#/, '');
  if (!normalized) return true;
  return String(number).includes(normalized);
}
