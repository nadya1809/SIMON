import { isDateInputValue } from "@/lib/date-only";

export type UserAssessmentReferenceItem = {
  serviceRating: number;
  officerRating: number;
  comment: string;
};

export type UserAssessmentReference = {
  nip: string;
  assessmentDate: string;
  assessments: UserAssessmentReferenceItem[];
  assessmentCount: number;
  commentCount: number;
};

export type UserAssessmentReferenceResponse = {
  data: UserAssessmentReference | null;
};

type QueueBpsErrorResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

const EMPTY_COMMENT_FALLBACK =
  "Tidak ada komentar dari pelanggan pada tanggal ini.";

const dummyReferences = new Map<string, UserAssessmentReference>(
  [
    {
      nip: "198802282010122005",
      assessmentDate: "2026-07-30",
      assessments: [
        {
          serviceRating: 5,
          officerRating: 5,
          comment: "Pelayanan cepat dan penjelasan mudah dipahami."
        },
        {
          serviceRating: 4,
          officerRating: 5,
          comment: "Petugas ramah saat membantu kebutuhan data."
        }
      ],
      assessmentCount: 2,
      commentCount: 2
    },
    {
      nip: "199102112014121001",
      assessmentDate: "2026-07-30",
      assessments: [
        {
          serviceRating: 2,
          officerRating: 2,
          comment: "Pengguna menilai waktu tunggu masih terlalu lama."
        },
        {
          serviceRating: 2,
          officerRating: 3,
          comment: "Informasi lanjutan perlu disampaikan dengan lebih jelas."
        }
      ],
      assessmentCount: 2,
      commentCount: 2
    },
    {
      nip: "198605092009022009",
      assessmentDate: "2026-07-30",
      assessments: [
        {
          serviceRating: 4,
          officerRating: 4,
          comment: "Pengguna terbantu dengan arahan petugas."
        },
        {
          serviceRating: 4,
          officerRating: 4,
          comment: EMPTY_COMMENT_FALLBACK
        }
      ],
      assessmentCount: 2,
      commentCount: 1
    }
  ].map((item) => [buildReferenceKey(item.nip, item.assessmentDate), item])
);

function buildReferenceKey(nip: string, assessmentDate: string) {
  return `${nip.trim()}::${assessmentDate.trim()}`;
}

function normalizeRating(value: unknown) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(rating)));
}

function normalizeReferenceItem(
  item: Partial<UserAssessmentReferenceItem>
): UserAssessmentReferenceItem {
  return {
    serviceRating: normalizeRating(item.serviceRating),
    officerRating: normalizeRating(item.officerRating),
    comment:
      typeof item.comment === "string" && item.comment.trim()
        ? item.comment.trim()
        : EMPTY_COMMENT_FALLBACK
  };
}

function normalizeReference(
  value: UserAssessmentReference | null
): UserAssessmentReference | null {
  if (!value) {
    return null;
  }

  const assessments = Array.isArray(value.assessments)
    ? value.assessments.map(normalizeReferenceItem)
    : [];

  if (!assessments.length) {
    return null;
  }

  return {
    nip: value.nip.trim(),
    assessmentDate: value.assessmentDate.trim(),
    assessments,
    assessmentCount: assessments.length,
    commentCount: Number.isFinite(Number(value.commentCount))
      ? Number(value.commentCount)
      : assessments.filter((item) => item.comment !== EMPTY_COMMENT_FALLBACK)
          .length
  };
}

export function getDummyUserAssessmentReference(params: {
  nip?: string | null;
  assessmentDate?: string | null;
}) {
  const nip = params.nip?.trim();
  const assessmentDate = params.assessmentDate?.trim();

  if (!nip || !assessmentDate || !isDateInputValue(assessmentDate)) {
    return null;
  }

  return dummyReferences.get(buildReferenceKey(nip, assessmentDate)) ?? null;
}

export async function getUserAssessmentReference(params: {
  nip: string;
  assessmentDate: string;
}) {
  const nip = params.nip.trim();
  const assessmentDate = params.assessmentDate.trim();

  if (!nip || !/^\d+$/.test(nip) || !isDateInputValue(assessmentDate)) {
    throw new Error("Parameter referensi penilaian pengguna tidak valid.");
  }

  const baseUrl = process.env.QUEUEBPS_BASE_URL?.trim();
  const token = process.env.SIMON_INTEGRATION_TOKEN?.trim();

  if (!baseUrl || !token) {
    return getDummyUserAssessmentReference({ nip, assessmentDate });
  }

  const url = new URL("/api/user-assessment-reference", baseUrl);
  url.searchParams.set("nip", nip);
  url.searchParams.set("assessmentDate", assessmentDate);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });
  } catch {
    const fallbackReference = getDummyUserAssessmentReference({
      nip,
      assessmentDate
    });

    if (fallbackReference) {
      return fallbackReference;
    }

    throw new Error(
      "QueueBPS belum bisa dijangkau dari server SIMON. Periksa IP LAN, port 3000, firewall, dan pastikan QueueBPS berjalan dengan host 0.0.0.0."
    );
  }

  const payload = (await response.json().catch(() => ({}))) as
    | UserAssessmentReferenceResponse
    | QueueBpsErrorResponse;

  if (!response.ok) {
    const message =
      "error" in payload
        ? payload.error
        : "message" in payload
          ? payload.message
          : "Gagal mengambil referensi penilaian pengguna.";

    throw new Error(message || "Gagal mengambil referensi penilaian pengguna.");
  }

  if (!("data" in payload)) {
    return null;
  }

  return normalizeReference(payload.data);
}
