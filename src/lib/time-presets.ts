type TimePresetConfig = {
  value: TimePreset;
  label: string;
  days: number | null;
};

export type TimePreset =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "365d";

export const TIME_PRESET_OPTIONS: TimePresetConfig[] = [
  { value: "all", label: "Semua", days: null },
  { value: "today", label: "Hari ini", days: 1 },
  { value: "7d", label: "1 minggu", days: 7 },
  { value: "30d", label: "1 bulan", days: 30 },
  { value: "90d", label: "3 bulan", days: 90 },
  { value: "180d", label: "6 bulan", days: 180 },
  { value: "365d", label: "1 tahun", days: 365 }
];

function formatLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

export function isTimePreset(value: string | null | undefined): value is TimePreset {
  return TIME_PRESET_OPTIONS.some((option) => option.value === value);
}

export function getDefaultTimePreset(): TimePreset {
  return "all";
}

export function getTimePresetRange(preset: TimePreset, today = new Date()) {
  if (preset === "all") {
    return {
      from: "",
      to: ""
    };
  }

  const option = TIME_PRESET_OPTIONS.find((item) => item.value === preset);

  if (!option?.days) {
    return {
      from: "",
      to: ""
    };
  }

  const to = formatLocalDateInput(today);
  const from = formatLocalDateInput(subtractDays(today, option.days - 1));

  return {
    from,
    to
  };
}

export function resolveTimePreset(value: string | null | undefined) {
  return isTimePreset(value) ? value : getDefaultTimePreset();
}
