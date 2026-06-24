import bcrypt from "bcryptjs";
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
import { userUpdateSchema } from "@/lib/validations/user";

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
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data user tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!existingUser) {
    return apiNotFound("User tidak ditemukan.");
  }

  const email = parsed.data.email.trim().toLowerCase();

  const duplicateEmail = await prisma.user.findFirst({
    where: {
      id: { not: id },
      email
    }
  });

  if (duplicateEmail) {
    return apiConflict("Email sudah digunakan oleh user lain.");
  }

  if (session.user.id === id && !parsed.data.isActive) {
    return apiValidationError(
      "Anda tidak bisa menonaktifkan akun yang sedang dipakai."
    );
  }

  const nextPassword = parsed.data.password?.trim();

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name.trim(),
      email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      ...(nextPassword
        ? { passwordHash: await bcrypt.hash(nextPassword, 10) }
        : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    beforeData: toAuditJson(existingUser),
    afterData: toAuditJson(user)
  });

  return apiSuccess(user, {
    message: "Data user berhasil diperbarui."
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

  if (session.user.id === id) {
    return apiValidationError("Akun yang sedang dipakai tidak bisa dihapus.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          assessments: true,
          decisions: true,
          auditLogs: true
        }
      }
    }
  });

  if (!existingUser) {
    return apiNotFound("User tidak ditemukan.");
  }

  if (
    existingUser._count.assessments > 0 ||
    existingUser._count.decisions > 0 ||
    existingUser._count.auditLogs > 0
  ) {
    return apiConflict(
      "User tidak bisa dihapus karena sudah memiliki histori aktivitas sistem."
    );
  }

  await prisma.user.delete({
    where: { id }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "User",
    entityId: existingUser.id,
    beforeData: toAuditJson(existingUser)
  });

  return apiMessage("User berhasil dihapus.");
}
