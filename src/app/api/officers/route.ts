import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { officerSchema } from "@/lib/validations/officer";

export async function GET(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const unitId = searchParams.get("unitId")?.trim();
  const status = searchParams.get("status")?.trim();

  const officers = await prisma.officer.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { nip: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(unitId ? { unitId } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {})
    },
    include: {
      unit: true
    },
    orderBy: [{ name: "asc" }]
  });

  return NextResponse.json({ data: officers });
}

export async function POST(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = officerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data petugas tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const nip = parsed.data.nip.trim();
  const name = parsed.data.name.trim();
  const position = parsed.data.position?.trim() || null;
  const unitId = parsed.data.unitId?.trim() || null;
  const isActive = parsed.data.isActive;

  const duplicateNip = await prisma.officer.findUnique({
    where: { nip }
  });

  if (duplicateNip) {
    return NextResponse.json(
      { message: "NIP sudah digunakan oleh petugas lain." },
      { status: 409 }
    );
  }

  const officer = await prisma.officer.create({
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

  return NextResponse.json(
    { message: "Petugas berhasil ditambahkan.", data: officer },
    { status: 201 }
  );
}
