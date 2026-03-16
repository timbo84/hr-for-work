import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isAdmin } from '../../../../lib/admin-auth';
import { resetFailedAttempts } from '../../../../lib/security-db';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { employeeNumber } = await request.json();
  if (!employeeNumber) {
    return NextResponse.json({ error: 'Employee number required' }, { status: 400 });
  }

  resetFailedAttempts(employeeNumber);
  console.log(`✅ Admin ${session.user.employeeNumber} unlocked account: ${employeeNumber}`);

  return NextResponse.json({ success: true });
}
