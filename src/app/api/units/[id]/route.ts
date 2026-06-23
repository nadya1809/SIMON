import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { unitUpdateSchema } from "@/lib/validations/unit";

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

  return NextResponse.json({
    message: "Unit berhasil diperbarui.",
    data: unit
  });
}
