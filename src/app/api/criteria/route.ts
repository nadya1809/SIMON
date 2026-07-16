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
import { criteriaSchema } from "@/lib/validations/criteria";

export async function GET(request: Request) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sortBy")?.trim();
  const sortDirection =
    searchParams.get("sortDirection")?.trim() === "desc" ? "desc" : "asc";
  const { page, rowsPerPage } = resolvePaginationParams(
    searchParams.get("page"),
    searchParams.get("rowsPerPage")
  );

  const totalItems = await prisma.criteria.count();
  const meta = createPaginationMeta(totalItems, page, rowsPerPage);

  const criteria = await prisma.criteria.findMany({
    skip: (meta.page - 1) * meta.rowsPerPage,
    take: meta.rowsPerPage,
    orderBy:
      sortBy === "name"
        ? [{ name: sortDirection }]
        : sortBy === "status"
          ? [{ isActive: sortDirection }, { sortOrder: "asc" }]
          : sortBy === "scores"
            ? [{ scores: { _count: sortDirection } }, { sortOrder: "asc" }]
            : [{ sortOrder: sortDirection }, { name: "asc" }],
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  return apiSuccess(criteria, { meta });
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
  const parsed = criteriaSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data kriteria tidak valid.",
      parsed.error.flatten().fieldErrors
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
    return apiConflict("Nama kriteria sudah digunakan.", {
      name: ["Nama kriteria sudah digunakan."]
    });
  }

  const duplicateSortOrder = await prisma.criteria.findFirst({
    where: {
      sortOrder: parsed.data.sortOrder
    }
  });

  if (duplicateSortOrder) {
    return apiConflict("Urutan tampil sudah digunakan oleh kriteria lain.", {
      sortOrder: [
        `Urutan tampil ${parsed.data.sortOrder} sudah dipakai oleh "${duplicateSortOrder.name}".`
      ]
    });
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

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Criteria",
    entityId: criteria.id,
    afterData: toAuditJson(criteria)
  });

  return apiCreated(criteria, "Kriteria berhasil ditambahkan.");
}
