import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RewardPunishmentManagement } from "@/components/reward-punishment/reward-punishment-management";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getTodayDateInputValue } from "@/lib/date-only";

export default async function RewardPunishmentPage() {
  const session = await requireAuth();

  const [recommendations, units] = await Promise.all([
    prisma.rewardPunishment.findMany({
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
    })
  ]);

  return (
    <RewardPunishmentManagement
      initialRecommendations={recommendations}
      units={units}
      defaultReferenceDate={getTodayDateInputValue()}
      role={session.user.role}
    />
  );
}
