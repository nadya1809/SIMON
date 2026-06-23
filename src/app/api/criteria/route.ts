import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { criteriaSchema } from "@/lib/validations/criteria";

export async function GET() {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const criteria = await prisma.criteria.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  return NextResponse.json({ data: criteria });
}

export async function POST(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = criteriaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data kriteria tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const name = parsed.data.name.trim();
  const description = parsed.data.description?.trim() || null;

  const duplicateName = await prisma.criteria.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    }
  });

  if (duplicateName) {
    return NextResponse.json(
      { message: "Nama kriteria sudah digunakan." },
      { status: 409 }
    );
  }

  const criteria = await prisma.criteria.create({
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

  return NextResponse.json(
    { message: "Kriteria berhasil ditambahkan.", data: criteria },
    { status: 201 }
  );
}
