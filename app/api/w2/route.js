import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getW2Data } from '../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.employeeNumber) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const w2s = await getW2Data(session.user.employeeNumber);
    return NextResponse.json({ w2s });
  } catch (error) {
    console.error('W-2 API error:', error);
    return NextResponse.json({ error: 'Failed to load W-2 data' }, { status: 500 });
  }
}
