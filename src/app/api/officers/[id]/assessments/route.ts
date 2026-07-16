import { prisma } from "@/lib/prisma";
import { requireApiRoles } from "@/lib/auth-guard";
import {
  apiValidationError,
  apiNotFound,
  apiSuccess
} from "@/lib/api-response";
import { parseDateOnlyUtc } from "@/lib/date-only";
import { officerHistoryFilterSchema } from "@/lib/validations/officer-history";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { response } = await requireApiRoles(["ADMIN"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsedFilters = officerHistoryFilterSchema.safeParse({
    from: searchParams.get("from")?.trim() || "",
    to: searchParams.get("to")?.trim() || ""
  });

  if (!parsedFilters.success) {
    return apiValidationError(
      "Filter riwayat penilaian tidak valid.",
      parsedFilters.error.flatten().fieldErrors
    );
  }

  const { from, to } = parsedFilters.data;

  const officer = await prisma.officer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      nip: true,
      unit: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!officer) {
    return apiNotFound("Petugas tidak ditemukan.");
  }

  const dateFilter: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (from) {
    dateFilter.gte = parseDateOnlyUtc(from);
  }

  if (to) {
    dateFilter.lte = parseDateOnlyUtc(to);
  }

  const assessments = await prisma.dailyAssessment.findMany({
    where: {
      officerId: id,
      ...(from || to
        ? {
            assessmentDate: dateFilter
          }
        : {})
    },
    orderBy: {
      assessmentDate: "desc"
    },
    include: {
      assessor: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      scores: {
        orderBy: {
          criteria: {
            sortOrder: "asc"
          }
        },
        select: {
          id: true,
          score: true,
          criteria: {
            select: {
              id: true,
              name: true,
              sortOrder: true
            }
          }
        }
      }
    }
  });

  return apiSuccess({
    officer,
    filters: {
      from: from ?? "",
      to: to ?? ""
    },
    assessments
  });
}
