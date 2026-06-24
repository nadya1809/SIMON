import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type ApiSuccessOptions = {
  message?: string;
  status?: number;
};

type ApiErrorOptions = {
  errors?: unknown;
  status: number;
};

export function apiSuccess<T>(data: T, options: ApiSuccessOptions = {}) {
  return NextResponse.json(
    {
      ...(options.message ? { message: options.message } : {}),
      data
    },
    { status: options.status ?? 200 }
  );
}

export function apiCreated<T>(data: T, message?: string) {
  return apiSuccess(data, {
    message,
    status: 201
  });
}

export function apiMessage(
  message: string,
  status = 200,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      message,
      ...extra
    },
    { status }
  );
}

export function apiError(message: string, options: ApiErrorOptions) {
  return NextResponse.json(
    {
      message,
      ...(options.errors ? { errors: options.errors } : {})
    },
    { status: options.status }
  );
}

export function apiValidationError(message: string, errors?: unknown) {
  return apiError(message, {
    status: 400,
    errors
  });
}

export function apiUnauthorized() {
  return apiMessage("Unauthorized. Silakan login terlebih dahulu.", 401);
}

export function apiForbidden() {
  return apiMessage(
    "Forbidden. Anda tidak memiliki akses ke fitur ini.",
    403
  );
}

export function apiNotFound(message: string) {
  return apiMessage(message, 404);
}

export function apiConflict(message: string) {
  return apiMessage(message, 409);
}

export function mapPrismaError(
  error: unknown,
  messages?: Partial<Record<"P2002" | "P2025", string>>
) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (error.code === "P2002") {
    return apiConflict(
      messages?.P2002 ?? "Data duplikat terdeteksi pada field yang harus unik."
    );
  }

  if (error.code === "P2025") {
    return apiNotFound(messages?.P2025 ?? "Data yang diminta tidak ditemukan.");
  }

  return null;
}
