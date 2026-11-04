import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDb, logAudit } from './db.ts';
import {
  authenticateToken,
  comparePassword,
  generateToken,
  hashPassword,
  requireRole,
  verifyPropertyAccess,
  type AuthRequest,
} from './auth.ts';
import { seedData } from './seed.ts';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize DB schema & Seed data if first run
initDb();
seedData();

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'StayDesk API', time: new Date().toISOString() });
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as any;
  if (!user || !comparePassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Find tenant ID if tenant
  let tenantId: number | undefined;
  let propertyIds: number[] = [];

  if (user.role === 'tenant') {
    const tenantRow = db.prepare('SELECT id, property_id FROM tenants WHERE user_id = ?').get(user.id) as any;
    if (tenantRow) {
      tenantId = tenantRow.id;
      propertyIds = [tenantRow.property_id];
    }
  } else if (user.role === 'owner') {
    const props = db.prepare('SELECT id FROM properties WHERE owner_id = ?').all(user.id) as any[];
    propertyIds = props.map((p) => p.id);
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId,
    propertyIds,
  });

  logAudit(user.id, 'USER_LOGIN', `Role: ${user.role}`, req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      tenantId,
      propertyIds,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let tenantDetails: any = null;
  let properties: any[] = [];

  if (user.role === 'tenant') {
    tenantDetails = db.prepare(`
      SELECT t.*, r.room_number, b.bed_number, p.name as property_name, p.address as property_address
      FROM tenants t
      JOIN rooms r ON t.room_id = r.id
      JOIN beds b ON t.bed_id = b.id
      JOIN properties p ON t.property_id = p.id
      WHERE t.user_id = ?
    `).get(user.id);
  } else if (user.role === 'owner') {
    properties = db.prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY id ASC').all(user.id);
  } else if (user.role === 'superadmin') {
    properties = db.prepare('SELECT * FROM properties ORDER BY id ASC').all();
  }

  res.json({
    user,
    tenantDetails,
    properties,
  });
});

// -------------------------------------------------------------
// Properties Endpoints
// -------------------------------------------------------------
app.get('/api/properties', authenticateToken, (req: AuthRequest, res: Response) => {
  let list: any[];
  if (req.user!.role === 'superadmin') {
    list = db.prepare(`
      SELECT p.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id) as room_count,
        (SELECT COUNT(*) FROM tenants t WHERE t.property_id = p.id AND t.status = 'active') as active_tenants
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.id ASC
    `).all();
  } else if (req.user!.role === 'owner') {
    list = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id) as room_count,
        (SELECT COUNT(*) FROM tenants t WHERE t.property_id = p.id AND t.status = 'active') as active_tenants
      FROM properties p
      WHERE p.owner_id = ?
      ORDER BY p.id ASC
    `).all(req.user!.id);
  } else {
    // Tenant
    const tenantRow = db.prepare('SELECT property_id FROM tenants WHERE user_id = ?').get(req.user!.id) as any;
    if (!tenantRow) {
      res.json([]);
      return;
    }
    list = db.prepare('SELECT * FROM properties WHERE id = ?').all(tenantRow.property_id);
  }

  res.json(list);
});

app.post('/api/properties', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const { name, code, address, city, ownerId } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: 'Property name and unique code are required' });
    return;
  }

  const assignedOwnerId = req.user!.role === 'superadmin' ? (ownerId || req.user!.id) : req.user!.id;

  try {
    const stmt = db.prepare(`
      INSERT INTO properties (name, code, address, city, owner_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), code.trim().toUpperCase(), address || '', city || '', assignedOwnerId, new Date().toISOString());
    logAudit(req.user!.id, 'CREATE_PROPERTY', `Property: ${name} (${code})`, req.ip);
    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Property created successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Property code already exists' : err.message });
  }
});

