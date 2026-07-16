import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { toAuditJson, writeAuditLog } from "@/lib/audit";
import {
  buildNotificationMetadata,
  createNotificationsByRoles
} from "@/lib/notifications";
import {
  apiMessage,
  apiNotFound,
  apiUnauthorized,
  apiValidationError
} from "@/lib/api-response";
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
    return apiNotFound("Data evaluasi, reward, atau punishment tidak ditemukan.");
  }

  return NextResponse.json({ data: recommendation });
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
  const parsed = rewardPunishmentActionSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(
      "Data keputusan tidak valid.",
      parsed.error.flatten().fieldErrors
    );
  }

  const existingRecommendation = await prisma.rewardPunishment.findUnique({
    where: { id },
    include: rewardPunishmentInclude
  });

  if (!existingRecommendation) {
    return apiNotFound("Data evaluasi, reward, atau punishment tidak ditemukan.");
  }

  if (existingRecommendation.status !== "RECOMMENDED") {
    return apiValidationError(
      "Keputusan hanya bisa dilakukan untuk data yang masih menunggu keputusan."
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

  await createNotificationsByRoles({
    roles: ["ADMIN", "SUPERVISOR"],
    type:
      nextStatus === "APPROVED"
        ? NotificationType.RECOMMENDATION_APPROVED
        : NotificationType.RECOMMENDATION_REJECTED,
    title:
      nextStatus === "APPROVED"
        ? "Rekomendasi telah disetujui"
        : "Rekomendasi telah ditolak",
    message:
      `${getTypeLabel(updatedRecommendation.type)} untuk ${updatedRecommendation.officer.name} ` +
      (nextStatus === "APPROVED" ? "telah disetujui." : "telah ditolak."),
    href: "/reward-punishment",
    entity: "RewardPunishment",
    entityId: updatedRecommendation.id,
    metadata: buildNotificationMetadata(
      {
        module: "reward-punishment",
        view: "detail",
        recommendationId: updatedRecommendation.id
      },
      {
        status: nextStatus,
        type: updatedRecommendation.type,
        officerId: updatedRecommendation.officerId
      }
    ),
    excludeUserIds: [session.user.id]
  });

  return NextResponse.json({
    message:
      nextStatus === "APPROVED"
        ? "Data berhasil disetujui."
        : "Data berhasil ditolak.",
    data: updatedRecommendation
  });
}

function getTypeLabel(type: "EVALUASI" | "REWARD" | "PUNISHMENT") {
  if (type === "EVALUASI") {
    return "Evaluasi";
  }

  if (type === "REWARD") {
    return "Reward";
  }

  return "Punishment";
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

  const existingRecommendation = await prisma.rewardPunishment.findUnique({
    where: { id },
    include: rewardPunishmentInclude
  });

  if (!existingRecommendation) {
    return apiNotFound("Data evaluasi, reward, atau punishment tidak ditemukan.");
  }

  await prisma.rewardPunishment.delete({
    where: { id }
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "RewardPunishment",
    entityId: existingRecommendation.id,
    beforeData: toAuditJson(existingRecommendation)
  });

  return apiMessage("Data berhasil dihapus.");
}
