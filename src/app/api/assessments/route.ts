import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  apiConflict,
  apiCreated,
  apiNotFound,
  apiUnauthorized,
  apiValidationError,
  apiSuccess,
  mapPrismaError
} from "@/lib/api-response";
import { logServerError } from "@/lib/logger";
import { parseDateOnlyUtc } from "@/lib/date-only";
import { getAssessmentList } from "@/lib/assessments";
import {
  assessmentSchema,
  validateAssessmentBusinessRules
} from "@/lib/validations/assessment";
import { calculateAverageScore } from "@/lib/scoring";

export async function GET(request: Request) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const officerId = searchParams.get("officerId")?.trim();
  const unitId = searchParams.get("unitId")?.trim();
  const status = searchParams.get("status")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const search = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page"));
  const rowsPerPage = Number(searchParams.get("rowsPerPage"));

  const assessments = await getAssessmentList({
    officerId: officerId || undefined,
    unitId: unitId || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    search: search || undefined,
    page,
    rowsPerPage
  });

  return apiSuccess(assessments);
}

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const body = await request.json();
  const parsed = assessmentSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data penilaian tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const officer = await prisma.officer.findUnique({
    where: { id: parsed.data.officerId }
  });

  if (!officer) {
    return apiValidationError("Petugas tidak ditemukan.", {
      officerId: ["Petugas yang dipilih tidak ditemukan."]
    });
  }

  const activeCriteria = await prisma.criteria.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });

  const scores =
    parsed.data.status === "ABSENT"
      ? []
      : parsed.data.scores.map((score) => ({
          criteriaId: score.criteriaId,
          score: score.score
        }));

  const businessRuleError = validateAssessmentBusinessRules({
    activeCriteriaIds: activeCriteria.map((item) => item.id),
    status: parsed.data.status,
    scores
  });

  if (businessRuleError) {
    return apiValidationError(businessRuleError);
  }

  const assessmentDate = parseDateOnlyUtc(parsed.data.assessmentDate);

  const duplicateAssessment = await prisma.dailyAssessment.findFirst({
    where: {
      officerId: parsed.data.officerId,
      assessmentDate
    }
  });

  if (duplicateAssessment) {
    return apiConflict("Penilaian untuk petugas dan tanggal tersebut sudah ada.", {
      assessmentDate: [
        "Tanggal penilaian ini sudah terpakai untuk petugas yang dipilih."
      ]
    });
  }

  try {
    const assessment = await prisma.dailyAssessment.create({
      data: {
        officerId: parsed.data.officerId,
        assessorId: session.user.id,
        assessmentDate,
        status: parsed.data.status,
        averageScore:
          parsed.data.status === "ABSENT"
            ? null
            : calculateAverageScore(scores.map((item) => item.score)),
        notes: parsed.data.notes?.trim() || null,
        scores:
          parsed.data.status === "ABSENT"
            ? undefined
            : {
                create: scores.map((item) => ({
                  criteriaId: item.criteriaId,
                  score: item.score
                }))
              }
      },
      include: {
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
      }
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "DailyAssessment",
      entityId: assessment.id,
      afterData: toAuditJson(assessment)
    });

    return apiCreated(assessment, "Penilaian berhasil disimpan.");
  } catch (error) {
    logServerError("api.assessments.create", error, {
      officerId: parsed.data.officerId,
      assessmentDate: parsed.data.assessmentDate
    });

    const prismaError = mapPrismaError(error, {
      P2002: "Penilaian untuk petugas dan tanggal tersebut sudah ada."
    });

    if (prismaError) {
      return prismaError;
    }

    throw error;
  }
}