// -------------------------------------------------------------
// Rooms & Beds Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/rooms', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied to this property' });
    return;
  }

  const rooms = db.prepare(`
    SELECT r.*
    FROM rooms r
    WHERE r.property_id = ?
    ORDER BY r.floor ASC, r.room_number ASC
  `).all(propertyId) as any[];

  const bedsStmt = db.prepare(`
    SELECT b.*, t.id as tenant_id, t.name as tenant_name, t.phone as tenant_phone, t.status as tenant_status
    FROM beds b
    LEFT JOIN tenants t ON t.bed_id = b.id AND t.status = 'active'
    WHERE b.room_id = ?
    ORDER BY b.bed_number ASC
  `);

  const enrichedRooms = rooms.map((room) => {
    const beds = bedsStmt.all(room.id) as any[];
    const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
    return {
      ...room,
      occupied: occupiedCount,
      vacant: room.capacity - occupiedCount,
      beds,
    };
  });

  res.json(enrichedRooms);
});

app.post('/api/properties/:propertyId/rooms', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied to this property' });
    return;
  }

  const { roomNumber, floor, capacity, rentPerBed, roomType, hasBathroom } = req.body;
  if (!roomNumber || !capacity) {
    res.status(400).json({ error: 'Room number and capacity are required' });
    return;
  }

  try {
    const cap = Math.max(1, Math.min(12, Number(capacity)));
    const roomStmt = db.prepare(`
      INSERT INTO rooms (property_id, room_number, floor, capacity, rent_per_bed, room_type, has_bathroom, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const roomRes = roomStmt.run(
      propertyId,
      String(roomNumber).trim(),
      Number(floor) || 1,
      cap,
      Number(rentPerBed) || 6000,
      roomType || 'Non-AC',
      hasBathroom ? 1 : 0,
      new Date().toISOString()
    );
    const roomId = Number(roomRes.lastInsertRowid);

    // Automatically create beds A, B, C...
    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const bedStmt = db.prepare('INSERT INTO beds (room_id, bed_number, status) VALUES (?, ?, ?)');
    for (let i = 0; i < cap; i++) {
      bedStmt.run(roomId, bedLetters[i], 'vacant');
    }

    logAudit(req.user!.id, 'CREATE_ROOM', `Room ${roomNumber} (capacity: ${cap})`, req.ip);
    res.status(201).json({ id: roomId, message: 'Room created successfully with beds' });
  } catch (err: any) {
    res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Room number already exists in this property' : err.message });
  }
});

app.delete('/api/rooms/:id', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const roomId = Number(req.params.id);
  const room = db.prepare('SELECT property_id, room_number FROM rooms WHERE id = ?').get(roomId) as any;
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  if (!verifyPropertyAccess(req, room.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const activeTenants = db.prepare('SELECT COUNT(*) as count FROM tenants WHERE room_id = ? AND status = "active"').get(roomId) as any;
  if (activeTenants.count > 0) {
    res.status(400).json({ error: 'Cannot delete room while active tenants are staying in it. Please relocate or check out tenants first.' });
    return;
  }

  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
  logAudit(req.user!.id, 'DELETE_ROOM', `Room ${room.room_number}`, req.ip);
  res.json({ message: 'Room deleted successfully' });
});

// -------------------------------------------------------------
// Tenants Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/tenants', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const status = req.query.status as string; // 'active', 'checkedout', 'all'
  const search = (req.query.q as string || '').trim().toLowerCase();

  let query = `
    SELECT t.*, r.room_number, b.bed_number,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.tenant_id = t.id AND p.period = strftime('%Y-%m', 'now')) as current_month_paid
    FROM tenants t
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    WHERE t.property_id = ?
  `;
  const params: any[] = [propertyId];

  if (status === 'active') {
    query += ` AND t.status = 'active'`;
  } else if (status === 'checkedout') {
    query += ` AND t.status = 'checkedout'`;
  }

  query += ` ORDER BY t.status ASC, r.room_number ASC, b.bed_number ASC`;

  let tenants = db.prepare(query).all(...params) as any[];

  if (search) {
    tenants = tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.phone.toLowerCase().includes(search) ||
        t.room_number.toLowerCase().includes(search) ||
        (t.email && t.email.toLowerCase().includes(search)) ||
        (t.id_detail && t.id_detail.toLowerCase().includes(search))
    );
  }

  res.json(tenants);
});

app.post('/api/properties/:propertyId/tenants', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const {
    name,
    phone,
    email,
    roomId,
    bedId,
    rent,
    deposit,
    joinedDate,
    idType,
    idDetail,
    emergencyName,
    emergencyPhone,
    shareContact,
    createPortalAccount,
  } = req.body;

  if (!name || !phone || !roomId || !bedId || !rent || !joinedDate) {
    res.status(400).json({ error: 'Name, phone, room, bed, rent and joined date are required' });
    return;
  }

  // Check bed availability
  const bed = db.prepare('SELECT status, bed_number FROM beds WHERE id = ? AND room_id = ?').get(bedId, roomId) as any;
  if (!bed || bed.status !== 'vacant') {
    res.status(400).json({ error: 'Selected bed is already occupied or unavailable' });
    return;
  }

  // Optional user account for tenant portal
  let userId: number | null = null;
  if (createPortalAccount || email) {
    const userEmail = (email || `${phone.replace(/\D/g, '')}@staydesk.in`).trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(userEmail) as any;
    if (existing) {
      userId = existing.id;
    } else {
      const defaultPass = hashPassword('Tenant@123');
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, created_at)
        VALUES (?, ?, ?, 'tenant', ?, ?)
      `).run(name.trim(), userEmail, defaultPass, phone.trim(), new Date().toISOString());
      userId = Number(uRes.lastInsertRowid);
    }
  }

  try {
    const tStmt = db.prepare(`
      INSERT INTO tenants (
        user_id, property_id, room_id, bed_id, name, phone, email,
        id_type, id_detail, emergency_name, emergency_phone, share_contact,
        rent, deposit, joined_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    const tRes = tStmt.run(
      userId,
      propertyId,
      roomId,
      bedId,
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      idType || 'Not recorded',
      idDetail ? idDetail.trim() : '',
      emergencyName ? emergencyName.trim() : '',
      emergencyPhone ? emergencyPhone.trim() : '',
      shareContact ? 1 : 0,
      Number(rent),
      Number(deposit) || 0,
      joinedDate,
      new Date().toISOString()
    );

    // Update bed status to occupied
    db.prepare('UPDATE beds SET status = "occupied" WHERE id = ?').run(bedId);

    logAudit(req.user!.id, 'ADD_TENANT', `Tenant ${name} assigned to Bed ${bed.bed_number}`, req.ip);
    res.status(201).json({ id: Number(tRes.lastInsertRowid), message: 'Tenant added and assigned successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tenants/:id', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const tenantId = Number(req.params.id);
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }

  if (!verifyPropertyAccess(req, tenant.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const {
    name,
    phone,
    email,
    rent,
    deposit,
    idType,
    idDetail,
    emergencyName,
    emergencyPhone,
    shareContact,
  } = req.body;

  db.prepare(`
    UPDATE tenants
    SET name = ?, phone = ?, email = ?, rent = ?, deposit = ?,
        id_type = ?, id_detail = ?, emergency_name = ?, emergency_phone = ?, share_contact = ?
    WHERE id = ?
  `).run(
    name.trim(),
    phone.trim(),
    email ? email.trim() : null,
    Number(rent),
    Number(deposit) || 0,
    idType || 'Not recorded',
    idDetail ? idDetail.trim() : '',
    emergencyName ? emergencyName.trim() : '',
    emergencyPhone ? emergencyPhone.trim() : '',
    shareContact ? 1 : 0,
    tenantId
  );

  logAudit(req.user!.id, 'UPDATE_TENANT', `Tenant ID ${tenantId} updated`, req.ip);
  res.json({ message: 'Tenant updated successfully' });
});

app.post('/api/tenants/:id/checkout', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const tenantId = Number(req.params.id);
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant || tenant.status !== 'active') {
    res.status(404).json({ error: 'Active tenant not found' });
    return;
  }

  if (!verifyPropertyAccess(req, tenant.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const checkoutDate = req.body.checkoutDate || new Date().toISOString().slice(0, 10);

  // Free the bed
  db.prepare('UPDATE beds SET status = "vacant" WHERE id = ?').run(tenant.bed_id);

  // Update tenant status
  db.prepare('UPDATE tenants SET status = "checkedout", checkout_date = ? WHERE id = ?').run(checkoutDate, tenantId);

  logAudit(req.user!.id, 'CHECKOUT_TENANT', `Checked out ${tenant.name}`, req.ip);
  res.json({ message: 'Tenant checked out and bed freed successfully' });
});

app.post('/api/tenants/:id/restore', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const tenantId = Number(req.params.id);
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant || tenant.status !== 'checkedout') {
    res.status(404).json({ error: 'Checked out tenant not found' });
    return;
  }

  if (!verifyPropertyAccess(req, tenant.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Check if bed is available
  const bed = db.prepare('SELECT status FROM beds WHERE id = ?').get(tenant.bed_id) as any;
  if (!bed || bed.status !== 'vacant') {
    res.status(400).json({ error: 'Original bed is no longer vacant. Edit tenant to assign a new room/bed before restoring.' });
    return;
  }

  db.prepare('UPDATE beds SET status = "occupied" WHERE id = ?').run(tenant.bed_id);
  db.prepare('UPDATE tenants SET status = "active", checkout_date = NULL WHERE id = ?').run(tenantId);

  logAudit(req.user!.id, 'RESTORE_TENANT', `Restored ${tenant.name}`, req.ip);
  res.json({ message: 'Tenant restored successfully' });
});

// -------------------------------------------------------------
// Payments & Receipts Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/payments', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const period = req.query.period as string;
  let query = `
    SELECT p.*, t.name as tenant_name, t.phone as tenant_phone, r.room_number, b.bed_number
    FROM payments p
    JOIN tenants t ON p.tenant_id = t.id
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    WHERE p.property_id = ?
  `;
  const params: any[] = [propertyId];

  if (period) {
    query += ` AND p.period = ?`;
    params.push(period);
  }

  query += ` ORDER BY p.date DESC, p.id DESC`;

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.post('/api/properties/:propertyId/payments', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const { tenantId, period, amount, date, method, ref } = req.body;
  if (!tenantId || !period || !amount || !date || !method) {
    res.status(400).json({ error: 'Tenant, rent period, amount, date, and payment method are required' });
    return;
  }

  const tenant = db.prepare('SELECT id, name, rent FROM tenants WHERE id = ? AND property_id = ?').get(tenantId, propertyId) as any;
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }

  const receiptNo = `SD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const finalRef = (ref || `TXN-${Date.now().toString().slice(-8)}`).trim();

  const stmt = db.prepare(`
    INSERT INTO payments (property_id, tenant_id, period, amount, date, method, ref, receipt_no, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
  `);

  const result = stmt.run(
    propertyId,
    tenantId,
    period,
    Number(amount),
    date,
    method,
    finalRef,
    receiptNo,
    new Date().toISOString()
  );

  logAudit(req.user!.id, 'RECORD_PAYMENT', `Receipt ${receiptNo}: ₹${amount} from ${tenant.name} (${period})`, req.ip);
  res.status(201).json({
    id: Number(result.lastInsertRowid),
    receiptNo,
    message: 'Payment recorded successfully',
  });
});

