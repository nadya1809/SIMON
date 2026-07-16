"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { SectionCard } from "@/components/ui/section-card";

const gridStroke = "var(--chart-grid)";
const axisStroke = "#cbd5e1";
const legendTextColor = "#e2e8f0";
const tooltipStyle = {
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
  borderRadius: "16px",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-md)"
};
const legendStyle = {
  color: legendTextColor
};
const scoreDomain: [number, number] = [0, 100];
const lineGlowStyle = {
  filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.28))"
};
const dailyLineColor = "#38BDF8";
const weeklyLineColor = "#38BDF8";
const monthlyLineColor = "#34D399";
const trendAccentColor = "#A78BFA";
const criteriaColorMap: Record<string, string> = {
  Disiplin: "#38BDF8",
  Inovatif: "#2DD4BF",
  Kerjasama: "#34D399",
  Kinerja: "#A78BFA",
  Komplain: "#F87171",
  Penampilan: "#FACC15",
  "Penilaian Pengguna Layanan": "#FB923C"
};
const criteriaFallbackPalette = [
  "#38BDF8",
  "#2DD4BF",
  "#34D399",
  "#A78BFA",
  "#F87171",
  "#FACC15",
  "#FB923C"
];
const unitColorMap: Record<string, string> = {
  "Frontline 1": "#38BDF8",
  "Frontline 2": "#34D399",
  "Petugas Online": "#A78BFA"
};

function resolveCriteriaColor(label: string, index: number) {
  return criteriaColorMap[label] ?? criteriaFallbackPalette[index % criteriaFallbackPalette.length];
}

function resolveUnitColor(label: string, index: number) {
  const fallbackPalette = ["#38BDF8", "#34D399", "#A78BFA", "#2DD4BF", "#FB923C"];
  return unitColorMap[label] ?? fallbackPalette[index % fallbackPalette.length];
}

function tooltipFormatter(
  value: number | string | ReadonlyArray<number | string> | undefined,
  name: number | string | undefined
) {
  const formattedValue =
    typeof value === "number"
      ? value.toFixed(2)
      : Array.isArray(value)
        ? value.join(", ")
        : value ?? "-";

  return [formattedValue, name ? String(name) : "Nilai"] as [string, string];
}

function legendFormatter(value: string, entry?: { color?: string }) {
  return (
    <span style={{ color: entry?.color ?? legendTextColor, fontWeight: 600 }}>
      {value}
    </span>
  );
}

type TrendPoint = {
  label: string;
  averageScore: number;
};

type DistributionPoint = {
  label: string;
  averageScore: number;
  totalScores?: number;
  totalAssessments?: number;
};

function ChartCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <SectionCard className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
      <div className="h-80">{children}</div>
    </SectionCard>
  );
}

export function DailyTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartCard
      title="Tren Harian"
      description="Rata-rata skor harian berdasarkan penilaian yang berstatus hadir."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="2 5" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <YAxis domain={scoreDomain} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
          <Line
            type="monotone"
            dataKey="averageScore"
            stroke={dailyLineColor}
            strokeWidth={3}
            dot={{ r: 3, fill: dailyLineColor, stroke: "#e0f2fe", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: trendAccentColor, stroke: dailyLineColor, strokeWidth: 2 }}
            style={lineGlowStyle}
            name="Rata-rata"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PeriodTrendChart({
  weekly,
  monthly
}: {
  weekly: TrendPoint[];
  monthly: TrendPoint[];
}) {
  const data = weekly.map((item) => ({
    period: `Minggu ${item.label}`,
    weekly: item.averageScore,
    monthly:
      monthly.find((month) => item.label.startsWith(month.label))?.averageScore ?? 0
  }));

  const fallbackData =
    data.length > 0
      ? data
      : monthly.map((item) => ({
          period: item.label,
          weekly: 0,
          monthly: item.averageScore
        }));

  return (
    <ChartCard
      title="Tren Mingguan & Bulanan"
      description="Perbandingan agregasi performa dalam horizon waktu yang lebih panjang."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={fallbackData}>
          <CartesianGrid strokeDasharray="2 5" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="period" fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <YAxis domain={scoreDomain} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
          <Line
            type="monotone"
            dataKey="weekly"
            stroke={weeklyLineColor}
            strokeWidth={3}
            dot={{ r: 3, fill: weeklyLineColor, stroke: "#e0f2fe", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: trendAccentColor, stroke: weeklyLineColor, strokeWidth: 2 }}
            style={lineGlowStyle}
            name="Mingguan"
          />
          <Line
            type="monotone"
            dataKey="monthly"
            stroke={monthlyLineColor}
            strokeWidth={3}
            dot={{ r: 3, fill: monthlyLineColor, stroke: "#dcfce7", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: trendAccentColor, stroke: monthlyLineColor, strokeWidth: 2 }}
            style={{ filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.24))" }}
            name="Bulanan"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CriteriaDistributionChart({
  data
}: {
  data: DistributionPoint[];
}) {
  return (
    <ChartCard
      title="Distribusi Kriteria"
      description="Rata-rata skor untuk tiap kriteria aktif pada data yang difilter."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="averageScore"
            nameKey="label"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={resolveCriteriaColor(entry.label, index)} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function UnitComparisonChart({
  data
}: {
  data: DistributionPoint[];
}) {
  return (
    <ChartCard
      title="Perbandingan Unit"
      description="Perbandingan rata-rata skor antar unit kerja."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="2 5" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <YAxis domain={scoreDomain} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
          <Bar dataKey="averageScore" radius={[10, 10, 0, 0]} name="Rata-rata">
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={resolveUnitColor(entry.label, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
