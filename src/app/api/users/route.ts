import bcrypt from "bcryptjs";
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
import {
  createPaginationMeta,
  resolvePaginationParams
} from "@/lib/pagination";
import { userSchema } from "@/lib/validations/user";

export async function GET(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const { page, rowsPerPage } = resolvePaginationParams(
    searchParams.get("page"),
    searchParams.get("rowsPerPage")
  );

  const totalItems = await prisma.user.count();
  const meta = createPaginationMeta(totalItems, page, rowsPerPage);

  const users = await prisma.user.findMany({
    skip: (meta.page - 1) * meta.rowsPerPage,
    take: meta.rowsPerPage,
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

  return apiSuccess(users, { meta });
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
  const parsed = userSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data user tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return apiConflict("Email sudah digunakan oleh user lain.", {
      email: ["Email sudah digunakan oleh user lain."]
    });
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

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    afterData: toAuditJson(user)
  });

  return apiCreated(user, "User berhasil ditambahkan.");
}
