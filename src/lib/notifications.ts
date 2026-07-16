import {
  NotificationType,
  Prisma,
  Role,
  type Notification
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTodayDateInputValue, parseDateOnlyUtc } from "@/lib/date-only";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  entity?: string | null;
  entityId?: string | null;
  metadata?: unknown;
};

type CreateNotificationsByRoleInput = {
  roles: Role[];
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  entity?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  excludeUserIds?: string[];
};

type RewardPunishmentNotificationTarget = {
  module: "reward-punishment";
  view: "detail" | "list";
  recommendationId?: string;
  status?: "RECOMMENDED" | "APPROVED" | "REJECTED";
  type?: "EVALUASI" | "REWARD" | "PUNISHMENT";
  from?: string;
  to?: string;
};

type AssessmentNotificationTarget = {
  module: "assessments";
  view: "list";
  date?: string;
  from?: string;
  to?: string;
  status?: "all" | "PRESENT" | "ABSENT";
};

export type NotificationTarget =
  | RewardPunishmentNotificationTarget
  | AssessmentNotificationTarget;

type NotificationMetadataRecord = Record<string, unknown> & {
  target?: NotificationTarget;
};

type NotificationListSource = Pick<
  Notification,
  "id" | "type" | "title" | "message" | "href" | "isRead" | "createdAt"
>;

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationNavigationResult =
  | {
      status: "ok";
      href: string;
    }
  | {
      status: "forbidden" | "unavailable";
      message: string;
    };

function toNotificationJson(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildUrlWithQuery(
  pathname: string,
  params: Record<string, string | null | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildRewardPunishmentHref(
  params: {
    notification?: string;
    focus?: string;
    open?: string;
    status?: "RECOMMENDED" | "APPROVED" | "REJECTED";
    type?: "EVALUASI" | "REWARD" | "PUNISHMENT";
    from?: string;
    to?: string;
  } = {}
) {
  return buildUrlWithQuery("/reward-punishment", {
    notification: params.notification,
    focus: params.focus,
    open: params.open,
    status: params.status,
    type: params.type,
    from: params.from,
    to: params.to
  });
}

function getNotificationTarget(
  metadata: unknown
): NotificationTarget | null {
  if (!isRecord(metadata)) {
    return null;
  }

  const target = metadata.target;

  if (!isRecord(target) || typeof target.module !== "string") {
    return null;
  }

  if (target.module === "reward-punishment") {
    return {
      module: "reward-punishment",
      view: target.view === "detail" ? "detail" : "list",
      recommendationId:
        typeof target.recommendationId === "string"
          ? target.recommendationId
          : undefined,
      status:
        target.status === "RECOMMENDED" ||
        target.status === "APPROVED" ||
        target.status === "REJECTED"
          ? target.status
          : undefined,
      type:
        target.type === "EVALUASI" ||
        target.type === "REWARD" ||
        target.type === "PUNISHMENT"
          ? target.type
          : undefined,
      from: typeof target.from === "string" ? target.from : undefined,
      to: typeof target.to === "string" ? target.to : undefined
    };
  }

  if (target.module === "assessments") {
    return {
      module: "assessments",
      view: "list",
      date: typeof target.date === "string" ? target.date : undefined,
      from: typeof target.from === "string" ? target.from : undefined,
      to: typeof target.to === "string" ? target.to : undefined,
      status:
        target.status === "PRESENT" ||
        target.status === "ABSENT" ||
        target.status === "all"
          ? target.status
          : undefined
    };
  }

  return null;
}

function getAllowedRolesForNotification(type: NotificationType) {
  if (type === NotificationType.RECOMMENDATION_PENDING_APPROVAL) {
    return ["PIMPINAN"] satisfies Role[];
  }

  if (type === NotificationType.REMINDER_ASSESSMENT_DAILY) {
    return ["ADMIN", "SUPERVISOR"] satisfies Role[];
  }

  return ["ADMIN", "SUPERVISOR", "PIMPINAN"] satisfies Role[];
}

export function buildNotificationMetadata(
  target: NotificationTarget,
  extra?: Record<string, unknown>
) {
  return {
    ...(extra ?? {}),
    target
  } satisfies NotificationMetadataRecord;
}

export function getNotificationOpenHref(notificationId: string) {
  return `/notifications/open/${notificationId}`;
}

export function serializeNotificationListItem(
  item: NotificationListSource
): NotificationListItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    href: item.href ?? null,
    targetUrl: getNotificationOpenHref(item.id),
    isRead: item.isRead,
    createdAt: item.createdAt.toISOString()
  };
}

export function buildNotificationInfoHref(message: string) {
  return buildUrlWithQuery("/notifications", {
    info: message
  });
}

