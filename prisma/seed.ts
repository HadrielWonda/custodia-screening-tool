import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  ScoringBranch,
} from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const riskOfDiabetesRules = {
  source: "FINDRISC",
  branch: "risk_of_diabetes",
  version: 1,
  cutoff: {
    highRiskScore: 12,
    classificationBelowCutoff: "no_diabetes_low",
    classificationAtOrAboveCutoff: "no_diabetes_high",
  },
  derivedFields: {
    bmi: {
      formula: "weightKg / (heightM * heightM)",
      inputs: ["height", "weight"],
    },
  },
  factors: {
    age: [
      { label: "<45", maxExclusive: 45, points: 0 },
      { label: "45-54", minInclusive: 45, maxInclusive: 54, points: 2 },
      { label: "55-64", minInclusive: 55, maxInclusive: 64, points: 3 },
      { label: ">64", minInclusive: 65, points: 4 },
    ],
    bmi: [
      { label: "<25", maxExclusive: 25, points: 0 },
      { label: "25-30", minInclusive: 25, maxInclusive: 30, points: 1 },
      { label: ">30", minExclusive: 30, points: 3 },
    ],
    waistCircumference: {
      unknownAllowed: true,
      sexSpecific: true,
      male: [
        { label: "<94cm", maxExclusive: 94, points: 0 },
        { label: "94-102cm", minInclusive: 94, maxInclusive: 102, points: 3 },
        { label: ">102cm", minExclusive: 102, points: 4 },
      ],
      female: [
        { label: "<80cm", maxExclusive: 80, points: 0 },
        { label: "80-88cm", minInclusive: 80, maxInclusive: 88, points: 3 },
        { label: ">88cm", minExclusive: 88, points: 4 },
      ],
    },
    dailyPhysicalActivityAtLeast30Minutes: {
      yes: 0,
      no: 2,
    },
    dailyFruitOrVegetableIntake: {
      daily: 0,
      notDaily: 1,
    },
    historyOfBloodPressureMedication: {
      yes: 2,
      no: 0,
    },
    historyOfHighBloodGlucose: {
      yes: 5,
      no: 0,
    },
    familyHistoryOfDiabetes: {
      none: 0,
      extendedFamily: 3,
      immediateFamily: 5,
    },
  },
};

const complicationRiskRules = {
  source: "Custom complication-risk checklist",
  branch: "complication_risk",
  version: 1,
  clinicalReviewRequired: true,
  classification: {
    lowRisk: "diabetes_low",
    highRisk: "diabetes_high",
  },
  evaluationOrder: ["redFlags", "weightedChecklist"],
  redFlags: [
    {
      id: "current_unhealed_foot_wound_or_ulcer",
      label: "Current unhealed foot wound or ulcer",
      forcesClassification: "diabetes_high",
    },
    {
      id: "sudden_vision_loss_or_blurring",
      label: "Sudden vision loss or blurring",
      forcesClassification: "diabetes_high",
    },
    {
      id: "ketoacidosis_symptoms",
      label: "Nausea, vomiting, rapid breathing, or confusion",
      forcesClassification: "diabetes_high",
      urgentCareMessaging: true,
    },
    {
      id: "chest_pain_or_shortness_of_breath",
      label: "Chest pain or shortness of breath",
      forcesClassification: "diabetes_high",
    },
  ],
  weightedChecklist: {
    weightsPendingClinicalReview: true,
    factors: [
      "glycemic_control",
      "duration_of_diabetes",
      "blood_pressure_control",
      "smoking_status",
      "neuropathy_symptoms",
      "retinopathy_symptoms",
      "nephropathy_signals",
      "medication_adherence",
      "time_since_last_checkup",
    ],
    riskMarkers: {
      timeSinceLastCheckup: {
        highRiskIfGreaterThanMonths: 12,
      },
    },
  },
};

async function main() {
  await prisma.scoringRuleVersion.upsert({
    where: {
      branch_versionNumber: {
        branch: ScoringBranch.RISK_OF_DIABETES,
        versionNumber: 1,
      },
    },
    update: {
      rules: riskOfDiabetesRules,
      createdBy: "system",
    },
    create: {
      branch: ScoringBranch.RISK_OF_DIABETES,
      versionNumber: 1,
      rules: riskOfDiabetesRules,
      createdBy: "system",
    },
  });

  await prisma.scoringRuleVersion.upsert({
    where: {
      branch_versionNumber: {
        branch: ScoringBranch.COMPLICATION_RISK,
        versionNumber: 1,
      },
    },
    update: {
      rules: complicationRiskRules,
      createdBy: "system",
    },
    create: {
      branch: ScoringBranch.COMPLICATION_RISK,
      versionNumber: 1,
      rules: complicationRiskRules,
      createdBy: "system",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });