import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  apiConflict,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError
} from "@/lib/api-response";
import { unitUpdateSchema } from "@/lib/validations/unit";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { session, response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = unitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data unit tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingUnit = await prisma.unit.findUnique({
    where: { id }
  });

  if (!existingUnit) {
    return apiNotFound("Unit tidak ditemukan.");
  }

  const name = parsed.data.name.trim();
  const description = parsed.data.description?.trim() || null;

  const duplicateName = await prisma.unit.findFirst({
    where: {
      id: { not: id },
      name: {
        equals: name,
        mode: "insensitive"
      }
    }
  });

  if (duplicateName) {
    return apiConflict("Nama unit sudah digunakan.");
  }

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      name,
      description
    },
    include: {
      _count: {
        select: { officers: true }
      }
    }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Unit",
    entityId: unit.id,
    beforeData: toAuditJson(existingUnit),
    afterData: toAuditJson(unit)
  });

  return apiSuccess(unit, {
    message: "Unit berhasil diperbarui."
  });
}
