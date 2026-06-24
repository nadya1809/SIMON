import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  apiMessage,
  apiConflict,
  apiNotFound,
  apiUnauthorized,
  apiValidationError,
  apiSuccess
} from "@/lib/api-response";
import {
  assessmentSchema,
  validateAssessmentBusinessRules
} from "@/lib/validations/assessment";
import { calculateAverageScore } from "@/lib/scoring";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { id } = await context.params;

  const assessment = await prisma.dailyAssessment.findUnique({
    where: { id },
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

  if (!assessment) {
    return apiNotFound("Data penilaian tidak ditemukan.");
  }

  return apiSuccess(assessment);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = assessmentSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data penilaian tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingAssessment = await prisma.dailyAssessment.findUnique({
    where: { id },
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

  if (!existingAssessment) {
    return apiNotFound("Data penilaian tidak ditemukan.");
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
      id: { not: id },
      officerId: parsed.data.officerId,
      assessmentDate
    }
  });

  if (duplicateAssessment) {
    return apiConflict("Penilaian untuk petugas dan tanggal tersebut sudah ada.");
  }

  const assessment = await prisma.$transaction(async (tx) => {
    await tx.assessmentScore.deleteMany({
      where: {
        dailyAssessmentId: id
      }
    });

    return tx.dailyAssessment.update({
      where: { id },
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
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "DailyAssessment",
    entityId: assessment.id,
    beforeData: toAuditJson(existingAssessment),
    afterData: toAuditJson(assessment)
  });

  return apiSuccess(assessment, {
    message: "Penilaian berhasil diperbarui."
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const { id } = await context.params;

  const existingAssessment = await prisma.dailyAssessment.findUnique({
    where: { id },
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

  if (!existingAssessment) {
    return apiNotFound("Data penilaian tidak ditemukan.");
  }

  await prisma.dailyAssessment.delete({
    where: { id }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "DailyAssessment",
    entityId: existingAssessment.id,
    beforeData: toAuditJson(existingAssessment)
  });

  return apiMessage("Penilaian berhasil dihapus.");
}
