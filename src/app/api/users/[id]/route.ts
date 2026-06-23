import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
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
    return NextResponse.json(
      { message: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data user tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    return NextResponse.json(
      { message: "User tidak ditemukan." },
      { status: 404 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const duplicateEmail = await prisma.user.findFirst({
    where: {
      id: { not: id },
      email
    }
  });

  if (duplicateEmail) {
    return NextResponse.json(
      { message: "Email sudah digunakan oleh user lain." },
      { status: 409 }
    );
  }

  if (session.user.id === id && !parsed.data.isActive) {
    return NextResponse.json(
      { message: "Anda tidak bisa menonaktifkan akun yang sedang dipakai." },
      { status: 400 }
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

  return NextResponse.json({
    message: "Data user berhasil diperbarui.",
    data: user
  });
}
