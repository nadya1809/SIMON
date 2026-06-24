import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
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
    return NextResponse.json(
      { message: "Data penilaian tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: assessment });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, response } = await requireApiAuth();

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
  const parsed = assessmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data penilaian tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
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
    return NextResponse.json(
      { message: "Data penilaian tidak ditemukan." },
      { status: 404 }
    );
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
    return NextResponse.json({ message: businessRuleError }, { status: 400 });
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
    return NextResponse.json(
      { message: "Penilaian untuk petugas dan tanggal tersebut sudah ada." },
      { status: 409 }
    );
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

  return NextResponse.json({
    message: "Penilaian berhasil diperbarui.",
    data: assessment
  });
}
