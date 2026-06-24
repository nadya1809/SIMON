import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
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
    return NextResponse.json(
      { message: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = unitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data unit tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingUnit = await prisma.unit.findUnique({
    where: { id }
  });

  if (!existingUnit) {
    return NextResponse.json(
      { message: "Unit tidak ditemukan." },
      { status: 404 }
    );
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
    return NextResponse.json(
      { message: "Nama unit sudah digunakan." },
      { status: 409 }
    );
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

  return NextResponse.json({
    message: "Unit berhasil diperbarui.",
    data: unit
  });
}
