import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import { rewardPunishmentActionSchema } from "@/lib/validations/reward-punishment";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { id } = await context.params;

  const recommendation = await prisma.rewardPunishment.findUnique({
    where: { id },
    include: rewardPunishmentInclude
  });

  if (!recommendation) {
    return NextResponse.json(
      { message: "Rekomendasi reward atau punishment tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: recommendation });
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
  const parsed = rewardPunishmentActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Data keputusan tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingRecommendation = await prisma.rewardPunishment.findUnique({
    where: { id },
    include: rewardPunishmentInclude
  });

  if (!existingRecommendation) {
    return NextResponse.json(
      { message: "Rekomendasi reward atau punishment tidak ditemukan." },
      { status: 404 }
    );
  }

  if (existingRecommendation.status !== "RECOMMENDED") {
    return NextResponse.json(
      { message: "Keputusan hanya bisa dilakukan untuk status RECOMMENDED." },
      { status: 400 }
    );
  }

  const nextCategory =
    parsed.data.category?.trim() || existingRecommendation.category;

  const nextStatus =
    parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updatedRecommendation = await prisma.rewardPunishment.update({
    where: { id },
    data: {
      category: nextCategory,
      notes: parsed.data.notes?.trim() || null,
      status: nextStatus,
      decidedById: session.user.id,
      decidedAt: new Date()
    },
    include: rewardPunishmentInclude
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "RewardPunishment",
    entityId: updatedRecommendation.id,
    beforeData: toAuditJson(existingRecommendation),
    afterData: toAuditJson(updatedRecommendation)
  });

  return NextResponse.json({
    message:
      nextStatus === "APPROVED"
        ? "Rekomendasi berhasil di-approve."
        : "Rekomendasi berhasil di-reject.",
    data: updatedRecommendation
  });
}
