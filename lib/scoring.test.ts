import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type DiagnosedScoringInput,
  type NotDiagnosedScoringInput,
  type RedFlagId,
  scoreAssessment,
} from "./scoring";

const noRedFlags: Record<RedFlagId, boolean> = {
  foot_wound_or_ulcer: false,
  sudden_vision_loss_or_blurring: false,
  ketoacidosis_symptoms: false,
  chest_pain_or_shortness_of_breath: false,
};

const clearBranchALowRisk: NotDiagnosedScoringInput = {
  diabetesStatus: "not_diagnosed",
  age: 32,
  heightCm: 175,
  weightKg: 68,
  sex: "male",
  waistCircumferenceCm: 82,
  dailyPhysicalActivity: true,
  dailyFruitOrVegetableIntake: true,
  historyOfBloodPressureMedication: false,
  historyOfHighBloodGlucose: false,
  familyHistory: "none",
};

const clearBranchBLowRisk: DiagnosedScoringInput = {
  diabetesStatus: "diagnosed",
  redFlags: noRedFlags,
  hba1cControl: "known_good",
  glucoseEpisodeFrequency: "rare",
  diabetesDuration: "under_5_years",
  bloodPressureControl: "controlled",
  smokingStatus: "non_smoker",
  neuropathySymptoms: false,
  retinopathySymptoms: false,
  nephropathySignals: false,
  medicationAdherence: true,
  lastCheckup: "within_12_months",
};

describe("Branch A: not diagnosed diabetes risk", () => {
  it("classifies a clear low-risk case", () => {
    const result = scoreAssessment(clearBranchALowRisk);

    assert.equal(result.branch, "risk_of_diabetes");
    assert.equal(result.classification, "no_diabetes_low");
    assert.equal(result.score, 0);
    assert.deepEqual(result.redFlags, []);
    assert.equal(result.urgentCareRecommended, false);
  });

  it("classifies a clear high-risk case", () => {
    const result = scoreAssessment({
      diabetesStatus: "not_diagnosed",
      age: 68,
      heightCm: 160,
      weightKg: 92,
      sex: "female",
      waistCircumferenceCm: 96,
      dailyPhysicalActivity: false,
      dailyFruitOrVegetableIntake: false,
      historyOfBloodPressureMedication: true,
      historyOfHighBloodGlucose: true,
      familyHistory: "immediate",
    });

    assert.equal(result.classification, "no_diabetes_high");
    assert.equal(result.score, 26);
  });

  it("keeps score 11 below the high-risk cutoff", () => {
    const result = scoreAssessment({
      ...clearBranchALowRisk,
      age: 50,
      weightKg: 78,
      waistCircumferenceCm: 98,
      dailyPhysicalActivity: false,
      familyHistory: "extended",
    });

    assert.equal(result.score, 11);
    assert.equal(result.classification, "no_diabetes_low");
  });

  it("classifies score 12 at the high-risk cutoff", () => {
    const result = scoreAssessment({
      ...clearBranchALowRisk,
      age: 50,
      weightKg: 78,
      waistCircumferenceCm: 98,
      dailyPhysicalActivity: false,
      dailyFruitOrVegetableIntake: false,
      familyHistory: "extended",
    });

    assert.equal(result.score, 12);
    assert.equal(result.classification, "no_diabetes_high");
  });
});

describe("Branch B: diagnosed complication risk", () => {
  it("classifies a clear low-risk case", () => {
    const result = scoreAssessment(clearBranchBLowRisk);

    assert.equal(result.branch, "complication_risk");
    assert.equal(result.classification, "diabetes_low");
    assert.equal(result.score, 0);
    assert.deepEqual(result.redFlags, []);
    assert.equal(result.urgentCareRecommended, false);
  });

  it("classifies a clear high-risk case without red flags", () => {
    const result = scoreAssessment({
      ...clearBranchBLowRisk,
      hba1cControl: "known_elevated",
      glucoseEpisodeFrequency: "weekly_or_more",
    });

    assert.equal(result.classification, "diabetes_high");
    assert.equal(result.score, 6);
    assert.deepEqual(result.redFlags, []);
  });

  const redFlagCases: Array<[RedFlagId, boolean]> = [
    ["foot_wound_or_ulcer", false],
    ["sudden_vision_loss_or_blurring", false],
    ["ketoacidosis_symptoms", true],
    ["chest_pain_or_shortness_of_breath", false],
  ];

  for (const [redFlagId, urgentCareRecommended] of redFlagCases) {
    it(`automatically classifies ${redFlagId} as high risk regardless of Layer 2 score`, () => {
      const result = scoreAssessment({
        ...clearBranchBLowRisk,
        redFlags: { ...noRedFlags, [redFlagId]: true },
      });

      assert.equal(result.classification, "diabetes_high");
      assert.equal(result.score, null);
      assert.deepEqual(result.redFlags.map((factor) => factor.id), [redFlagId]);
      assert.equal(result.urgentCareRecommended, urgentCareRecommended);
    });
  }
});