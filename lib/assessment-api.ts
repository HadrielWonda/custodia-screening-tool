import {
  Classification as PrismaClassification,
  DiabetesStatus as PrismaDiabetesStatus,
  ScoringBranch as PrismaScoringBranch,
} from "@/lib/generated/prisma/client";
import type { Classification, DiabetesStatus, ScoringBranch } from "@/lib/scoring";

export const assessmentSessionCookieName = "custodia_assessment_session";

export function toPrismaDiabetesStatus(diabetesStatus: DiabetesStatus): PrismaDiabetesStatus {
  return diabetesStatus === "diagnosed"
    ? PrismaDiabetesStatus.DIAGNOSED
    : PrismaDiabetesStatus.NOT_DIAGNOSED;
}

export function toPrismaScoringBranch(branch: ScoringBranch): PrismaScoringBranch {
  return branch === "risk_of_diabetes"
    ? PrismaScoringBranch.RISK_OF_DIABETES
    : PrismaScoringBranch.COMPLICATION_RISK;
}

export function toPrismaClassification(classification: Classification): PrismaClassification {
  switch (classification) {
    case "no_diabetes_low":
      return PrismaClassification.NO_DIABETES_LOW;
    case "no_diabetes_high":
      return PrismaClassification.NO_DIABETES_HIGH;
    case "diabetes_low":
      return PrismaClassification.DIABETES_LOW;
    case "diabetes_high":
      return PrismaClassification.DIABETES_HIGH;
  }
}

export function fromPrismaDiabetesStatus(diabetesStatus: PrismaDiabetesStatus): DiabetesStatus {
  return diabetesStatus === PrismaDiabetesStatus.DIAGNOSED ? "diagnosed" : "not_diagnosed";
}

export function fromPrismaScoringBranch(branch: PrismaScoringBranch): ScoringBranch {
  return branch === PrismaScoringBranch.RISK_OF_DIABETES ? "risk_of_diabetes" : "complication_risk";
}

export function fromPrismaClassification(classification: PrismaClassification): Classification {
  switch (classification) {
    case PrismaClassification.NO_DIABETES_LOW:
      return "no_diabetes_low";
    case PrismaClassification.NO_DIABETES_HIGH:
      return "no_diabetes_high";
    case PrismaClassification.DIABETES_LOW:
      return "diabetes_low";
    case PrismaClassification.DIABETES_HIGH:
      return "diabetes_high";
  }
}