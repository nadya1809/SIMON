import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
import {
  assessmentSchema,
  validateAssessmentBusinessRules
} from "@/lib/validations/assessment";
import { calculateAverageScore } from "@/lib/scoring";

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

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

  const assessments = await prisma.dailyAssessment.findMany({
    where: {
      ...(officerId ? { officerId } : {}),
      ...(unitId ? { officer: { unitId } } : {}),
      ...(status === "PRESENT" || status === "ABSENT" ? { status } : {}),
      ...(from || to
        ? {
            assessmentDate: {
              ...(from ? { gte: toDateOnly(from) } : {}),
              ...(to ? { lte: toDateOnly(to) } : {})
            }
          }
        : {})
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
    },
    orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }]
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
    return apiNotFound("Petugas tidak ditemukan.");
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

  const assessmentDate = toDateOnly(parsed.data.assessmentDate);

  const duplicateAssessment = await prisma.dailyAssessment.findFirst({
    where: {
      officerId: parsed.data.officerId,
      assessmentDate
    }
  });

  if (duplicateAssessment) {
    return apiConflict("Penilaian untuk petugas dan tanggal tersebut sudah ada.");
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
    const prismaError = mapPrismaError(error, {
      P2002: "Penilaian untuk petugas dan tanggal tersebut sudah ada."
    });

    if (prismaError) {
      return prismaError;
    }

    throw error;
  }
}
