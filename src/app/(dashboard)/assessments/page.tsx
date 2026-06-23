import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { AssessmentManagement } from "@/components/assessments/assessment-management";

export default async function AssessmentsPage() {
  const session = await requireAuth();

  const [assessments, officers, criteria] = await Promise.all([
    prisma.dailyAssessment.findMany({
      include: {
        officer: {
          include: {
            unit: true
          }
        },
        assessor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        scores: {
          include: {
            criteria: true
          },
          orderBy: {
            criteria: {
              sortOrder: "asc"
            }
          }
        }
      },
      orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.officer.findMany({
      where: { isActive: true },
      include: {
        unit: true
      },
      orderBy: [{ name: "asc" }]
    }),
    prisma.criteria.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sortOrder: true
      }
    })
  ]);

  return (
    <AssessmentManagement
      initialAssessments={assessments}
      officers={officers}
      criteria={criteria}
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    />
  );
}
