import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  apiConflict,
  apiMessage,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError
} from "@/lib/api-response";
import { officerUpdateSchema } from "@/lib/validations/officer";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;

  const officer = await prisma.officer.findUnique({
    where: { id },
    include: {
      unit: true
    }
  });

  if (!officer) {
    return apiNotFound("Petugas tidak ditemukan.");
  }

  return apiSuccess(officer);
}

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
  const parsed = officerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data petugas tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingOfficer = await prisma.officer.findUnique({
    where: { id }
  });

  if (!existingOfficer) {
    return apiNotFound("Petugas tidak ditemukan.");
  }

  const nip = parsed.data.nip.trim();
  const name = parsed.data.name.trim();
  const position = parsed.data.position?.trim() || null;
  const unitId = parsed.data.unitId?.trim() || null;
  const isActive = parsed.data.isActive;

  const duplicateNip = await prisma.officer.findFirst({
    where: {
      id: { not: id },
      nip
    }
  });

  if (duplicateNip) {
    return apiConflict("NIP sudah digunakan oleh petugas lain.");
  }

  const officer = await prisma.officer.update({
    where: { id },
    data: {
      nip,
      name,
      position,
      unitId,
      isActive
    },
    include: {
      unit: true
    }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Officer",
    entityId: officer.id,
    beforeData: toAuditJson(existingOfficer),
    afterData: toAuditJson(officer)
  });

  return apiSuccess(officer, {
    message: "Data petugas berhasil diperbarui."
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const { id } = await context.params;
  const existingOfficer = await prisma.officer.findUnique({
    where: { id },
    include: {
      unit: true,
      _count: {
        select: {
          assessments: true,
          rewardPunishments: true
        }
      }
    }
  });

  if (!existingOfficer) {
    return apiNotFound("Petugas tidak ditemukan.");
  }

  if (
    existingOfficer._count.assessments > 0 ||
    existingOfficer._count.rewardPunishments > 0
  ) {
    return apiConflict(
      "Petugas tidak bisa dihapus karena sudah memiliki histori penilaian atau reward dan punishment."
    );
  }

  await prisma.officer.delete({
    where: { id }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Officer",
    entityId: existingOfficer.id,
    beforeData: toAuditJson(existingOfficer)
  });

  return apiMessage("Petugas berhasil dihapus.");
}