app.get('/api/payments/:id/receipt', authenticateToken, (req: AuthRequest, res: Response) => {
  const paymentId = Number(req.params.id);
  const payment = db.prepare(`
    SELECT p.*, t.name as tenant_name, t.phone as tenant_phone, t.rent as monthly_rent,
           r.room_number, b.bed_number, pr.name as property_name, pr.address as property_address,
           pr.city as property_city
    FROM payments p
    JOIN tenants t ON p.tenant_id = t.id
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    JOIN properties pr ON p.property_id = pr.id
    WHERE p.id = ?
  `).get(paymentId) as any;

  if (!payment) {
    res.status(404).json({ error: 'Receipt not found' });
    return;
  }

  if (!verifyPropertyAccess(req, payment.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json(payment);
});

// -------------------------------------------------------------
// Reminders Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/reminders', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

  const activeTenants = db.prepare(`
    SELECT t.id, t.name, t.phone, t.rent, r.room_number, b.bed_number, pr.name as property_name,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.tenant_id = t.id AND p.period = ?) as paid_amount
    FROM tenants t
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    JOIN properties pr ON t.property_id = pr.id
    WHERE t.property_id = ? AND t.status = 'active'
    ORDER BY r.room_number ASC
  `).all(period, propertyId) as any[];

  const list = activeTenants.map((t) => {
    const balance = Math.max(0, t.rent - t.paid_amount);
    const digits = t.phone.replace(/\D/g, '');
    const cleanPhone = digits.startsWith('91') ? digits : `91${digits}`;
    const text = `Hi ${t.name}, this is a friendly reminder that ₹${balance} rent is pending for ${period} for Room ${t.room_number} (${t.property_name}). Kindly clear the dues or reach out if already paid. Thank you!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    return {
      ...t,
      balance,
      isFullyPaid: balance === 0,
      whatsappUrl: waUrl,
      reminderText: text,
    };
  });

  res.json(list);
});

// -------------------------------------------------------------
// Expenses Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/expenses', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const period = req.query.period as string;
  let query = 'SELECT * FROM expenses WHERE property_id = ?';
  const params: any[] = [propertyId];

  if (period) {
    query += ` AND strftime('%Y-%m', date) = ?`;
    params.push(period);
  }

  query += ' ORDER BY date DESC, id DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.post('/api/properties/:propertyId/expenses', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const { category, amount, date, note } = req.body;
  if (!category || !amount || !date || !note) {
    res.status(400).json({ error: 'Category, amount, date, and note are required' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO expenses (property_id, category, amount, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(propertyId, category, Number(amount), date, note.trim(), new Date().toISOString());

  logAudit(req.user!.id, 'ADD_EXPENSE', `${category}: ₹${amount} (${note})`, req.ip);
  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Expense recorded' });
});

app.delete('/api/expenses/:id', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const expenseId = Number(req.params.id);
  const expense = db.prepare('SELECT property_id, category, amount FROM expenses WHERE id = ?').get(expenseId) as any;
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (!verifyPropertyAccess(req, expense.property_id)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
  logAudit(req.user!.id, 'DELETE_EXPENSE', `Deleted ${expense.category} expense of ₹${expense.amount}`, req.ip);
  res.json({ message: 'Expense deleted' });
});

// -------------------------------------------------------------
// Financial Summary & Reports
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/reports/summary', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

  const activeTenants = db.prepare(`
    SELECT id, rent, deposit
    FROM tenants
    WHERE property_id = ? AND status = 'active'
  `).all(propertyId) as any[];

  const expectedRent = activeTenants.reduce((s, t) => s + (t.rent || 0), 0);
  const totalDeposits = activeTenants.reduce((s, t) => s + (t.deposit || 0), 0);

  const payments = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as collected
    FROM payments
    WHERE property_id = ? AND period = ?
  `).get(propertyId, period) as any;
  const collectedRent = payments?.collected || 0;

  // Outstanding rent per active tenant
  const tenantPaidRows = db.prepare(`
    SELECT tenant_id, COALESCE(SUM(amount), 0) as paid
    FROM payments
    WHERE property_id = ? AND period = ?
    GROUP BY tenant_id
  `).all(propertyId, period) as any[];

  const paidMap = new Map<number, number>();
  tenantPaidRows.forEach((r) => paidMap.set(r.tenant_id, r.paid));

  let outstandingRent = 0;
  for (const t of activeTenants) {
    const paid = paidMap.get(t.id) || 0;
    outstandingRent += Math.max(0, t.rent - paid);
  }

  const expenseRows = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as cat_total
    FROM expenses
    WHERE property_id = ? AND strftime('%Y-%m', date) = ?
    GROUP BY category
  `).all(propertyId, period) as any[];

  const totalExpenses = expenseRows.reduce((s, e) => s + (e.cat_total || 0), 0);
  const netCashFlow = collectedRent - totalExpenses;

  // Occupancy metrics
  const beds = db.prepare(`
    SELECT COUNT(*) as total_beds,
           SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    WHERE r.property_id = ?
  `).get(propertyId) as any;

  const totalBeds = beds?.total_beds || 0;
  const occupiedBeds = beds?.occupied_beds || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  res.json({
    period,
    expectedRent,
    collectedRent,
    outstandingRent,
    totalExpenses,
    netCashFlow,
    totalDeposits,
    totalBeds,
    occupiedBeds,
    vacantBeds: totalBeds - occupiedBeds,
    occupancyRate,
    expenseBreakdown: expenseRows,
  });
});

// -------------------------------------------------------------
// Complaints / Maintenance Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/complaints', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const list = db.prepare(`
    SELECT c.*, t.name as tenant_name, t.phone as tenant_phone, r.room_number
    FROM complaints c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN rooms r ON t.room_id = r.id
    WHERE c.property_id = ?
    ORDER BY c.status ASC, c.created_at DESC
  `).all(propertyId);

  res.json(list);
});

app.put('/api/complaints/:id/status', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const complaintId = Number(req.params.id);
  const { status, resolutionNote } = req.body;
  if (!['pending', 'in_progress', 'resolved'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  db.prepare(`
    UPDATE complaints
    SET status = ?, resolution_note = ?, updated_at = ?
    WHERE id = ?
  `).run(status, resolutionNote || '', new Date().toISOString(), complaintId);

  res.json({ message: 'Complaint status updated' });
});

// -------------------------------------------------------------
// Notices Endpoints
// -------------------------------------------------------------
app.get('/api/properties/:propertyId/notices', authenticateToken, (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const notices = db.prepare('SELECT * FROM notices WHERE property_id = ? ORDER BY created_at DESC').all(propertyId);
  res.json(notices);
});

app.post('/api/properties/:propertyId/notices', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.params.propertyId);
  if (!verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const { title, message, priority } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO notices (property_id, title, message, priority, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(propertyId, title.trim(), message.trim(), priority || 'normal', new Date().toISOString());

  logAudit(req.user!.id, 'CREATE_NOTICE', `Notice: ${title}`, req.ip);
  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Notice posted' });
});

// -------------------------------------------------------------
// Tenant Portal Specific Endpoints (Self Service)
// -------------------------------------------------------------
app.get('/api/tenant/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'tenant') {
    res.status(403).json({ error: 'Tenant portal is for registered tenants' });
    return;
  }

  const tenant = db.prepare(`
    SELECT t.*, r.room_number, r.floor, r.room_type, b.bed_number,
           pr.name as property_name, pr.address as property_address, pr.city as property_city
    FROM tenants t
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    JOIN properties pr ON t.property_id = pr.id
    WHERE t.user_id = ?
  `).get(req.user!.id) as any;

  if (!tenant) {
    res.status(404).json({ error: 'Tenant record not found' });
    return;
  }

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const paidRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as paid
    FROM payments
    WHERE tenant_id = ? AND period = ?
  `).get(tenant.id, currentPeriod) as any;

  const currentMonthPaid = paidRow?.paid || 0;
  const currentMonthDue = Math.max(0, tenant.rent - currentMonthPaid);

  res.json({
    ...tenant,
    currentPeriod,
    currentMonthPaid,
    currentMonthDue,
  });
});

