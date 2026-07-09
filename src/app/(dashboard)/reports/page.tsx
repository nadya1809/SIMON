import { ReportsOverview } from "@/components/reports/reports-overview";
import { requireAuth } from "@/lib/auth-guard";
import { getReportData } from "@/lib/reports";

type ReportsPageProps = {
  searchParams?: Promise<{
    timePreset?: string;
    unitId?: string;
    rankingPage?: string;
    rankingRowsPerPage?: string;
    previewPage?: string;
    previewRowsPerPage?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const report = await getReportData({
    timePreset: resolvedSearchParams?.timePreset,
    unitId: resolvedSearchParams?.unitId,
    rankingPage: resolvedSearchParams?.rankingPage,
    rankingRowsPerPage: resolvedSearchParams?.rankingRowsPerPage,
    previewPage: resolvedSearchParams?.previewPage,
    previewRowsPerPage: resolvedSearchParams?.previewRowsPerPage
  });

  return <ReportsOverview report={report} role={session.user.role} />;
}
