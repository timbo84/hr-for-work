import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { removeSubscription } from '../../../../lib/push-db';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { endpoint } = body ?? {};
  if (!endpoint) {
    return Response.json({ error: 'endpoint required' }, { status: 400 });
  }

  try {
    removeSubscription(endpoint);
    return Response.json({ status: 'unsubscribed' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return Response.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
