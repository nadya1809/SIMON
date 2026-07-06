import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  getRecommendationCandidates
} from "@/lib/reward-punishment";
import { rewardPunishmentGenerationSchema } from "@/lib/validations/reward-punishment";

const rewardPunishmentInclude = {
  officer: {
    include: {
      unit: true
    }
  },
  decidedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
} as const;

export async function GET(request: Request) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const unitId = searchParams.get("unitId")?.trim();
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();
  const officerWhere =
    search || unitId
      ? {
          ...(unitId ? { unitId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { nip: { contains: search, mode: "insensitive" as const } }
                ]
              }
            : {})
        }
      : undefined;

  const recommendations = await prisma.rewardPunishment.findMany({
    where: {
      ...(officerWhere ? { officer: officerWhere } : {}),
      ...(status === "RECOMMENDED" ||
      status === "APPROVED" ||
      status === "REJECTED"
        ? { status }
        : {}),
      ...(type === "REWARD" || type === "PUNISHMENT" || type === "EVALUASI"
        ? { type }
        : {})
    },
    include: rewardPunishmentInclude,
    orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ data: recommendations });
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const parsed = rewardPunishmentGenerationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data generate tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const {
    periodKind,
    referenceDate,
    generationMode,
    evaluationCategory,
    rewardCategory,
    punishmentCategory,
    notes
  } = parsed.data;
  const { periodStart, periodEnd, referenceDate: resolvedReferenceDate, candidates } =
    await getRecommendationCandidates({
      periodKind,
      referenceDate,
      generationMode
    });

  if (!candidates.length) {
    return NextResponse.json({
      message:
        generationMode === "EVALUASI"
          ? "Tidak ada petugas yang memiliki data hadir pada periode ini."
          : "Tidak ada petugas yang memenuhi threshold reward atau punishment pada periode ini.",
      data: [],
      meta: {
        periodKind,
        referenceDate,
        generationMode,
        totalCandidates: 0,
        createdCount: 0,
        skippedCount: 0
      }
    });
  }

  const existingRecommendations = await prisma.rewardPunishment.findMany({
    where: {
      officerId: {
        in: candidates.map((item) => item.officerId)
      },
      type: {
        in: [...new Set(candidates.map((item) => item.type))]
      },
      periodKind,
      referenceDate: resolvedReferenceDate,
      periodStart,
      periodEnd
    },
    select: {
      officerId: true
    }
  });

  const existingOfficerIds = new Set(
    existingRecommendations.map((item) => item.officerId)
  );

  const candidatesToCreate = candidates.filter(
    (item) => !existingOfficerIds.has(item.officerId)
  );

  if (!candidatesToCreate.length) {
    return NextResponse.json({
      message:
        "Semua data untuk periode ini sudah pernah dibuat sebelumnya.",
      data: [],
      meta: {
        periodKind,
        referenceDate,
        generationMode,
        totalCandidates: candidates.length,
        createdCount: 0,
        skippedCount: candidates.length
      }
    });
  }

  const createdRecommendations = await prisma.$transaction(async (tx) => {
    const records = [];
    const normalizedEvaluationCategory = evaluationCategory?.trim() ?? "";
    const normalizedRewardCategory = rewardCategory.trim();
    const normalizedPunishmentCategory = punishmentCategory.trim();

    for (const candidate of candidatesToCreate) {
      const category =
        candidate.type === "EVALUASI"
          ? normalizedEvaluationCategory
          : candidate.type === "REWARD"
            ? normalizedRewardCategory
            : normalizedPunishmentCategory;

      const recommendation = await tx.rewardPunishment.create({
        data: {
          officerId: candidate.officerId,
          type: candidate.type,
          periodKind,
          referenceDate: resolvedReferenceDate,
          category,
          periodStart,
          periodEnd,
          triggerScore: candidate.triggerScore,
          notes: notes?.trim() || null
        },
        include: rewardPunishmentInclude
      });

      records.push(recommendation);
    }

    return records;
  });

  await Promise.all(
    createdRecommendations.map((item) =>
      writeAuditLog({
        userId: session.user.id,
        action: "CREATE",
        entity: "RewardPunishment",
        entityId: item.id,
        afterData: toAuditJson(item)
      })
    )
  );

  return NextResponse.json(
    {
      message: `${createdRecommendations.length} data berhasil dibuat untuk periode terpilih.`,
      data: createdRecommendations,
      meta: {
        periodKind,
        referenceDate,
        generationMode,
        totalCandidates: candidates.length,
        createdCount: createdRecommendations.length,
        skippedCount: candidates.length - createdRecommendations.length
      }
    },
    { status: 201 }
  );
}
