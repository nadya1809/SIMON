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

const palette = [
  "var(--accent-strong)",
  "var(--accent-sky)",
  "var(--accent-teal)",
  "#77c5ec",
  "#8fd4cd"
];
const gridStroke = "var(--chart-grid)";
const axisStroke = "var(--chart-axis)";
const tooltipStyle = {
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
  borderRadius: "16px",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-md)"
};
const legendStyle = {
  color: "var(--muted)"
};
const scoreDomain: [number, number] = [0, 100];

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
          <Legend wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="averageScore"
            stroke="var(--accent-strong)"
            strokeWidth={3}
            dot={{ r: 3, fill: "var(--accent-strong)" }}
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
          <Legend wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="weekly"
            stroke="var(--accent-sky)"
            strokeWidth={3}
            dot={{ r: 3, fill: "var(--accent-sky)" }}
            name="Mingguan"
          />
          <Line
            type="monotone"
            dataKey="monthly"
            stroke="var(--accent-teal)"
            strokeWidth={3}
            dot={{ r: 3, fill: "var(--accent-teal)" }}
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
              <Cell key={entry.label} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
          <Legend wrapperStyle={legendStyle} />
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
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="averageScore" fill="var(--accent-strong)" radius={[10, 10, 0, 0]} name="Rata-rata" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
