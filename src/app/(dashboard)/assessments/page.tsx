import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { AssessmentManagement } from "@/components/assessments/assessment-management";
import { getAssessmentList } from "@/lib/assessments";

type AssessmentsPageProps = {
  searchParams?: Promise<{
    notification?: string;
    from?: string;
    to?: string;
    status?: string;
  }>;
};

export default async function AssessmentsPage({
  searchParams
}: AssessmentsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const [assessmentData, officers, criteria] = await Promise.all([
    getAssessmentList({
      page: 1,
      rowsPerPage: 10
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
      initialAssessmentData={assessmentData}
      officers={officers}
      criteria={criteria}
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
      initialInfoMessage={resolvedSearchParams?.notification}
      initialNavigationState={{
        from: resolvedSearchParams?.from ?? "",
        to: resolvedSearchParams?.to ?? "",
        statusFilter:
          resolvedSearchParams?.status === "PRESENT" ||
          resolvedSearchParams?.status === "ABSENT"
            ? resolvedSearchParams.status
            : "all"
      }}
    />
  );
}
