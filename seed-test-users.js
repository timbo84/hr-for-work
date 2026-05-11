/**
 * One-time script to seed test employee passwords into security.db
 * Run with: node seed-test-users.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'security.db');
const PASSWORD = 'ThisIsATest123!';
const SALT_ROUNDS = 12;

const TEST_EMPLOYEES = [
  { number: '2102', name: 'Scarlett Will' },
  { number: '1353', name: 'Little John' },
  { number: '2306', name: 'Wendenal William (Sheriff)' },
  { number: '1494', name: 'Hood Robin Locksley' },
];

console.log('Seeding test users into security.db...');
console.log(`Hashing password (this may take a few seconds)...\n`);

const hash = bcrypt.hashSync(PASSWORD, SALT_ROUNDS);
const db = new Database(DB_PATH);

const upsert = db.prepare(`
  INSERT INTO employee_security (employee_number, password_hash, is_first_login, failed_attempts, created_at, updated_at)
  VALUES (?, ?, 0, 0, datetime('now'), datetime('now'))
  ON CONFLICT(employee_number) DO UPDATE SET
    password_hash = excluded.password_hash,
    is_first_login = 0,
    failed_attempts = 0,
    lockout_until = NULL,
    password_changed_at = datetime('now'),
    updated_at = datetime('now')
`);

for (const emp of TEST_EMPLOYEES) {
  upsert.run(emp.number, hash);
  console.log(`✓ ${emp.number} - ${emp.name}`);
}

db.close();
console.log(`\nDone. Login with password: ${PASSWORD}`);
