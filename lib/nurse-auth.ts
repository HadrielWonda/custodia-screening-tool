import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const nurseDashboardCookieName = "custodia_nurse_dashboard_session";
const nurseDashboardCookiePayload = "nurse-dashboard";

export function isNurseAuthConfigured() {
  return Boolean(process.env.NURSE_DASHBOARD_PASSWORD);
}

export function isValidNursePassword(password: string) {
  const configuredPassword = process.env.NURSE_DASHBOARD_PASSWORD;

  if (!configuredPassword) {
    return false;
  }

  return safeEquals(password, configuredPassword);
}

export async function isNurseAuthenticated() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(nurseDashboardCookieName)?.value;

  if (!sessionCookie) {
    return false;
  }

  return safeEquals(sessionCookie, createNurseSessionValue());
}

export async function setNurseSession() {
  const cookieStore = await cookies();

  cookieStore.set(nurseDashboardCookieName, createNurseSessionValue(), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/dashboard",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearNurseSession() {
  const cookieStore = await cookies();

  cookieStore.set(nurseDashboardCookieName, "", {
    maxAge: 0,
    path: "/dashboard",
  });
}

function createNurseSessionValue() {
  const secret = process.env.NURSE_DASHBOARD_SESSION_SECRET ?? process.env.NURSE_DASHBOARD_PASSWORD;

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(nurseDashboardCookiePayload).digest("hex");
}

export function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}