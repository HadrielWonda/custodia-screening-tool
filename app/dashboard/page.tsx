import { redirect } from "next/navigation";

import { AssessmentRow } from "./assessment-row";
import { signOutNurse } from "./actions";
import { fromPrismaClassification, fromPrismaDiabetesStatus, fromPrismaScoringBranch } from "@/lib/assessment-api";
import type { Classification as PrismaClassification, DiabetesStatus as PrismaDiabetesStatus } from "@/lib/generated/prisma/client";
import { isNurseAuthenticated } from "@/lib/nurse-auth";
import { prisma } from "@/lib/prisma";
import type { Classification, DiabetesStatus, ScoringBranch } from "@/lib/scoring";

export const dynamic = "force-dynamic";

type NurseDashboardPageProps = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export default async function NurseDashboardPage({ searchParams }: NurseDashboardPageProps) {
  if (!(await isNurseAuthenticated())) {
    redirect("/dashboard/login");
  }

  const { reference } = await searchParams;
  const referenceQuery = reference?.trim() ?? "";

  const assessments = await prisma.assessment.findMany({
    where: referenceQuery
      ? {
          referenceCode: {
            contains: referenceQuery,
            mode: "insensitive",
          },
        }
      : undefined,
    include: {
      result: {
        include: {
          scoringRuleVersion: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="pageShell dashboardShell">
      <section className="panel dashboardPanel">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">Shared nurse queue</p>
            <h1>Assessments</h1>
            <p className="dashboardIntro">
              Every submitted assessment is visible here, newest first. High-risk diabetes cases are
              flagged for WhatsApp follow-up.
            </p>
          </div>
          <form action={signOutNurse}>
            <button className="secondaryButton" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="dashboardStats" aria-label="Assessment totals">
          <div>
            <span>{assessments.length}</span>
            <p>{referenceQuery ? "Matching assessments" : "Total assessments"}</p>
          </div>
          <div>
            <span>{assessments.filter((assessment) => isDiabetesHighRisk(assessment)).length}</span>
            <p>Diabetes high risk</p>
          </div>
        </div>

        <form className="dashboardSearch" action="/dashboard">
          <label htmlFor="reference">Search by reference</label>
          <div>
            <input
              id="reference"
              name="reference"
              placeholder="Enter reference code"
              type="search"
              defaultValue={referenceQuery}
            />
            <button className="primaryButton" type="submit">
              Search
            </button>
            {referenceQuery ? (
              <a className="secondaryButton" href="/dashboard">
                Clear
              </a>
            ) : null}
          </div>
        </form>

        {assessments.length === 0 ? (
          <div className="emptyState">
            {referenceQuery
              ? `No assessments match reference "${referenceQuery}".`
              : "No assessments have been submitted yet."}
          </div>
        ) : (
          <div className="dashboardTableWrap">
            <table className="dashboardTable">
              <thead>
                <tr>
                  <th scope="col">Flag</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Diabetes status</th>
                  <th scope="col">Classification</th>
                  <th scope="col">Score</th>
                  <th scope="col">Rule version</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => {
                  const diabetesStatus = fromPrismaDiabetesStatus(assessment.diabetesStatus);
                  const classification = assessment.result
                    ? fromPrismaClassification(assessment.result.classification)
                    : null;
                  const branch = assessment.result
                    ? fromPrismaScoringBranch(assessment.result.scoringRuleVersion.branch)
                    : null;

                  return (
                    <AssessmentRow
                      key={assessment.id}
                      classification={classification ? formatClassification(classification) : "Pending result"}
                      diabetesStatus={formatDiabetesStatus(diabetesStatus)}
                      flagged={isDiabetesHighRisk(assessment)}
                      href={`/dashboard/assessments/${assessment.id}`}
                      referenceCode={assessment.referenceCode}
                      ruleVersion={
                        assessment.result
                          ? `${formatBranch(branch)} v${assessment.result.scoringRuleVersion.versionNumber}`
                          : "-"
                      }
                      score={formatScore(assessment.result?.score)}
                      submittedAt={formatDateTime(assessment.createdAt)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

type AssessmentWithResult = {
  diabetesStatus: PrismaDiabetesStatus;
  result: {
    classification: PrismaClassification;
  } | null;
};

function isDiabetesHighRisk(assessment: AssessmentWithResult) {
  if (!assessment.result) {
    return false;
  }

  return (
    fromPrismaDiabetesStatus(assessment.diabetesStatus) === "diagnosed" &&
    fromPrismaClassification(assessment.result.classification) === "diabetes_high"
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDiabetesStatus(status: DiabetesStatus) {
  return status === "diagnosed" ? "Diagnosed" : "Not diagnosed / not sure";
}

function formatClassification(classification: Classification) {
  return classification
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatBranch(branch: ScoringBranch | null) {
  if (!branch) {
    return "Rule";
  }

  return branch === "risk_of_diabetes" ? "Diabetes risk" : "Complication risk";
}

function formatScore(score: unknown) {
  if (score === null || score === undefined) {
    return "Override";
  }

  return Number(score).toString();
}