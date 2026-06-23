import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
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

  return NextResponse.json({ data: units });
}

export async function POST(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = unitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data unit tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
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
    return NextResponse.json(
      { message: "Nama unit sudah digunakan." },
      { status: 409 }
    );
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

  return NextResponse.json(
    { message: "Unit berhasil ditambahkan.", data: unit },
    { status: 201 }
  );
}
