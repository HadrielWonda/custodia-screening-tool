import { NextRequest, NextResponse } from "next/server";

import {
  assessmentSessionCookieName,
  fromPrismaClassification,
  fromPrismaDiabetesStatus,
  fromPrismaScoringBranch,
} from "@/lib/assessment-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const sessionId = request.cookies.get(assessmentSessionCookieName)?.value;

  if (!sessionId) {
    return NextResponse.json({ errors: ["Assessment result was not found for this session."] }, { status: 404 });
  }

  const { id } = await context.params;
  const result = await prisma.result.findFirst({
    where: {
      assessmentId: id,
      assessment: { sessionId },
    },
    include: {
      assessment: true,
      scoringRuleVersion: true,
    },
  });

  if (!result) {
    return NextResponse.json({ errors: ["Assessment result was not found for this session."] }, { status: 404 });
  }

  return NextResponse.json({
    assessment: {
      id: result.assessment.id,
      referenceCode: result.assessment.referenceCode,
      diabetesStatus: fromPrismaDiabetesStatus(result.assessment.diabetesStatus),
      responses: result.assessment.responses,
      createdAt: result.assessment.createdAt,
    },
    result: {
      id: result.id,
      classification: fromPrismaClassification(result.classification),
      score: result.score === null ? null : Number(result.score),
      contributingFactors: result.contributingFactors,
      createdAt: result.createdAt,
    },
    scoringRuleVersion: {
      id: result.scoringRuleVersion.id,
      branch: fromPrismaScoringBranch(result.scoringRuleVersion.branch),
      versionNumber: result.scoringRuleVersion.versionNumber,
    },
  });
}