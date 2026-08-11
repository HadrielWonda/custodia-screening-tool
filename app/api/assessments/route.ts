import { NextRequest, NextResponse } from "next/server";

import {
  assessmentSessionCookieName,
  toPrismaClassification,
  toPrismaDiabetesStatus,
  toPrismaScoringBranch,
} from "@/lib/assessment-api";
import { validateAssessmentSubmission } from "@/lib/assessment-submission";
import { prisma } from "@/lib/prisma";
import { scoreAssessment } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const validation = validateAssessmentSubmission(payload);

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const sessionId = request.cookies.get(assessmentSessionCookieName)?.value ?? crypto.randomUUID();
  const scoringResult = scoreAssessment(validation.input);
  const activeRuleVersion = await prisma.scoringRuleVersion.findFirst({
    where: {
      branch: toPrismaScoringBranch(validation.branch),
      effectiveFrom: { lte: new Date() },
    },
    orderBy: [{ effectiveFrom: "desc" }, { versionNumber: "desc" }],
  });

  if (!activeRuleVersion) {
    return NextResponse.json(
      { errors: ["No active scoring rule version is configured for this branch."] },
      { status: 500 },
    );
  }

  const saved = await prisma.$transaction(async (transaction) => {
    const assessment = await transaction.assessment.create({
      data: {
        sessionId,
        diabetesStatus: toPrismaDiabetesStatus(validation.input.diabetesStatus),
        responses: validation.responses,
      },
    });
    const result = await transaction.result.create({
      data: {
        assessmentId: assessment.id,
        scoringRuleVersionId: activeRuleVersion.id,
        classification: toPrismaClassification(scoringResult.classification),
        score: scoringResult.score,
        contributingFactors: scoringResult.contributingFactors,
      },
    });

    return { assessment, result };
  });

  const response = NextResponse.json(
    {
      assessmentId: saved.assessment.id,
      resultId: saved.result.id,
      scoringRuleVersion: activeRuleVersion.versionNumber,
      result: scoringResult,
    },
    { status: 201 },
  );

  response.cookies.set(assessmentSessionCookieName, sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}