"use server";

import { redirect } from "next/navigation";

import {
  clearNurseSession,
  isNurseAuthConfigured,
  isValidNursePassword,
  setNurseSession,
} from "@/lib/nurse-auth";

export async function signInNurse(formData: FormData) {
  if (!isNurseAuthConfigured()) {
    redirect("/dashboard/login?error=not_configured");
  }

  const password = String(formData.get("password") ?? "");

  if (!password) {
    redirect("/dashboard/login?error=missing_password");
  }

  if (!isValidNursePassword(password)) {
    redirect("/dashboard/login?error=invalid_password");
  }

  await setNurseSession();
  redirect("/dashboard");
}

export async function signOutNurse() {
  await clearNurseSession();
  redirect("/dashboard/login");
}