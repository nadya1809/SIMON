import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  apiConflict,
  apiCreated,
  apiSuccess,
  apiUnauthorized,
  apiValidationError
} from "@/lib/api-response";
import { unitSchema } from "@/lib/validations/unit";

export async function GET() {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const units = await prisma.unit.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { officers: true }
      }
    }
  });

  return apiSuccess(units);
}

export async function POST(request: Request) {
  const { session, response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const body = await request.json();
  const parsed = unitSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data unit tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const name = parsed.data.name.trim();
  const description = parsed.data.description?.trim() || null;

  const existingUnit = await prisma.unit.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    }
  });

  if (existingUnit) {
    return apiConflict("Nama unit sudah digunakan.");
  }

  const unit = await prisma.unit.create({
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
    action: "CREATE",
    entity: "Unit",
    entityId: unit.id,
    afterData: toAuditJson(unit)
  });

  return apiCreated(unit, "Unit berhasil ditambahkan.");
}
