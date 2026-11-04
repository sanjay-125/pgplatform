import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'staydesk.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'owner', 'tenant')),
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      city TEXT,
      owner_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      floor INTEGER DEFAULT 1,
      capacity INTEGER NOT NULL DEFAULT 2,
      rent_per_bed REAL DEFAULT 6000,
      room_type TEXT DEFAULT 'Non-AC',
      has_bathroom INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      UNIQUE(property_id, room_number)
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      bed_number TEXT NOT NULL,
      status TEXT DEFAULT 'vacant' CHECK(status IN ('vacant', 'occupied', 'maintenance')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      UNIQUE(room_id, bed_number)
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      property_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      bed_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      id_type TEXT DEFAULT 'Not recorded',
      id_detail TEXT,
      emergency_name TEXT,
      emergency_phone TEXT,
      share_contact INTEGER DEFAULT 0,
      rent REAL NOT NULL,
      deposit REAL DEFAULT 0,
      joined_date TEXT NOT NULL,
      checkout_date TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'checkedout')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (bed_id) REFERENCES beds(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('UPI', 'Cash', 'Bank transfer', 'Cheque', 'Other')),
      ref TEXT NOT NULL,
      receipt_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'paid',
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved')),
      resolution_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
    CREATE INDEX IF NOT EXISTS idx_beds_room ON beds(room_id);
    CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
    CREATE INDEX IF NOT EXISTS idx_tenants_room ON tenants(room_id);
    CREATE INDEX IF NOT EXISTS idx_payments_property ON payments(property_id);
    CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period);
    CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_property ON complaints(property_id);
  `);
}

export function logAudit(userId: number | null, action: string, details?: string, ip?: string) {
  try {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, details, ip, created_at) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, action, details || '', ip || '', new Date().toISOString());
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
