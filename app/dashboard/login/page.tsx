import Link from "next/link";
import { redirect } from "next/navigation";

import { signInNurse } from "../actions";
import { isNurseAuthenticated } from "@/lib/nurse-auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_password: "That password did not match the nurse dashboard password.",
  missing_password: "Enter the nurse dashboard password.",
  not_configured: "NURSE_DASHBOARD_PASSWORD is not configured for this environment.",
};

export default async function NurseDashboardLoginPage({ searchParams }: LoginPageProps) {
  if (await isNurseAuthenticated()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : null;

  return (
    <main className="pageShell dashboardShell authShell">
      <section className="panel authPanel">
        <div className="panelHeader">
          <p className="eyebrow">Nurse access</p>
          <h1>Diabetes dashboard</h1>
        </div>

        {errorMessage ? <div className="errorBox">{errorMessage}</div> : null}

        <form action={signInNurse} className="authForm">
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="submitButton" type="submit">
            Sign in
          </button>
        </form>

        <p className="disclaimer">
          This dashboard shows all submitted assessments to authenticated nurses. It does not assign,
          claim, or filter cases by nurse.
        </p>
        <Link className="dashboardBackLink" href="/">
          Return to screening
        </Link>
      </section>
    </main>
  );
}