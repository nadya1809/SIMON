import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
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
    return NextResponse.json(
      { message: "Petugas tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: officer });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = officerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data petugas tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingOfficer = await prisma.officer.findUnique({
    where: { id }
  });

  if (!existingOfficer) {
    return NextResponse.json(
      { message: "Petugas tidak ditemukan." },
      { status: 404 }
    );
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
    return NextResponse.json(
      { message: "NIP sudah digunakan oleh petugas lain." },
      { status: 409 }
    );
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

  return NextResponse.json({
    message: "Data petugas berhasil diperbarui.",
    data: officer
  });
}
