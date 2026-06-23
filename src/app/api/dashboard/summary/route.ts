import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-guard";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET(request: Request) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);

  const data = await getDashboardSummary({
    from: searchParams.get("from")?.trim() || "",
    to: searchParams.get("to")?.trim() || "",
    unitId: searchParams.get("unitId")?.trim() || ""
  });

  return NextResponse.json({ data });
}
