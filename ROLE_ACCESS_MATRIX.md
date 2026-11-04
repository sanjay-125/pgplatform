# StayDesk role access matrix

| Capability | User / Tenant | Admin / PG owner | Super Admin |
|---|---|---|---|
| View own profile and stay | Yes | Only if separately a tenant | Only for audited support need |
| View roommate names | Same room only | For assigned PGs | Restricted support access |
| View roommate phone | Only with explicit sharing consent | For legitimate PG operations | Restricted and audited |
| View ID / emergency contacts | Own details only where required | For assigned PGs and legitimate need | Restricted and audited |
| Manage rooms / beds | No | Assigned properties | Platform/property administration |
| Manage tenants | No | Assigned properties | Account/property support only |
| Record rent / deposits / expenses | No | Assigned properties | No routine changes; audited support only |
| View rent / cash-flow reports | Own balance only | Assigned properties | Aggregate platform metrics by default |
| Create PG properties | No | No, unless explicitly delegated | Yes |
| Assign admins to properties | No | No | Yes |
| Manage platform roles/settings | No | No | Yes |

## Multi-property ownership
A single Admin account can be assigned to multiple properties, for example PG 1 and PG 2. Store each property's data with a `property_id`; rooms, tenant allocations, rent payments, expenses and receipts must inherit or reference that property. Every backend query must verify the signed-in admin is assigned to that property. The property selector in the demo UI is not a security boundary.

## Production authentication requirements
- Use a real identity provider or secure backend authentication.
- Enforce roles and property membership on the server for every request.
- Tenant portal must use the authenticated tenant ID from the server session, never a tenant ID supplied by the browser.
- Store passwords only as secure password hashes if you manage credentials yourself; never store plain-text passwords.
- Provide logout/session expiry, account recovery, audit logging for sensitive access, and a process for removing access when tenants check out.
