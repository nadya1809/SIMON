import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { apiForbidden, apiUnauthorized } from "@/lib/api-response";

const getCachedServerSession = cache(() => getServerSession(authOptions));

export async function requireAuth() {
  const session = await getCachedServerSession();

  if (!session?.user) {
    redirect("/api/auth/clear-session?callbackUrl=/login");
  }

  return session;
}

export async function requireRolesPage(roles: Role[]) {
  const session = await requireAuth();

  if (!roles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireApiAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      response: apiUnauthorized()
    };
  }

  return { session, response: null };
}

export async function requireApiRoles(roles: Role[]) {
  const { session, response } = await requireApiAuth();

  if (response || !session?.user) {
    return { session: null, response };
  }

  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      response: apiForbidden()
    };
  }

  return { session, response: null };
}
