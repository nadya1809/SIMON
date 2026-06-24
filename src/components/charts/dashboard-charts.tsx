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

const palette = ["#0a6fb6", "#33a9e0", "#2ba7a0", "#77c5ec", "#8fd4cd"];
const gridStroke = "#dbe7f1";
const axisStroke = "#90a4b5";
const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid #d8e4ef",
  boxShadow: "0 18px 40px rgba(24, 50, 71, 0.08)"
};

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
          <YAxis domain={[0, 10]} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="averageScore"
            stroke="#0a6fb6"
            strokeWidth={3}
            dot={{ r: 3, fill: "#0a6fb6" }}
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
          <YAxis domain={[0, 10]} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="weekly"
            stroke="#33a9e0"
            strokeWidth={3}
            dot={{ r: 3, fill: "#33a9e0" }}
            name="Mingguan"
          />
          <Line
            type="monotone"
            dataKey="monthly"
            stroke="#2ba7a0"
            strokeWidth={3}
            dot={{ r: 3, fill: "#2ba7a0" }}
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
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
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
          <YAxis domain={[0, 10]} fontSize={12} tick={{ fill: axisStroke }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="averageScore" fill="#0a6fb6" radius={[10, 10, 0, 0]} name="Rata-rata" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
