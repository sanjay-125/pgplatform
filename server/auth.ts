import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'staydesk-secret-key-production-grade-2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'owner' | 'tenant';
  phone?: string;
  tenantId?: number;
  propertyIds?: number[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hashed: string): boolean {
  return bcrypt.compareSync(plainText, hashed);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      propertyIds: user.propertyIds,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Array<'superadmin' | 'owner' | 'tenant'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this resource' });
      return;
    }
    next();
  };
}

export function verifyPropertyAccess(req: AuthRequest, propertyId: number): boolean {
  if (!req.user) return false;
  if (req.user.role === 'superadmin') return true;
  if (req.user.role === 'owner') {
    const row = db.prepare('SELECT id FROM properties WHERE id = ? AND owner_id = ?').get(propertyId, req.user.id);
    return !!row;
  }
  if (req.user.role === 'tenant') {
    const row = db.prepare('SELECT property_id FROM tenants WHERE id = ? AND user_id = ?').get(req.user.tenantId, req.user.id) as { property_id: number } | undefined;
    return row?.property_id === propertyId;
  }
  return false;
}
