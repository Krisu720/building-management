export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'
  );
}

export function isAdmin(role?: string | null) {
  return (role ?? '').split(',').some((value) => value.trim() === 'admin');
}
