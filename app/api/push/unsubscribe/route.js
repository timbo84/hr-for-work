import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { removeSubscription, getSubscriptionsByEmployee } from '../../../../lib/push-db';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.employeeNumber) {
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
    // Verify this endpoint belongs to the logged-in employee
    const mySubscriptions = getSubscriptionsByEmployee(session.user.employeeNumber);
    const owns = mySubscriptions.some(sub => sub.endpoint === endpoint);
    if (!owns) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    removeSubscription(endpoint);
    return Response.json({ status: 'unsubscribed' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return Response.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
