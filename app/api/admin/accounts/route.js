import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdmin } from '../../../../lib/admin-auth';
import { getAllSecurityRecords, getAdminStats, getRecentLoginAttempts } from '../../../../lib/security-db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accounts = getAllSecurityRecords();
  const stats = getAdminStats();
  const recentActivity = getRecentLoginAttempts(25);

  return NextResponse.json({ accounts, stats, recentActivity });
}
