import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RewardPunishmentManagement } from "@/components/reward-punishment/reward-punishment-management";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getTodayDateInputValue } from "@/lib/date-only";
import { createPaginationMeta } from "@/lib/pagination";

export default async function RewardPunishmentPage() {
  const session = await requireAuth();

  const rowsPerPage = 10;
  const totalItems = await prisma.rewardPunishment.count();
  const meta = createPaginationMeta(totalItems, 1, rowsPerPage);
  const [recommendations, units, recommendedCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.rewardPunishment.findMany({
      skip: 0,
      take: rowsPerPage,
      include: {
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
      },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.unit.findMany({
      orderBy: {
        name: "asc"
      }
    }),
    prisma.rewardPunishment.count({ where: { status: "RECOMMENDED" } }),
    prisma.rewardPunishment.count({ where: { status: "APPROVED" } }),
    prisma.rewardPunishment.count({ where: { status: "REJECTED" } })
  ]);

  return (
    <RewardPunishmentManagement
      initialRecommendations={{
        data: recommendations,
        meta,
        summary: {
          total: totalItems,
          RECOMMENDED: recommendedCount,
          APPROVED: approvedCount,
          REJECTED: rejectedCount
        }
      }}
      units={units}
      defaultReferenceDate={getTodayDateInputValue()}
      role={session.user.role}
    />
  );
}
