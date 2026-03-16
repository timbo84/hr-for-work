import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { saveSubscription } from '../../../../lib/push-db';

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

  const { endpoint, keys } = body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Invalid subscription object' }, { status: 400 });
  }

  try {
    saveSubscription(session.user.employeeNumber, { endpoint, keys });
    return Response.json({ status: 'subscribed' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return Response.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
