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
  const sortBy = searchParams.get("sortBy")?.trim();
  const { page, rowsPerPage } = resolvePaginationParams(
    searchParams.get("page"),
    searchParams.get("rowsPerPage")
  );

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { nip: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(unitId ? { unitId } : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
        ? { isActive: false }
        : {})
  };

  const totalItems = await prisma.officer.count({ where });
  const meta = createPaginationMeta(totalItems, page, rowsPerPage);

  const officers = await prisma.officer.findMany({
    where,
    skip: (meta.page - 1) * meta.rowsPerPage,
    take: meta.rowsPerPage,
    include: {
      unit: true
    },
    orderBy:
      sortBy === "nip"
        ? [{ nip: "asc" }]
        : sortBy === "unit"
          ? [{ unit: { name: "asc" } }, { name: "asc" }]
          : [{ name: "asc" }]
  });

  return apiSuccess(officers, { meta });
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
  const parsed = officerSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data petugas tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const nip = parsed.data.nip.trim();
  const name = parsed.data.name.trim();
  const jabatan = parsed.data.jabatan?.trim() || null;
  const unitId = parsed.data.unitId?.trim() || null;
  const isActive = parsed.data.isActive;

  const duplicateNip = await prisma.officer.findUnique({
    where: { nip }
  });

  if (duplicateNip) {
    return apiConflict("NIP sudah digunakan oleh petugas lain.", {
      nip: ["NIP sudah digunakan oleh petugas lain."]
    });
  }

  const officer = await prisma.officer.create({
    data: {
      nip,
      name,
      jabatan,
      unitId,
      isActive
    },
    include: {
      unit: true
    }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Officer",
    entityId: officer.id,
    afterData: toAuditJson(officer)
  });

  return apiCreated(officer, "Petugas berhasil ditambahkan.");
}
