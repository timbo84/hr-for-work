/**
 * Admin access control
 *
 * An employee is an admin if:
 *   1. Their employee number is in ADMIN_EMPLOYEE_NUMBERS (comma-separated in .env.local), OR
 *   2. Their IBM i position matches one of the ADMIN_POSITIONS (comma-separated, case-insensitive)
 *
 * Example .env.local:
 *   ADMIN_EMPLOYEE_NUMBERS=360,42
 *   ADMIN_POSITIONS=HR DIRECTOR,HUMAN RESOURCES,HR ADMINISTRATOR
 */
export function isAdmin(session) {
  if (!session?.user) return false;

  const empNum = session.user.employeeNumber?.toString().trim();
  const position = (session.user.position || '').trim().toLowerCase();

  // Check employee number override list (for testing / CEO access)
  const adminNumbers = (process.env.ADMIN_EMPLOYEE_NUMBERS || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  if (empNum && adminNumbers.includes(empNum)) return true;

  // Check position-based access
  const adminPositions = (
    process.env.ADMIN_POSITIONS ||
    'hr director,human resources,hr administrator,hr manager,human resources director,human resources manager'
  )
    .split(',')
    .map(p => p.trim().toLowerCase())
    .filter(Boolean);

  return adminPositions.some(p => position.includes(p));
}
