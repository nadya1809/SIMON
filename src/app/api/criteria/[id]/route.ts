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
import { criteriaUpdateSchema } from "@/lib/validations/criteria";

const protectedCriteriaIds = new Set([
  "default-discipline-criteria",
  "default-performance-criteria"
]);

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
  const parsed = criteriaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data kriteria tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingCriteria = await prisma.criteria.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  if (!existingCriteria) {
    return apiNotFound("Kriteria tidak ditemukan.");
  }

  const name = parsed.data.name.trim();
  const description = parsed.data.description?.trim() || null;

  const duplicateName = await prisma.criteria.findFirst({
    where: {
      id: { not: id },
      name: {
        equals: name,
        mode: "insensitive"
      }
    }
  });

  if (duplicateName) {
    return apiConflict("Nama kriteria sudah digunakan.", {
      name: ["Nama kriteria sudah digunakan."]
    });
  }

  const duplicateSortOrder = await prisma.criteria.findFirst({
    where: {
      id: { not: id },
      sortOrder: parsed.data.sortOrder
    }
  });

  if (duplicateSortOrder) {
    return apiConflict("Urutan tampil sudah digunakan oleh kriteria lain.", {
      sortOrder: [
        `Urutan tampil ${parsed.data.sortOrder} sudah dipakai oleh "${duplicateSortOrder.name}".`
      ]
    });
  }

  const criteria = await prisma.criteria.update({
    where: { id },
    data: {
      name,
      description,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive
    },
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Criteria",
    entityId: criteria.id,
    beforeData: toAuditJson(existingCriteria),
    afterData: toAuditJson(criteria)
  });

  return apiSuccess(criteria, {
    message: "Kriteria berhasil diperbarui."
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

  if (protectedCriteriaIds.has(id)) {
    return apiConflict("Kriteria default sistem tidak boleh dihapus.");
  }

  const existingCriteria = await prisma.criteria.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  if (!existingCriteria) {
    return apiNotFound("Kriteria tidak ditemukan.");
  }

  if (existingCriteria._count.scores > 0) {
    return apiConflict(
      "Kriteria tidak bisa dihapus karena sudah memiliki histori skor."
    );
  }

  await prisma.criteria.delete({
    where: { id }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Criteria",
    entityId: existingCriteria.id,
    beforeData: toAuditJson(existingCriteria)
  });

  return apiMessage("Kriteria berhasil dihapus.");
}
