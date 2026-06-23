import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { criteriaUpdateSchema } from "@/lib/validations/criteria";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = criteriaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data kriteria tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
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
    return NextResponse.json(
      { message: "Kriteria tidak ditemukan." },
      { status: 404 }
    );
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
    return NextResponse.json(
      { message: "Nama kriteria sudah digunakan." },
      { status: 409 }
    );
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

  return NextResponse.json({
    message: "Kriteria berhasil diperbarui.",
    data: criteria
  });
}
