import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import { userSchema } from "@/lib/validations/user";

export async function GET() {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
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

  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = userSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data user tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "Email sudah digunakan oleh user lain." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      passwordHash
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

  return NextResponse.json(
    { message: "User berhasil ditambahkan.", data: user },
    { status: 201 }
  );
}
