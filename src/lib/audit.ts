import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditPayload = {
  userId: string;
  action: Prisma.AuditLogUncheckedCreateInput["action"];
  entity: string;
  entityId: string;
  beforeData?: Prisma.InputJsonValue | null;
  afterData?: Prisma.InputJsonValue | null;
};

export async function writeAuditLog(payload: AuditPayload) {
  return prisma.auditLog.create({
    data: {
      userId: payload.userId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      beforeData: payload.beforeData ?? undefined,
      afterData: payload.afterData ?? undefined
    }
  });
}

export function toAuditJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
