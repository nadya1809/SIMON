import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { calculateAverageScore } from "@/lib/scoring";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRecommendationCandidates } from "@/lib/reward-punishment";
import { getReportData } from "@/lib/reports";
import {
  buildExcelReportBuffer,
  buildPdfReportBuffer
} from "@/lib/report-export";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const presentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
  const absentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
  const rangeStartDate =
    presentDate <= absentDate ? presentDate : absentDate;
  const rangeEndDate =
    presentDate >= absentDate ? presentDate : absentDate;
  const dateFrom = formatDateInput(
    new Date(rangeStartDate.getFullYear(), rangeStartDate.getMonth(), 1)
  );
  const dateTo = formatDateInput(
    new Date(rangeEndDate.getFullYear(), rangeEndDate.getMonth() + 1, 0)
  );
  const createdAuditIds: string[] = [];
  let createdAssessmentIds: string[] = [];
  let createdOfficerId: string | null = null;
  let createdUnitId: string | null = null;
  let createdUserId: string | null = null;
  let createdCriteriaId: string | null = null;

  try {
    const tempPassword = "QaSmokePass123!";
    const tempUser = await prisma.user.create({
      data: {
        name: `User ${uniqueKey}`,
        email: `${uniqueKey}@simon.local`,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        role: Role.SUPERVISOR,
        isActive: true
      }
    });

    createdUserId = tempUser.id;

    async function simulateCredentialLogin(email: string, password: string) {
      const user = await prisma.user.findUnique({
        where: {
          email
        }
      });

      if (!user || !user.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return null;
      }

      return user;
    }

    const loginSuccess = await simulateCredentialLogin(
      tempUser.email,
      tempPassword
    );
    assertCondition(loginSuccess, "Login user aktif harus berhasil.");

    const loginWrongPassword = await simulateCredentialLogin(
      tempUser.email,
      "PasswordSalah!"
    );
    assertCondition(
      loginWrongPassword === null,
      "Login dengan password salah harus ditolak."
    );

    await prisma.user.update({
      where: {
        id: tempUser.id
      },
      data: {
        isActive: false
      }
    });

    const loginInactiveUser = await simulateCredentialLogin(
      tempUser.email,
      tempPassword
    );
    assertCondition(
      loginInactiveUser === null,
      "Login user nonaktif harus ditolak."
    );

    const activeUser = await prisma.user.update({
      where: {
        id: tempUser.id
      },
      data: {
        isActive: true,
        name: `User Update ${uniqueKey}`
      }
    });

    assertCondition(
      activeUser.name.includes("Update"),
      "Update user temporary harus berhasil."
    );

    const tempCriteria = await prisma.criteria.create({
      data: {
        name: `Kriteria ${uniqueKey}`,
        description: "Data temporary QA smoke",
        sortOrder: 99,
        isActive: true
      }
    });

    createdCriteriaId = tempCriteria.id;

    const updatedCriteria = await prisma.criteria.update({
      where: {
        id: tempCriteria.id
      },
      data: {
        isActive: false,
        description: "Updated criteria QA smoke"
      }
    });

    assertCondition(
      updatedCriteria.isActive === false,
      "Update kriteria temporary harus berhasil."
    );

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
        jabatan: "Statistisi ahli pertama",
        unitId: unit.id,
        isActive: true
      }
    });

    createdOfficerId = officer.id;

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id
      },
      data: {
        jabatan: "Statistisi ahli muda",
        isActive: false
      }
    });

    assertCondition(
      updatedOfficer.isActive === false,
      "Update officer temporary harus berhasil."
    );

    await prisma.officer.update({
      where: {
        id: officer.id
      },
      data: {
        isActive: true
      }
    });

    const presentScores = criteria.slice(0, 2).map((item, index) => ({
      criteriaId: item.id,
      score: index === 0 ? 95 : 96
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

    try {
      await prisma.dailyAssessment.create({
        data: {
          officerId: officer.id,
          assessorId: actor.id,
          assessmentDate: presentDate,
          status: "PRESENT",
          averageScore: 10
        }
      });
      throw new Error("Duplicate assessment seharusnya gagal.");
    } catch (error) {
      assertCondition(
        error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002",
        "Duplicate assessment harus memicu unique constraint P2002."
      );
    }

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
      timePreset: "30d",
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

    const emptyDashboard = await getDashboardSummary({
      timePreset: "today",
      unitId: unit.id
    });

    assertCondition(
      emptyDashboard.summaryCards.totalAssessments === 0,
      "Dashboard tanpa data harus mengembalikan total 0."
    );

    const rewardCandidates = await getRecommendationCandidates({
      periodKind: "MONTHLY",
      referenceDate: dateTo,
      generationMode: "REWARD_PUNISHMENT"
    });
    const officerCandidate = rewardCandidates.candidates.find(
      (item) => item.officerId === officer.id
    );

    assertCondition(
      officerCandidate?.type === "REWARD",
      "Officer temporary harus masuk kandidat reward."
    );
    assertCondition(
      officerCandidate?.triggerScore === 95.5,
      "Trigger score kandidat reward harus 95.5."
    );

    const report = await getReportData({
      timePreset: "30d",
      unitId: unit.id
    });

    assertCondition(report.rows.length === 2, "Report harus memuat 2 baris data.");
    assertCondition(
      report.ranking.some((item) => item.officerId === officer.id),
      "Report ranking harus memuat officer temporary."
    );

    const excelBuffer = await buildExcelReportBuffer({
      from: dateFrom,
      to: dateTo,
      unitId: unit.id
    });
    const pdfBuffer = await buildPdfReportBuffer({
      from: dateFrom,
      to: dateTo,
      unitId: unit.id
    });

    assertCondition(excelBuffer.byteLength > 0, "Export Excel harus menghasilkan buffer.");
    assertCondition(pdfBuffer.byteLength > 0, "Export PDF harus menghasilkan buffer.");

    await prisma.officer.update({
      where: {
        id: officer.id
      },
      data: {
        isActive: false
      }
    });

    const reportWithInactiveOfficer = await getReportData({
      timePreset: "30d",
      unitId: unit.id
    });

    assertCondition(
      reportWithInactiveOfficer.rows.some((row) => row.officerId === officer.id),
      "Histori officer nonaktif harus tetap bisa dibaca."
    );

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        id: {
          in: createdAuditIds
        }
      }
    });

    assertCondition(auditLogs.length === 2, "Audit log temporary harus berhasil tersimpan.");

    console.log(
      JSON.stringify(
        {
          success: true,
          summary: {
            loginSuccess: true,
            loginWrongPasswordRejected: true,
            loginInactiveRejected: true,
            totalAssessments: dashboard.summaryCards.totalAssessments,
            totalPresent: dashboard.summaryCards.totalPresent,
            totalAbsent: dashboard.summaryCards.totalAbsent,
            dashboardEmptyStateTotal: emptyDashboard.summaryCards.totalAssessments,
            rewardCandidateType: officerCandidate?.type ?? null,
            rewardTriggerScore: officerCandidate?.triggerScore ?? null,
            reportRows: report.rows.length,
            excelBytes: excelBuffer.byteLength,
            pdfBytes: pdfBuffer.byteLength,
            auditLogs: auditLogs.length
          }
        },
        null,
        2
      )
    );
  } finally {
    if (createdOfficerId) {
      const deleteAudit = await writeAuditLog({
        userId: actor.id,
        action: "DELETE",
        entity: "Officer",
        entityId: createdOfficerId,
        beforeData: {
          id: createdOfficerId
        }
      });

      createdAuditIds.push(deleteAudit.id);
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
      const deleteAudit = await writeAuditLog({
        userId: actor.id,
        action: "DELETE",
        entity: "Unit",
        entityId: createdUnitId,
        beforeData: {
          id: createdUnitId
        }
      });

      createdAuditIds.push(deleteAudit.id);

      await prisma.unit.delete({
        where: {
          id: createdUnitId
        }
      });
    }

    if (createdCriteriaId) {
      await prisma.criteria.delete({
        where: {
          id: createdCriteriaId
        }
      });
    }

    if (createdUserId) {
      await prisma.user.delete({
        where: {
          id: createdUserId
        }
      });
    }

    if (createdAuditIds.length) {
      await prisma.auditLog.deleteMany({
        where: {
          id: {
            in: createdAuditIds
          }
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