export async function resolveNotificationNavigation(
  notification: Pick<
    Notification,
    "type" | "title" | "message" | "href" | "entity" | "entityId" | "metadata"
  >,
  role: Role
): Promise<NotificationNavigationResult> {
  if (!getAllowedRolesForNotification(notification.type).includes(role)) {
    return {
      status: "forbidden",
      message:
        "Notifikasi ini tidak dapat dibuka karena akun Anda tidak memiliki hak akses ke tujuan terkait."
    };
  }

  const target = getNotificationTarget(notification.metadata);

  if (target?.module === "reward-punishment" && target.view === "detail") {
    const recommendationId = target.recommendationId ?? notification.entityId;

    if (!recommendationId) {
      return {
        status: "unavailable",
        message: "Referensi detail evaluasi, reward, atau punishment tidak tersedia."
      };
    }

    const recommendation = await prisma.rewardPunishment.findUnique({
      where: {
        id: recommendationId
      },
      select: {
        id: true
      }
    });

    if (!recommendation) {
      return {
        status: "unavailable",
        message:
          "Data evaluasi, reward, atau punishment yang dirujuk notifikasi ini sudah tidak tersedia."
      };
    }

    return {
      status: "ok",
      href: buildRewardPunishmentHref({
        notification: notification.title,
        focus: recommendation.id,
        open: "detail"
      })
    };
  }

  if (target?.module === "reward-punishment") {
    const where: Prisma.RewardPunishmentWhereInput = {
      ...(target.status ? { status: target.status } : {}),
      ...(target.type ? { type: target.type } : {}),
      ...((target.from || target.to)
        ? {
            periodStart: {
              ...(target.to
                ? { lte: new Date(`${target.to}T23:59:59.999Z`) }
                : {})
            },
            periodEnd: {
              ...(target.from
                ? { gte: new Date(`${target.from}T00:00:00.000Z`) }
                : {})
            }
          }
        : {})
    };
    const totalMatches = await prisma.rewardPunishment.count({ where });

    if (!totalMatches) {
      return {
        status: "unavailable",
        message:
          "Data evaluasi, reward, atau punishment untuk notifikasi ini sudah tidak tersedia."
      };
    }

    return {
      status: "ok",
      href: buildRewardPunishmentHref({
        notification: notification.title,
        status: target.status,
        type: target.type,
        from: target.from,
        to: target.to
      })
    };
  }

  if (target?.module === "assessments") {
    const targetDate = target.date ?? target.from ?? target.to;

    if (!targetDate) {
      return {
        status: "unavailable",
        message: "Referensi tanggal penilaian pada notifikasi ini tidak tersedia."
      };
    }

    const assessmentDate = parseDateOnlyUtc(targetDate);
    const [activeOfficerCount, todayAssessmentCount] = await Promise.all([
      prisma.officer.count({
        where: {
          isActive: true
        }
      }),
      prisma.dailyAssessment.count({
        where: {
          assessmentDate
        }
      })
    ]);
    const remainingCount = Math.max(0, activeOfficerCount - todayAssessmentCount);

    if (!remainingCount) {
      return {
        status: "unavailable",
        message: `Penilaian harian untuk ${targetDate} sudah lengkap, sehingga tidak ada tindak lanjut yang perlu dibuka.`
      };
    }

    return {
      status: "ok",
      href: buildUrlWithQuery("/assessments", {
        notification: notification.title,
        from: target.from ?? targetDate,
        to: target.to ?? targetDate,
        status: target.status ?? "all"
      })
    };
  }

  if (notification.entity === "RewardPunishment" && notification.entityId) {
    return {
      status: "ok",
      href: buildRewardPunishmentHref({
        notification: notification.title,
        focus: notification.entityId,
        open: "detail"
      })
    };
  }

  if (notification.href) {
    return {
      status: "ok",
      href: notification.href
    };
  }

  return {
    status: "unavailable",
    message: "Tujuan navigasi untuk notifikasi ini belum tersedia."
  };
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      metadata: toNotificationJson(input.metadata)
    }
  });
}

export async function createNotificationsByRoles(
  input: CreateNotificationsByRoleInput
) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: input.roles
      },
      ...(input.excludeUserIds?.length
        ? {
            id: {
              notIn: input.excludeUserIds
            }
          }
        : {})
    },
    select: {
      id: true
    }
  });

  if (!users.length) {
    return { count: 0 };
  }

  const result = await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      metadata: toNotificationJson(input.metadata)
    }))
  });

  return result;
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

export async function ensureDailyAssessmentReminderForUser(
  userId: string,
  role: Role
) {
  if (!["ADMIN", "SUPERVISOR"].includes(role)) {
    return null;
  }

  const today = getTodayDateInputValue();
  const assessmentDate = parseDateOnlyUtc(today);

  const [activeOfficerCount, todayAssessmentCount, existingReminder] =
    await Promise.all([
      prisma.officer.count({
        where: {
          isActive: true
        }
      }),
      prisma.dailyAssessment.count({
        where: {
          assessmentDate
        }
      }),
      prisma.notification.findFirst({
        where: {
          userId,
          type: NotificationType.REMINDER_ASSESSMENT_DAILY,
          entity: "DailyAssessmentReminder",
          entityId: today
        }
      })
    ]);

  const remainingCount = Math.max(0, activeOfficerCount - todayAssessmentCount);

  if (!remainingCount || existingReminder) {
    return existingReminder ?? null;
  }

  return createNotification({
    userId,
    type: NotificationType.REMINDER_ASSESSMENT_DAILY,
    title: "Penilaian harian belum lengkap",
    message: `${remainingCount} petugas aktif belum memiliki penilaian untuk hari ini.`,
    href: "/assessments",
    entity: "DailyAssessmentReminder",
    entityId: today,
    metadata: buildNotificationMetadata(
      {
        module: "assessments",
        view: "list",
        date: today,
        from: today,
        to: today,
        status: "all"
      },
      {
        date: today,
        activeOfficerCount,
        todayAssessmentCount,
        remainingCount
      }
    )
  });
}
