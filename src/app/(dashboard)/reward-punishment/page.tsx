import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RewardPunishmentManagement } from "@/components/reward-punishment/reward-punishment-management";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { toMonthInputValue } from "@/lib/reward-punishment";

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
      orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }]
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
      defaultPeriod={toMonthInputValue(new Date())}
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    />
  );
}
