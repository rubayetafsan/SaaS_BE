import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export enum Role {
  OWNER = 5,
  ADMIN = 4,
  MAINTAINER = 3,
  SUBSCRIBED_USER = 2,
  GUEST = 1,
}

const roleMap: Record<string, number> = {
  OWNER: Role.OWNER,
  ADMIN: Role.ADMIN,
  MAINTAINER: Role.MAINTAINER,
  SUBSCRIBED_USER: Role.SUBSCRIBED_USER,
  GUEST: Role.GUEST,
};

/**
 * Get numeric role level
 */
export function getRoleLevel(role: string): number {
  return roleMap[role] || 0;
}

/**
 * Check if user has required role level
 */
export function hasRoleLevel(userRole: string, requiredLevel: number): boolean {
  return getRoleLevel(userRole) >= requiredLevel;
}

/**
 * Require minimum role level middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const userRoleLevel = getRoleLevel(req.user.role);
    const hasAccess = allowedRoles.some(role => getRoleLevel(role) <= userRoleLevel);
    
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }
    
    next();
  };
}

/**
 * Require exact role (not hierarchy)
 */
export function requireExactRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }
    
    next();
  };
}

/**
 * Check if user can manage target user
 */
export function canManageUser(managerRole: string, targetRole: string): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // OWNER can manage everyone
  if (managerLevel === Role.OWNER) return true;
  
  // ADMIN can manage everyone except OWNER
  if (managerLevel === Role.ADMIN && targetLevel < Role.OWNER) return true;
  
  // Others cannot manage users
  return false;
}

/**
 * Check if user can change role
 */
export function canChangeRole(managerRole: string, fromRole: string, toRole: string): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const fromLevel = getRoleLevel(fromRole);
  const toLevel = getRoleLevel(toRole);
  
  // Only OWNER can change to/from OWNER
  if (toLevel === Role.OWNER || fromLevel === Role.OWNER) {
    return managerLevel === Role.OWNER;
  }
  
  // ADMIN can change other roles (except OWNER)
  if (managerLevel === Role.ADMIN) {
    return fromLevel < Role.OWNER && toLevel < Role.OWNER;
  }
  
  return false;
}