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

export function getPanelRole(role?: string | null) {
  const roles = (role ?? '').split(',').map((value) => value.trim());
  if (roles.includes('admin')) return 'admin';
  return roles.includes('technician') ? 'technician' : 'resident';
}

export function isAdmin(role?: string | null) {
  return getPanelRole(role) === 'admin';
}
