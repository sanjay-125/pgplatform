# StayDesk Release Checklist

## Prototype acceptance & Core Features
- [x] Add/edit tenant: name, phone, optional ID reference, emergency contact, room/bed, joining date, rent, deposit.
- [x] Validate room capacity and prevent duplicate bed assignment.
- [x] Record full and partial rent payments by month.
- [x] Confirm outstanding balance = monthly rent less payments recorded for that tenant/month, with floor at zero.
- [x] Generate receipt with reference, amount, date, rent period, method, tenant and room/bed.
- [x] Open WhatsApp reminder and review pre-filled text before sending.
- [x] Add expense; confirm monthly net cash flow = payments received that month minus expenses dated in that month.
- [x] Check out tenant; verify bed becomes vacant and payment history remains.
- [x] Confirm roommate phone visibility only when sharing consent is recorded.
- [x] Export and verify JSON backup.

## Production readiness (Implemented & Verified)
- [x] Add secure owner login and role-based authorization (JWT + bcrypt).
- [x] Add tenant authentication for roommate view; enforce access checks server-side.
- [x] Replace localStorage with secured relational database (`node:sqlite`) and tested backup/restore.
- [x] Multi-property data isolation: `property_id` enforced on every room, tenant, payment, and expense.
- [x] Minimize identity data: store only necessary references (e.g., last 4 digits of Aadhaar or passport number).
- [x] Maintenance complaint ticket tracker (tenant to owner workflow).
- [x] Real-time security audit logging for administrative actions.
- [x] Fully responsive modern React + Tailwind interface with desktop sidebar and mobile bottom navigation.
- [x] Capacitor Android configuration updated and synced with production bundle.

## Google Play release
- [ ] Confirm unique final application ID (`com.staydesk.pgmanager`).
- [ ] Set target API to current Play Console requirement.
- [ ] Generate signed Android App Bundle (.aab) and securely back up upload key.
- [ ] Complete listing, screenshots, icon, content rating, app access instructions and privacy policy URL.
- [ ] Complete Data safety and permissions declarations accurately.
- [ ] Run internal testing; follow account-specific closed-testing requirements.
- [ ] Review Play Console warnings before production release.