app.get('/api/tenant/roommates', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'tenant') {
    res.status(403).json({ error: 'Only tenants can view roommates' });
    return;
  }

  const myStay = db.prepare('SELECT id, room_id, property_id FROM tenants WHERE user_id = ?').get(req.user!.id) as any;
  if (!myStay) {
    res.status(404).json({ error: 'Stay not found' });
    return;
  }

  // Roommates in the SAME room only
  const roommates = db.prepare(`
    SELECT t.id, t.name, t.share_contact, t.phone, b.bed_number
    FROM tenants t
    JOIN beds b ON t.bed_id = b.id
    WHERE t.room_id = ? AND t.status = 'active' AND t.id != ?
    ORDER BY b.bed_number ASC
  `).all(myStay.room_id, myStay.id) as any[];

  // Privacy protection: phone only shown if share_contact = 1
  const sanitized = roommates.map((r) => ({
    id: r.id,
    name: r.name,
    bedNumber: r.bed_number,
    shareContact: !!r.share_contact,
    phone: r.share_contact ? r.phone : null,
  }));

  res.json(sanitized);
});

app.get('/api/tenant/payments', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'tenant') {
    res.status(403).json({ error: 'Tenant access only' });
    return;
  }

  const myStay = db.prepare('SELECT id FROM tenants WHERE user_id = ?').get(req.user!.id) as any;
  if (!myStay) {
    res.status(404).json({ error: 'Stay not found' });
    return;
  }

  const payments = db.prepare(`
    SELECT p.*, r.room_number, b.bed_number, pr.name as property_name
    FROM payments p
    JOIN tenants t ON p.tenant_id = t.id
    JOIN rooms r ON t.room_id = r.id
    JOIN beds b ON t.bed_id = b.id
    JOIN properties pr ON p.property_id = pr.id
    WHERE p.tenant_id = ?
    ORDER BY p.date DESC, p.id DESC
  `).all(myStay.id);

  res.json(payments);
});

