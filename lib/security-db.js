const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Store database in app root
const DB_PATH = path.join(process.cwd(), 'security.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    initializeDB();
  }
  return db;
}

function initializeDB() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_security (
      employee_number TEXT PRIMARY KEY,
      password_hash TEXT,
      is_first_login INTEGER DEFAULT 1,
      failed_attempts INTEGER DEFAULT 0,
      lockout_until TEXT,
      last_login TEXT,
      password_changed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT,
      ip_address TEXT,
      success INTEGER,
      attempted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT NOT NULL,
      endpoint        TEXT NOT NULL UNIQUE,
      p256dh          TEXT NOT NULL,
      auth            TEXT NOT NULL,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_number) REFERENCES employee_security(employee_number) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee ON push_subscriptions(employee_number);

    CREATE TABLE IF NOT EXISTS paystub_tracker (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      last_hcrun  TEXT NOT NULL,
      checked_at  TEXT DEFAULT (datetime('now')),
      notified_at TEXT
    );
  `);

  console.log('Security database initialized');
}

// ================================
// EMPLOYEE SECURITY FUNCTIONS
// ================================

export function getEmployeeSecurity(employeeNumber) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM employee_security 
    WHERE employee_number = ?
  `).get(employeeNumber.toString());
}

export function createEmployeeSecurity(employeeNumber) {
  const db = getDB();
  
  // Check if already exists
  const existing = getEmployeeSecurity(employeeNumber);
  if (existing) return existing;

  // Create new record (first time login)
  db.prepare(`
    INSERT INTO employee_security (employee_number, is_first_login)
    VALUES (?, 1)
  `).run(employeeNumber.toString());

  return getEmployeeSecurity(employeeNumber);
}

export function setPassword(employeeNumber, plainPassword) {
  const db = getDB();
  const hash = bcrypt.hashSync(plainPassword, 12);
  
  db.prepare(`
    UPDATE employee_security 
    SET 
      password_hash = ?,
      is_first_login = 0,
      failed_attempts = 0,
      lockout_until = NULL,
      password_changed_at = datetime('now'),
      updated_at = datetime('now')
    WHERE employee_number = ?
  `).run(hash, employeeNumber.toString());
}

export function verifyPassword(employeeNumber, plainPassword) {
  const security = getEmployeeSecurity(employeeNumber);
  if (!security || !security.password_hash) return false;
  return bcrypt.compareSync(plainPassword, security.password_hash);
}

export function isFirstLogin(employeeNumber) {
  const security = getEmployeeSecurity(employeeNumber);
  if (!security) return true; // Never logged in = first login
  return security.is_first_login === 1;
}

// ================================
// LOCKOUT FUNCTIONS
// ================================

export function isLockedOut(employeeNumber) {
  const security = getEmployeeSecurity(employeeNumber);
  if (!security) return false;
  if (!security.lockout_until) return false;

  const lockoutUntil = new Date(security.lockout_until.replace(' ', 'T') + 'Z');
  const now = new Date();

  if (now < lockoutUntil) {
    // Still locked out
    const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
    return { locked: true, minutesLeft };
  }

  // Lockout expired - reset it
  resetFailedAttempts(employeeNumber);
  return false;
}

export function recordFailedAttempt(employeeNumber, ipAddress = null) {
  const db = getDB();
  
  // Ensure security record exists
  createEmployeeSecurity(employeeNumber);

  // Increment failed attempts
  db.prepare(`
    UPDATE employee_security 
    SET 
      failed_attempts = failed_attempts + 1,
      updated_at = datetime('now')
    WHERE employee_number = ?
  `).run(employeeNumber.toString());

  // Log the attempt
  db.prepare(`
    INSERT INTO login_attempts (employee_number, ip_address, success)
    VALUES (?, ?, 0)
  `).run(employeeNumber.toString(), ipAddress);

  // Check if we need to lock the account
  const security = getEmployeeSecurity(employeeNumber);
  if (security.failed_attempts >= 5) {
    // Only set lockout_until if not already locked (prevent extending the timer)
    if (!security.lockout_until) {
      db.prepare(`
        UPDATE employee_security
        SET
          lockout_until = datetime('now', '+30 minutes'),
          updated_at = datetime('now')
        WHERE employee_number = ?
      `).run(employeeNumber.toString());
    }

    return { locked: true, minutesLeft: 30 };
  }

  return { 
    locked: false, 
    attemptsLeft: 5 - security.failed_attempts 
  };
}

export function recordSuccessfulLogin(employeeNumber, ipAddress = null) {
  const db = getDB();

  // Reset failed attempts on successful login
  db.prepare(`
    UPDATE employee_security 
    SET 
      failed_attempts = 0,
      lockout_until = NULL,
      last_login = datetime('now'),
      updated_at = datetime('now')
    WHERE employee_number = ?
  `).run(employeeNumber.toString());

  // Log the attempt
  db.prepare(`
    INSERT INTO login_attempts (employee_number, ip_address, success)
    VALUES (?, ?, 1)
  `).run(employeeNumber.toString(), ipAddress);
}

export function resetFailedAttempts(employeeNumber) {
  const db = getDB();
  db.prepare(`
    UPDATE employee_security 
    SET 
      failed_attempts = 0,
      lockout_until = NULL,
      updated_at = datetime('now')
    WHERE employee_number = ?
  `).run(employeeNumber.toString());
}

// ================================
// PASSWORD VALIDATION
// ================================

export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}