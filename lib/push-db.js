const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'security.db');

let _db;
function getDB() {
  if (!_db) {
    _db = new Database(DB_PATH);
  }
  return _db;
}

// ================================
// PUSH SUBSCRIPTIONS
// ================================

export function saveSubscription(employeeNumber, subscription) {
  const db = getDB();
  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  db.prepare(`
    INSERT INTO push_subscriptions (employee_number, endpoint, p256dh, auth, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(endpoint) DO UPDATE SET
      employee_number = excluded.employee_number,
      p256dh          = excluded.p256dh,
      auth            = excluded.auth,
      updated_at      = datetime('now')
  `).run(employeeNumber.toString(), endpoint, p256dh, auth);
}

export function removeSubscription(endpoint) {
  const db = getDB();
  db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
}

export function removeSubscriptionById(id) {
  const db = getDB();
  db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).run(id);
}

export function getAllSubscriptions() {
  const db = getDB();
  return db.prepare(`SELECT * FROM push_subscriptions`).all();
}

export function getSubscriptionsByEmployee(employeeNumber) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM push_subscriptions WHERE employee_number = ?
  `).all(employeeNumber.toString());
}

// ================================
// PAYSTUB TRACKER (singleton row id=1)
// ================================

export function getTrackerRow() {
  const db = getDB();
  return db.prepare(`SELECT * FROM paystub_tracker WHERE id = 1`).get();
}

export function initTracker(hcrun) {
  const db = getDB();
  db.prepare(`
    INSERT OR IGNORE INTO paystub_tracker (id, last_hcrun, checked_at)
    VALUES (1, ?, datetime('now'))
  `).run(hcrun.toString());
}

export function updateTrackerChecked(hcrun) {
  const db = getDB();
  db.prepare(`
    UPDATE paystub_tracker
    SET last_hcrun = ?, checked_at = datetime('now')
    WHERE id = 1
  `).run(hcrun.toString());
}

export function updateTrackerNotified() {
  const db = getDB();
  db.prepare(`
    UPDATE paystub_tracker
    SET notified_at = datetime('now')
    WHERE id = 1
  `).run();
}
