/**
 * Access Control System
 * RBAC (Role-Based Access Control) for calendar sharing
 */

export type AccessLevel = "none" | "read" | "write" | "admin";

export const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
};

export const ACCESS_LABELS: Record<AccessLevel, string> = {
  none: "No Access",
  read: "Viewer",
  write: "Editor",
  admin: "Admin",
};

export interface AccessRule {
  id: string;
  calendarId: string;
  principalId: string;
  principalType: "user" | "group" | "public-link";
  accessLevel: AccessLevel;
  createdAt: number;
  createdBy: string;
  expiresAt?: number;
  conditions?: AccessConditions;
}

export interface AccessConditions {
  ipRange?: string[];
  timeRestrictions?: TimeRestriction[];
  deviceIds?: string[];
}

export interface TimeRestriction {
  dayOfWeek: number[];
  startHour: number;
  endHour: number;
  timezone: string;
}

export interface AccessDecision {
  allowed: boolean;
  level: AccessLevel;
  reason?: string;
}

export interface AuditLogEntry {
  id: string;
  calendarId: string;
  action: AuditAction;
  principalId: string;
  principalType: "user" | "group" | "public-link";
  targetId?: string;
  timestamp: number;
  ipAddress?: string;
  success: boolean;
  details?: Record<string, unknown>;
}

export type AuditAction =
  | "calendar_view"
  | "calendar_create"
  | "calendar_update"
  | "calendar_delete"
  | "event_create"
  | "event_read"
  | "event_update"
  | "event_delete"
  | "member_add"
  | "member_remove"
  | "member_update"
  | "invite_create"
  | "invite_revoke"
  | "key_refresh"
  | "access_denied";

const accessRules = new Map<string, AccessRule[]>();
const auditLog: AuditLogEntry[] = [];

export function hasAccessLevel(
  current: AccessLevel,
  required: AccessLevel
): boolean {
  return ACCESS_HIERARCHY[current] >= ACCESS_HIERARCHY[required];
}

export function canPerformAction(
  memberLevel: AccessLevel,
  action: AuditAction
): boolean {
  const permissions: Record<AccessLevel, AuditAction[]> = {
    none: [],
    read: ["calendar_view", "event_read"],
    write: [
      "calendar_view",
      "event_read",
      "event_create",
      "event_update",
    ],
    admin: [
      "calendar_view",
      "calendar_create",
      "calendar_update",
      "calendar_delete",
      "event_create",
      "event_read",
      "event_update",
      "event_delete",
      "member_add",
      "member_remove",
      "member_update",
      "invite_create",
      "invite_revoke",
      "key_refresh",
    ],
  };

  return permissions[memberLevel]?.includes(action) ?? false;
}

export function checkAccess(
  calendarId: string,
  principalId: string,
  requiredLevel: AccessLevel
): AccessDecision {
  const rules = accessRules.get(calendarId) || [];
  const rule = rules.find((r) => r.principalId === principalId);

  if (!rule) {
    logAudit(calendarId, "access_denied", principalId, "user", {
      reason: "no rule found",
    });
    return { allowed: false, level: "none", reason: "No access rule found" };
  }

  if (rule.expiresAt && Date.now() > rule.expiresAt) {
    logAudit(calendarId, "access_denied", principalId, "user", {
      reason: "rule expired",
    });
    return { allowed: false, level: "none", reason: "Access rule has expired" };
  }

  if (!hasAccessLevel(rule.accessLevel, requiredLevel)) {
    logAudit(calendarId, "access_denied", principalId, "user", {
      required: requiredLevel,
      current: rule.accessLevel,
    });
    return {
      allowed: false,
      level: rule.accessLevel,
      reason: `Requires ${requiredLevel} access`,
    };
  }

  return { allowed: true, level: rule.accessLevel };
}

