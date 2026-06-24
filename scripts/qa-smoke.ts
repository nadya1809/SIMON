import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { calculateAverageScore } from "@/lib/scoring";
import { getDashboardSummary } from "@/lib/dashboard";
import { getMonthlyRecommendationCandidates } from "@/lib/reward-punishment";
import { getReportData } from "@/lib/reports";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthInput(date: Date) {
  return formatDateInput(new Date(date.getFullYear(), date.getMonth(), 1)).slice(
    0,
    7
  );
}

function assertCondition(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const actor = await prisma.user.findFirst({
    where: {
      isActive: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!actor) {
    throw new Error("Tidak ada user aktif untuk menjalankan QA smoke.");
  }

  const criteria = await prisma.criteria.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  });

  assertCondition(
    criteria.length >= 2,
    "Kriteria aktif minimal harus dua untuk QA smoke."
  );

  const now = new Date();
  const uniqueKey = `qa-smoke-${Date.now()}`;
  const presentDate = new Date(now.getFullYear(), now.getMonth(), 10);
  const absentDate = new Date(now.getFullYear(), now.getMonth(), 11);
  const dateFrom = formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  const dateTo = formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const monthPeriod = formatMonthInput(now);
  const createdAuditIds: string[] = [];
  let createdAssessmentIds: string[] = [];
  let createdOfficerId: string | null = null;
  let createdUnitId: string | null = null;

  try {
    const unit = await prisma.unit.create({
      data: {
        name: `Unit ${uniqueKey}`,
        description: "Data temporary QA smoke"
      }
    });

    createdUnitId = unit.id;

    const officer = await prisma.officer.create({
      data: {
        nip: `QA-${Date.now()}`,
        name: `Petugas ${uniqueKey}`,
        position: "QA Smoke",
        unitId: unit.id,
        isActive: true
      }
    });

    createdOfficerId = officer.id;

    const presentScores = criteria.slice(0, 2).map((item, index) => ({
      criteriaId: item.id,
      score: index === 0 ? 9 : 10
    }));

    const presentAssessment = await prisma.dailyAssessment.create({
      data: {
        officerId: officer.id,
        assessorId: actor.id,
        assessmentDate: presentDate,
        status: "PRESENT",
        averageScore: calculateAverageScore(presentScores.map((item) => item.score)),
        notes: "QA smoke present assessment",
        scores: {
          create: presentScores
        }
      }
    });

    const absentAssessment = await prisma.dailyAssessment.create({
      data: {
        officerId: officer.id,
        assessorId: actor.id,
        assessmentDate: absentDate,
        status: "ABSENT",
        averageScore: null,
        notes: "QA smoke absent assessment"
      }
    });

    createdAssessmentIds = [presentAssessment.id, absentAssessment.id];

    const createAudit = await writeAuditLog({
      userId: actor.id,
      action: "CREATE",
      entity: "DailyAssessment",
      entityId: presentAssessment.id,
      afterData: {
        officerId: officer.id,
        status: "PRESENT",
        averageScore: presentAssessment.averageScore
      }
    });

    const updateAudit = await writeAuditLog({
      userId: actor.id,
      action: "UPDATE",
      entity: "Officer",
      entityId: officer.id,
      beforeData: {
        isActive: true
      },
      afterData: {
        isActive: true,
        unitId: unit.id
      }
    });

    createdAuditIds.push(createAudit.id, updateAudit.id);

    const dashboard = await getDashboardSummary({
      from: dateFrom,
      to: dateTo,
      unitId: unit.id
    });

    assertCondition(
      dashboard.summaryCards.totalAssessments === 2,
      "Dashboard harus menghitung 2 assessment."
    );
    assertCondition(
      dashboard.summaryCards.totalPresent === 1,
      "Dashboard harus menghitung 1 assessment hadir."
    );
    assertCondition(
      dashboard.summaryCards.totalAbsent === 1,
      "Dashboard harus menghitung 1 assessment tidak hadir."
    );
    assertCondition(
      dashboard.ranking.some((item) => item.officerId === officer.id),
      "Ranking dashboard harus memuat officer temporary."
    );

    const rewardCandidates = await getMonthlyRecommendationCandidates(monthPeriod);
    const officerCandidate = rewardCandidates.candidates.find(
      (item) => item.officerId === officer.id
    );

    assertCondition(
      officerCandidate?.type === "REWARD",
      "Officer temporary harus masuk kandidat reward."
    );
    assertCondition(
      officerCandidate?.triggerScore === 9.5,
      "Trigger score kandidat reward harus 9.5."
    );

    const report = await getReportData({
      from: dateFrom,
      to: dateTo,
      unitId: unit.id
    });

    assertCondition(report.rows.length === 2, "Report harus memuat 2 baris data.");
    assertCondition(
      report.ranking.some((item) => item.officerId === officer.id),
      "Report ranking harus memuat officer temporary."
    );

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        id: {
          in: createdAuditIds
        }
      }
    });

    assertCondition(
      auditLogs.length === 2,
      "Audit log temporary harus berhasil tersimpan."
    );

    console.log(
      JSON.stringify(
        {
          success: true,
          summary: {
            totalAssessments: dashboard.summaryCards.totalAssessments,
            totalPresent: dashboard.summaryCards.totalPresent,
            totalAbsent: dashboard.summaryCards.totalAbsent,
            rewardCandidateType: officerCandidate?.type ?? null,
            rewardTriggerScore: officerCandidate?.triggerScore ?? null,
            reportRows: report.rows.length,
            auditLogs: auditLogs.length
          }
        },
        null,
        2
      )
    );
  } finally {
    if (createdAuditIds.length) {
      await prisma.auditLog.deleteMany({
        where: {
          id: {
            in: createdAuditIds
          }
        }
      });
    }

    if (createdAssessmentIds.length) {
      await prisma.dailyAssessment.deleteMany({
        where: {
          id: {
            in: createdAssessmentIds
          }
        }
      });
    }

    if (createdOfficerId) {
      await prisma.officer.delete({
        where: {
          id: createdOfficerId
        }
      });
    }

    if (createdUnitId) {
      await prisma.unit.delete({
        where: {
          id: createdUnitId
        }
      });
    }

    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
