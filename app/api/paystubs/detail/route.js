import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getPayStubDetail } from '../../../../lib/db';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.employeeNumber) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const run = searchParams.get('run');

  if (!run) {
    return NextResponse.json({ error: 'run parameter required' }, { status: 400 });
  }

  try {
    const detail = await getPayStubDetail(session.user.employeeNumber, run);
    return NextResponse.json(detail);
  } catch (error) {
    console.error('Pay stub detail error:', error);
    return NextResponse.json({ error: 'Failed to load pay stub detail' }, { status: 500 });
  }
}