export function createAccessRule(
  calendarId: string,
  principalId: string,
  principalType: "user" | "group" | "public-link",
  accessLevel: AccessLevel,
  createdBy: string,
  expiresAt?: number,
  conditions?: AccessConditions
): AccessRule {
  const rule: AccessRule = {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    principalId,
    principalType,
    accessLevel,
    createdAt: Date.now(),
    createdBy,
    expiresAt,
    conditions,
  };

  const rules = accessRules.get(calendarId) || [];
  rules.push(rule);
  accessRules.set(calendarId, rules);

  logAudit(calendarId, "member_add", createdBy, "user", {
    targetId: principalId,
    accessLevel,
  });

  return rule;
}

export function updateAccessRule(
  calendarId: string,
  principalId: string,
  accessLevel: AccessLevel
): AccessRule | null {
  const rules = accessRules.get(calendarId);
  if (!rules) return null;

  const rule = rules.find((r) => r.principalId === principalId);
  if (!rule) return null;

  rule.accessLevel = accessLevel;
  return rule;
}

export function deleteAccessRule(
  calendarId: string,
  principalId: string
): boolean {
  const rules = accessRules.get(calendarId);
  if (!rules) return false;

  const index = rules.findIndex((r) => r.principalId === principalId);
  if (index === -1) return false;

  rules.splice(index, 1);
  logAudit(calendarId, "member_remove", principalId, "user");

  return true;
}

export function getAccessRules(calendarId: string): AccessRule[] {
  return accessRules.get(calendarId) || [];
}

export function getPrincipalAccess(
  calendarId: string,
  principalId: string
): AccessLevel {
  const rules = accessRules.get(calendarId) || [];
  const rule = rules.find((r) => r.principalId === principalId);
  return rule?.accessLevel || "none";
}

export function logAudit(
  calendarId: string,
  action: AuditAction,
  principalId: string,
  principalType: "user" | "group" | "public-link",
  details?: Record<string, unknown>
): void {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    action,
    principalId,
    principalType,
    timestamp: Date.now(),
    success: true,
    details,
  };

  auditLog.push(entry);

  if (auditLog.length > 10000) {
    auditLog.shift();
  }
}

export function getAuditLog(
  calendarId: string,
  limit = 100
): AuditLogEntry[] {
  return auditLog
    .filter((e) => e.calendarId === calendarId)
    .slice(-limit)
    .reverse();
}

export function getAccessSummary(calendarId: string): {
  total: number;
  byLevel: Record<AccessLevel, number>;
} {
  const rules = getAccessRules(calendarId);
  const byLevel: Record<AccessLevel, number> = {
    none: 0,
    read: 0,
    write: 0,
    admin: 0,
  };

  for (const rule of rules) {
    byLevel[rule.accessLevel]++;
  }

  return { total: rules.length, byLevel };
}

export function validateAccessChange(
  calendarId: string,
  currentLevel: AccessLevel,
  newLevel: AccessLevel
): { allowed: boolean; reason?: string } {
  const currentRank = ACCESS_HIERARCHY[currentLevel];
  const newRank = ACCESS_HIERARCHY[newLevel];

  if (newRank > currentRank) {
    return {
      allowed: false,
      reason: "Cannot grant higher access level than you possess",
    };
  }

  return { allowed: true };
}

export function bulkGrantAccess(
  calendarId: string,
  principals: Array<{
    id: string;
    type: "user" | "group" | "public-link";
    level: AccessLevel;
  }>,
  createdBy: string
): AccessRule[] {
  const rules: AccessRule[] = [];

  for (const principal of principals) {
    const rule = createAccessRule(
      calendarId,
      principal.id,
      principal.type,
      principal.level,
      createdBy
    );
    rules.push(rule);
  }

  return rules;
}

export function expireOldRules(calendarId: string): number {
  const rules = accessRules.get(calendarId);
  if (!rules) return 0;

  const now = Date.now();
  const expired = rules.filter((r) => r.expiresAt && r.expiresAt < now);

  for (const rule of expired) {
    deleteAccessRule(calendarId, rule.principalId);
  }

  return expired.length;
}