app.post('/api/tenant/complaints', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'tenant') {
    res.status(403).json({ error: 'Tenant access only' });
    return;
  }

  const myStay = db.prepare('SELECT id, property_id FROM tenants WHERE user_id = ?').get(req.user!.id) as any;
  if (!myStay) {
    res.status(404).json({ error: 'Stay not found' });
    return;
  }

  const { title, description, category, priority } = req.body;
  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO complaints (property_id, tenant_id, title, description, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `);
  const result = stmt.run(
    myStay.property_id,
    myStay.id,
    title.trim(),
    description.trim(),
    category || 'General',
    priority || 'medium',
    new Date().toISOString()
  );

  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Complaint submitted' });
});

// -------------------------------------------------------------
// Super Admin Endpoints
// -------------------------------------------------------------
app.get('/api/superadmin/stats', authenticateToken, requireRole('superadmin'), (req: Request, res: Response) => {
  const propertyCount = (db.prepare('SELECT COUNT(*) as c FROM properties').get() as any).c;
  const ownerCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "owner"').get() as any).c;
  const tenantCount = (db.prepare('SELECT COUNT(*) as c FROM tenants WHERE status = "active"').get() as any).c;
  const bedStats = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
    FROM beds
  `).get() as any;

  const totalBeds = bedStats?.total || 0;
  const occupiedBeds = bedStats?.occupied || 0;

  res.json({
    totalProperties: propertyCount,
    totalOwners: ownerCount,
    activeTenants: tenantCount,
    totalBeds,
    occupiedBeds,
    occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
  });
});

