import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDateOnlyUtc } from "@/lib/date-only";

export type AssessmentListParams = {
  officerId?: string;
  unitId?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  rowsPerPage?: number;
};

export type AssessmentListMeta = {
  page: number;
  rowsPerPage: number;
  totalItems: number;
  totalPages: number;
};

const assessmentListInclude =
  Prisma.validator<Prisma.DailyAssessmentInclude>()({
    officer: {
      include: {
        unit: true
      }
    },
    assessor: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    },
    scores: {
      include: {
        criteria: true
      },
      orderBy: {
        criteria: {
          sortOrder: "asc"
        }
      }
    }
  });

export type AssessmentListItem = Prisma.DailyAssessmentGetPayload<{
  include: typeof assessmentListInclude;
}>;

export type AssessmentListResult = {
  items: AssessmentListItem[];
  meta: AssessmentListMeta;
};

function normalizePositiveInt(value: number | undefined, fallback: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

export async function getAssessmentList(params: AssessmentListParams) {
  const requestedPage = normalizePositiveInt(params.page, 1);
  const requestedRowsPerPage = Math.min(
    normalizePositiveInt(params.rowsPerPage, 10),
    100
  );
  const normalizedSearch = params.search?.trim() || "";

  const where: Prisma.DailyAssessmentWhereInput = {
    ...(params.officerId ? { officerId: params.officerId } : {}),
    ...(params.unitId ? { officer: { is: { unitId: params.unitId } } } : {}),
    ...(params.status === "PRESENT" || params.status === "ABSENT"
      ? { status: params.status }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              officer: {
                is: {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive"
                  }
                }
              }
            },
            {
              officer: {
                is: {
                  nip: {
                    contains: normalizedSearch,
                    mode: "insensitive"
                  }
                }
              }
            }
          ]
        }
      : {}),
    ...(params.from || params.to
      ? {
          assessmentDate: {
            ...(params.from ? { gte: parseDateOnlyUtc(params.from) } : {}),
            ...(params.to ? { lte: parseDateOnlyUtc(params.to) } : {})
          }
        }
      : {})
  };

  const totalItems = await prisma.dailyAssessment.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / requestedRowsPerPage));
  const page = Math.min(requestedPage, totalPages);

  const items = await prisma.dailyAssessment.findMany({
    where,
    include: assessmentListInclude,
    orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * requestedRowsPerPage,
    take: requestedRowsPerPage
  });

  return {
    items,
    meta: {
      page,
      rowsPerPage: requestedRowsPerPage,
      totalItems,
      totalPages
    } satisfies AssessmentListMeta
  } satisfies AssessmentListResult;
}
