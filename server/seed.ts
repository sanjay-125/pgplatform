import { db, initDb } from './db.ts';
import { hashPassword } from './auth.ts';

export function seedData() {
  initDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already initialized with data. Skipping seed.');
    return;
  }

  console.log('Seeding fresh production database...');

  // 1. Create Super Admin
  const superPassword = hashPassword('SuperAdmin@123');
  const superAdminStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, created_at)
    VALUES (?, ?, ?, 'superadmin', ?, ?)
  `);
  superAdminStmt.run('Platform Administrator', 'superadmin@staydesk.in', superPassword, '+91 98765 00000', new Date().toISOString());

  // 2. Create PG Owner
  const ownerPassword = hashPassword('Owner@123');
  const ownerStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, created_at)
    VALUES (?, ?, ?, 'owner', ?, ?)
  `);
  const ownerResult = ownerStmt.run('Rajesh Sharma', 'owner@staydesk.in', ownerPassword, '+91 98765 11111', new Date().toISOString());
  const ownerId = Number(ownerResult.lastInsertRowid);

  // 3. Create Properties
  const propStmt = db.prepare(`
    INSERT INTO properties (name, code, address, city, owner_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const prop1Result = propStmt.run('StayDesk Main Street PG', 'PG-MAIN', 'Plot 42, 3rd Cross, Main Road, Gandhi Nagar', 'Vellore', ownerId, new Date().toISOString());
  const prop1Id = Number(prop1Result.lastInsertRowid);

  const prop2Result = propStmt.run('StayDesk Katpadi Residency', 'PG-KATPADI', 'Near VIT East Gate, Katpadi', 'Vellore', ownerId, new Date().toISOString());
  const prop2Id = Number(prop2Result.lastInsertRowid);

  // 4. Create Rooms & Beds for Property 1
  const roomsProp1 = [
    { num: '101', floor: 1, capacity: 3, rent: 6500, type: 'Non-AC' },
    { num: '102', floor: 1, capacity: 2, rent: 7000, type: 'AC' },
    { num: '201', floor: 2, capacity: 4, rent: 6000, type: 'Non-AC' },
    { num: '202', floor: 2, capacity: 2, rent: 7500, type: 'AC' },
    { num: '301', floor: 3, capacity: 3, rent: 6200, type: 'Non-AC' },
  ];

  const roomStmt = db.prepare(`
    INSERT INTO rooms (property_id, room_number, floor, capacity, rent_per_bed, room_type, has_bathroom, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const bedStmt = db.prepare(`
    INSERT INTO beds (room_id, bed_number, status)
    VALUES (?, ?, ?)
  `);

  const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const p1RoomMap = new Map<string, { roomId: number; beds: Map<string, number> }>();

  for (const r of roomsProp1) {
    const res = roomStmt.run(prop1Id, r.num, r.floor, r.capacity, r.rent, r.type, new Date().toISOString());
    const roomId = Number(res.lastInsertRowid);
    const bMap = new Map<string, number>();
    for (let i = 0; i < r.capacity; i++) {
      const bLetter = bedLetters[i];
      const bRes = bedStmt.run(roomId, bLetter, 'vacant');
      bMap.set(bLetter, Number(bRes.lastInsertRowid));
    }
    p1RoomMap.set(r.num, { roomId, beds: bMap });
  }

  // Rooms for Property 2
  const roomsProp2 = [
    { num: '101', floor: 1, capacity: 2, rent: 8000, type: 'AC' },
    { num: '102', floor: 1, capacity: 2, rent: 8000, type: 'AC' },
    { num: '201', floor: 2, capacity: 3, rent: 6500, type: 'Non-AC' },
  ];
  for (const r of roomsProp2) {
    const res = roomStmt.run(prop2Id, r.num, r.floor, r.capacity, r.rent, r.type, new Date().toISOString());
    const roomId = Number(res.lastInsertRowid);
    for (let i = 0; i < r.capacity; i++) {
      bedStmt.run(roomId, bedLetters[i], 'vacant');
    }
  }

  // 5. Create Tenants with User Accounts
  const tenantUserStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, created_at)
    VALUES (?, ?, ?, 'tenant', ?, ?)
  `);
  const tenantStmt = db.prepare(`
    INSERT INTO tenants (
      user_id, property_id, room_id, bed_id, name, phone, email,
      id_type, id_detail, emergency_name, emergency_phone, share_contact,
      rent, deposit, joined_date, checkout_date, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateBedStatus = db.prepare(`UPDATE beds SET status = ? WHERE id = ?`);

  const tenantSeedData = [
    {
      name: 'Arun Kumar',
      email: 'arun@staydesk.in',
      phone: '9876543210',
      roomNum: '101',
      bedLetter: 'A',
      rent: 6500,
      deposit: 10000,
      joined: '2026-09-05',
      idType: 'Aadhaar (last 4 only)',
      idDetail: '1234',
      emergName: 'Kumar',
      emergPhone: '9876500001',
      shareContact: 1,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Priya S',
      email: 'priya@staydesk.in',
      phone: '9876543211',
      roomNum: '101',
      bedLetter: 'B',
      rent: 6500,
      deposit: 10000,
      joined: '2026-09-10',
      idType: 'Passport',
      idDetail: 'Z4829104',
      emergName: 'Suresh',
      emergPhone: '9876500002',
      shareContact: 0,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Vikram R',
      email: 'vikram@staydesk.in',
      phone: '9876543212',
      roomNum: '102',
      bedLetter: 'A',
      rent: 7000,
      deposit: 12000,
      joined: '2026-08-20',
      idType: 'Driving licence',
      idDetail: 'DL-TN-2022-984',
      emergName: 'Ravi',
      emergPhone: '9876500003',
      shareContact: 1,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Meena K',
      email: 'meena@staydesk.in',
      phone: '9876543213',
      roomNum: '201',
      bedLetter: 'A',
      rent: 6000,
      deposit: 8000,
      joined: '2026-10-02',
      idType: 'Voter ID',
      idDetail: 'ABC1298451',
      emergName: 'Lakshmi',
      emergPhone: '9876500004',
      shareContact: 0,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Karthik P',
      email: 'karthik@staydesk.in',
      phone: '9876543214',
      roomNum: '201',
      bedLetter: 'B',
      rent: 6000,
      deposit: 8000,
      joined: '2026-09-15',
      idType: 'Aadhaar (last 4 only)',
      idDetail: '8765',
      emergName: 'Prakash',
      emergPhone: '9876500005',
      shareContact: 1,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Naveen M',
      email: 'naveen@staydesk.in',
      phone: '9876543215',
      roomNum: '202',
      bedLetter: 'A',
      rent: 7500,
      deposit: 10000,
      joined: '2026-07-01',
      idType: 'Aadhaar (last 4 only)',
      idDetail: '4432',
      emergName: 'Mohan',
      emergPhone: '9876500006',
      shareContact: 0,
      status: 'active',
      checkout: null,
    },
    {
      name: 'Sample Former Tenant',
      email: 'former@staydesk.in',
      phone: '9876543216',
      roomNum: '301',
      bedLetter: 'A',
      rent: 6200,
      deposit: 5000,
      joined: '2026-01-10',
      idType: 'Not recorded',
      idDetail: '',
      emergName: '',
      emergPhone: '',
      shareContact: 0,
      status: 'checkedout',
      checkout: '2026-08-31',
    },
  ];

  const tenantPass = hashPassword('Tenant@123');
  const tenantIdMap = new Map<string, number>();

  for (const t of tenantSeedData) {
    const uRes = tenantUserStmt.run(t.name, t.email, tenantPass, t.phone, new Date().toISOString());
    const uId = Number(uRes.lastInsertRowid);

    const roomInfo = p1RoomMap.get(t.roomNum)!;
    const bedId = roomInfo.beds.get(t.bedLetter)!;

    const tRes = tenantStmt.run(
      uId,
      prop1Id,
      roomInfo.roomId,
      bedId,
      t.name,
      t.phone,
      t.email,
      t.idType,
      t.idDetail,
      t.emergName,
      t.emergPhone,
      t.shareContact,
      t.rent,
      t.deposit,
      t.joined,
      t.checkout,
      t.status,
      new Date().toISOString()
    );

    const tenantId = Number(tRes.lastInsertRowid);
    tenantIdMap.set(t.name, tenantId);

    if (t.status === 'active') {
      updateBedStatus.run('occupied', bedId);
    }
  }

  // 6. Payments
  const currentMonth = new Date().toISOString().slice(0, 7);
  const paymentStmt = db.prepare(`
    INSERT INTO payments (property_id, tenant_id, period, amount, date, method, ref, receipt_no, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
  `);

  const paymentsData = [
    { tenant: 'Arun Kumar', amount: 3000, method: 'UPI', ref: 'UPI/9847291048/Arun', receipt: 'SD-2026-001' },
    { tenant: 'Priya S', amount: 6500, method: 'UPI', ref: 'UPI/9820194821/Priya', receipt: 'SD-2026-002' },
    { tenant: 'Vikram R', amount: 7000, method: 'Cash', ref: 'CASH-REC-003', receipt: 'SD-2026-003' },
    { tenant: 'Karthik P', amount: 6000, method: 'Bank transfer', ref: 'NEFT-AXIS-91823', receipt: 'SD-2026-004' },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  for (const p of paymentsData) {
    const tId = tenantIdMap.get(p.tenant);
    if (tId) {
      paymentStmt.run(prop1Id, tId, currentMonth, p.amount, todayStr, p.method, p.ref, p.receipt, new Date().toISOString());
    }
  }

  // 7. Expenses
  const expStmt = db.prepare(`
    INSERT INTO expenses (property_id, category, amount, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  expStmt.run(prop1Id, 'Electricity', 2450, todayStr, 'Monthly electricity bill for Block A & B', new Date().toISOString());
  expStmt.run(prop1Id, 'Wi-Fi', 999, todayStr, 'Airtel Fiber 200Mbps Monthly Recharge', new Date().toISOString());
  expStmt.run(prop1Id, 'Cleaning', 1500, todayStr, 'Cleaning supplies & deep clean vendor', new Date().toISOString());

  // 8. Complaints
  const compStmt = db.prepare(`
    INSERT INTO complaints (property_id, tenant_id, title, description, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const arunId = tenantIdMap.get('Arun Kumar')!;
  compStmt.run(
    prop1Id,
    arunId,
    'Ceiling fan regulator loose in Room 101',
    'The regulator switch rotates freely and stays on speed 5. Please fix.',
    'Electrical',
    'medium',
    'in_progress',
    new Date().toISOString()
  );

  const meenaId = tenantIdMap.get('Meena K')!;
  compStmt.run(
    prop1Id,
    meenaId,
    'Bathroom tap leaking in 201',
    'The cold water tap in Room 201 bathroom is continuously dripping.',
    'Plumbing',
    'low',
    'pending',
    new Date().toISOString()
  );

  // 9. Notices
  const noticeStmt = db.prepare(`
    INSERT INTO notices (property_id, title, message, priority, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  noticeStmt.run(
    prop1Id,
    'Water Tank Cleaning This Saturday',
    'Overhead water tank maintenance will take place on Saturday between 10:00 AM and 1:00 PM. Water supply will be temporarily paused.',
    'high',
    new Date().toISOString()
  );

  noticeStmt.run(
    prop1Id,
    'Gate Timings Reminder',
    'Main entry gate closes at 10:30 PM. Please inform the warden in advance for late returns due to exam or office shifts.',
    'normal',
    new Date().toISOString()
  );

  console.log('Production database seeded successfully.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedData();
}
