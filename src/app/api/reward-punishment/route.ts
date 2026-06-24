import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  getMonthlyRecommendationCandidates,
  isMonthInput,
  toMonthPeriod
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
  const period = searchParams.get("period")?.trim();
  const periodFilter =
    period && isMonthInput(period) ? toMonthPeriod(period) : null;

  const recommendations = await prisma.rewardPunishment.findMany({
    where: {
      ...(search
        ? {
            officer: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { nip: { contains: search, mode: "insensitive" } }
              ]
            }
          }
        : {}),
      ...(unitId ? { officer: { unitId } } : {}),
      ...(status === "RECOMMENDED" ||
      status === "APPROVED" ||
      status === "REJECTED"
        ? { status }
        : {}),
      ...(type === "REWARD" || type === "PUNISHMENT" ? { type } : {}),
      ...(periodFilter
        ? {
            periodStart: periodFilter.periodStart,
            periodEnd: periodFilter.periodEnd
          }
        : {})
    },
    include: rewardPunishmentInclude,
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }]
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
        message: "Data generate rekomendasi tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { period, rewardCategory, punishmentCategory, notes } = parsed.data;
  const { periodStart, periodEnd, candidates } =
    await getMonthlyRecommendationCandidates(period);

  if (!candidates.length) {
    return NextResponse.json({
      message:
        "Tidak ada petugas yang memenuhi threshold reward atau punishment pada periode ini.",
      data: [],
      meta: {
        period,
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
        "Semua rekomendasi untuk periode ini sudah pernah dibuat sebelumnya.",
      data: [],
      meta: {
        period,
        totalCandidates: candidates.length,
        createdCount: 0,
        skippedCount: candidates.length
      }
    });
  }

  const createdRecommendations = await prisma.$transaction(async (tx) => {
    const records = [];

    for (const candidate of candidatesToCreate) {
      const category =
        candidate.type === "REWARD" ? rewardCategory : punishmentCategory;

      const recommendation = await tx.rewardPunishment.create({
        data: {
          officerId: candidate.officerId,
          type: candidate.type,
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
      message: `${createdRecommendations.length} rekomendasi berhasil dibuat untuk periode ${period}.`,
      data: createdRecommendations,
      meta: {
        period,
        totalCandidates: candidates.length,
        createdCount: createdRecommendations.length,
        skippedCount: candidates.length - createdRecommendations.length
      }
    },
    { status: 201 }
  );
}
