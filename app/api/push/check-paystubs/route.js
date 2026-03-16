import webpush from 'web-push';
import { getLatestPayrollRunDate } from '../../../../lib/db';
import {
  getAllSubscriptions,
  removeSubscriptionById,
  getTrackerRow,
  initTracker,
  updateTrackerChecked,
  updateTrackerNotified,
} from '../../../../lib/push-db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const PUSH_CHECK_SECRET = process.env.PUSH_CHECK_SECRET;

export async function POST(request) {
  // Verify bearer token
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!PUSH_CHECK_SECRET || !token || token !== PUSH_CHECK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch latest HCRUN from IBM i
  let latestHcrun;
  try {
    latestHcrun = await getLatestPayrollRunDate();
  } catch (error) {
    console.error('check-paystubs: IBM i query failed:', error);
    return Response.json({ error: 'IBM i query failed' }, { status: 502 });
  }

  if (!latestHcrun) {
    return Response.json({ error: 'No payroll run data found' }, { status: 404 });
  }

  // Initialize tracker on first run (no notification sent)
  const tracker = getTrackerRow();
  if (!tracker) {
    initTracker(latestHcrun);
    return Response.json({ status: 'initialized', hcrun: latestHcrun });
  }

  // No change
  if (latestHcrun <= tracker.last_hcrun) {
    updateTrackerChecked(tracker.last_hcrun);
    return Response.json({ status: 'no_change', last_hcrun: tracker.last_hcrun });
  }

  // New paystub run detected — send push to all subscribers
  const subscriptions = getAllSubscriptions();
  console.log(`check-paystubs: new HCRUN ${latestHcrun} (was ${tracker.last_hcrun}), notifying ${subscriptions.length} subscribers`);

  const payload = JSON.stringify({
    title: 'New Pay Stub Available',
    body: 'Your latest pay stub is ready to view.',
    icon: '/icons/icon-192x192.png',
    url: '/paystubs',
    tag: 'paystub-notification',
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // 410 Gone or 404 = browser revoked permission; clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`check-paystubs: removing stale subscription id=${sub.id}`);
          removeSubscriptionById(sub.id);
        } else {
          throw err;
        }
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Update tracker AFTER sending (so a crash mid-send retries next run)
  updateTrackerChecked(latestHcrun);
  updateTrackerNotified();

  return Response.json({
    status: 'notified',
    hcrun: latestHcrun,
    sent,
    failed,
  });
}