app.get('/api/superadmin/audit', authenticateToken, requireRole('superadmin'), (req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all();
  res.json(logs);
});

// -------------------------------------------------------------
// Backup Export / Import Endpoints
// -------------------------------------------------------------
app.get('/api/backup/export', authenticateToken, requireRole('superadmin', 'owner'), (req: AuthRequest, res: Response) => {
  const propertyId = Number(req.query.propertyId);
  if (propertyId && !verifyPropertyAccess(req, propertyId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    properties: propertyId ? db.prepare('SELECT * FROM properties WHERE id = ?').all(propertyId) : db.prepare('SELECT * FROM properties').all(),
    rooms: propertyId ? db.prepare('SELECT * FROM rooms WHERE property_id = ?').all(propertyId) : db.prepare('SELECT * FROM rooms').all(),
    beds: propertyId ? db.prepare('SELECT b.* FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.property_id = ?').all(propertyId) : db.prepare('SELECT * FROM beds').all(),
    tenants: propertyId ? db.prepare('SELECT * FROM tenants WHERE property_id = ?').all(propertyId) : db.prepare('SELECT * FROM tenants').all(),
    payments: propertyId ? db.prepare('SELECT * FROM payments WHERE property_id = ?').all(propertyId) : db.prepare('SELECT * FROM payments').all(),
    expenses: propertyId ? db.prepare('SELECT * FROM expenses WHERE property_id = ?').all(propertyId) : db.prepare('SELECT * FROM expenses').all(),
  };

  logAudit(req.user!.id, 'EXPORT_BACKUP', `Property ID: ${propertyId || 'ALL'}`, req.ip);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="staydesk-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(exportData, null, 2));
});

// -------------------------------------------------------------
// Serve Production Static Web Files (from dist/)
// -------------------------------------------------------------
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`StayDesk Production API Server running on port ${PORT}`);
});
