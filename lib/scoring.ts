export type DiabetesStatus = "diagnosed" | "not_diagnosed";

export type ScoringBranch = "risk_of_diabetes" | "complication_risk";

export type Classification =
  | "no_diabetes_low"
  | "no_diabetes_high"
  | "diabetes_low"
  | "diabetes_high";

export type Sex = "male" | "female";

export type FamilyHistory = "none" | "extended" | "immediate";

export type HbA1cControl = "known_good" | "known_elevated" | "unknown";

export type EpisodeFrequency = "rare" | "monthly" | "weekly_or_more";

export type DiabetesDuration = "under_5_years" | "5_to_10_years" | "over_10_years";

export type BloodPressureControl = "controlled" | "uncontrolled" | "unknown";

export type SmokingStatus = "non_smoker" | "former_smoker" | "current_smoker";

export type CheckupRecency = "within_12_months" | "over_12_months";

export type RedFlagId =
  | "foot_wound_or_ulcer"
  | "sudden_vision_loss_or_blurring"
  | "ketoacidosis_symptoms"
  | "chest_pain_or_shortness_of_breath";

export type ContributingFactor = {
  id: string;
  label: string;
  points?: number;
};

export type NotDiagnosedScoringInput = {
  diabetesStatus: "not_diagnosed";
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  waistCircumferenceCm: number | "unknown";
  dailyPhysicalActivity: boolean;
  dailyFruitOrVegetableIntake: boolean;
  historyOfBloodPressureMedication: boolean;
  historyOfHighBloodGlucose: boolean;
  familyHistory: FamilyHistory;
};

export type DiagnosedScoringInput = {
  diabetesStatus: "diagnosed";
  redFlags: Record<RedFlagId, boolean>;
  hba1cControl: HbA1cControl;
  glucoseEpisodeFrequency: EpisodeFrequency;
  diabetesDuration: DiabetesDuration;
  bloodPressureControl: BloodPressureControl;
  smokingStatus: SmokingStatus;
  neuropathySymptoms: boolean;
  retinopathySymptoms: boolean;
  nephropathySignals: boolean;
  medicationAdherence: boolean;
  lastCheckup: CheckupRecency;
};

export type ScoringInput = NotDiagnosedScoringInput | DiagnosedScoringInput;

export type ScoringResult = {
  branch: ScoringBranch;
  ruleVersion: number;
  classification: Classification;
  score: number | null;
  contributingFactors: ContributingFactor[];
  redFlags: ContributingFactor[];
  urgentCareRecommended: boolean;
};

export const SCORING_RULE_VERSION = 1;

const BRANCH_A_HIGH_RISK_CUTOFF = 12;
const BRANCH_B_HIGH_RISK_CUTOFF = 6;

const RED_FLAG_LABELS: Record<RedFlagId, string> = {
  foot_wound_or_ulcer: "Current unhealed foot wound or ulcer",
  sudden_vision_loss_or_blurring: "Sudden vision loss or blurring",
  ketoacidosis_symptoms: "Symptoms suggestive of ketoacidosis",
  chest_pain_or_shortness_of_breath: "Chest pain or shortness of breath",
};

export function scoreAssessment(input: ScoringInput): ScoringResult {
  if (input.diabetesStatus === "not_diagnosed") {
    return scoreRiskOfDiabetes(input);
  }

  return scoreComplicationRisk(input);
}

export function calculateBmi(heightCm: number, weightKg: number): number {
  if (heightCm <= 0) {
    throw new Error("heightCm must be greater than 0");
  }

  if (weightKg <= 0) {
    throw new Error("weightKg must be greater than 0");
  }

  const heightMeters = heightCm / 100;

  return weightKg / heightMeters ** 2;
}

function scoreRiskOfDiabetes(input: NotDiagnosedScoringInput): ScoringResult {
  const bmi = calculateBmi(input.heightCm, input.weightKg);
  const factors: ContributingFactor[] = [
    ageFactor(input.age),
    bmiFactor(bmi),
    waistCircumferenceFactor(input.sex, input.waistCircumferenceCm),
    booleanFactor({
      id: "daily_physical_activity",
      label: "Less than 30 minutes of daily physical activity",
      applies: !input.dailyPhysicalActivity,
      points: 2,
    }),
    booleanFactor({
      id: "daily_fruit_or_vegetable_intake",
      label: "Fruit or vegetable intake is not daily",
      applies: !input.dailyFruitOrVegetableIntake,
      points: 1,
    }),
    booleanFactor({
      id: "blood_pressure_medication",
      label: "History of blood pressure medication",
      applies: input.historyOfBloodPressureMedication,
      points: 2,
    }),
    booleanFactor({
      id: "high_blood_glucose",
      label: "History of high blood glucose",
      applies: input.historyOfHighBloodGlucose,
      points: 5,
    }),
    familyHistoryFactor(input.familyHistory),
  ];
  const score = totalPoints(factors);

  return {
    branch: "risk_of_diabetes",
    ruleVersion: SCORING_RULE_VERSION,
    classification: score >= BRANCH_A_HIGH_RISK_CUTOFF ? "no_diabetes_high" : "no_diabetes_low",
    score,
    contributingFactors: contributingFactors(factors),
    redFlags: [],
    urgentCareRecommended: false,
  };
}

function scoreComplicationRisk(input: DiagnosedScoringInput): ScoringResult {
  const redFlags = Object.entries(input.redFlags)
    .filter(([, applies]) => applies)
    .map(([id]) => ({ id, label: RED_FLAG_LABELS[id as RedFlagId] }));

  if (redFlags.length > 0) {
    return {
      branch: "complication_risk",
      ruleVersion: SCORING_RULE_VERSION,
      classification: "diabetes_high",
      score: null,
      contributingFactors: redFlags,
      redFlags,
      urgentCareRecommended: input.redFlags.ketoacidosis_symptoms,
    };
  }

  const factors: ContributingFactor[] = [
    hba1cFactor(input.hba1cControl),
    glucoseEpisodeFactor(input.glucoseEpisodeFrequency),
    diabetesDurationFactor(input.diabetesDuration),
    bloodPressureFactor(input.bloodPressureControl),
    smokingFactor(input.smokingStatus),
    booleanFactor({
      id: "neuropathy_symptoms",
      label: "Neuropathy symptoms such as numbness, tingling, or sensation loss",
      applies: input.neuropathySymptoms,
      points: 2,
    }),
    booleanFactor({
      id: "retinopathy_symptoms",
      label: "Retinopathy symptoms such as blurred or impaired night vision",
      applies: input.retinopathySymptoms,
      points: 2,
    }),
    booleanFactor({
      id: "nephropathy_signals",
      label: "Nephropathy signals such as swelling, foamy urine, or fatigue",
      applies: input.nephropathySignals,
      points: 2,
    }),
    booleanFactor({
      id: "medication_adherence",
      label: "Difficulty taking medication as prescribed",
      applies: !input.medicationAdherence,
      points: 2,
    }),
    booleanFactor({
      id: "last_checkup",
      label: "Last checkup was more than 12 months ago",
      applies: input.lastCheckup === "over_12_months",
      points: 2,
    }),
  ];
  const score = totalPoints(factors);

  return {
    branch: "complication_risk",
    ruleVersion: SCORING_RULE_VERSION,
    classification: score >= BRANCH_B_HIGH_RISK_CUTOFF ? "diabetes_high" : "diabetes_low",
    score,
    contributingFactors: contributingFactors(factors),
    redFlags: [],
    urgentCareRecommended: false,
  };
}

function ageFactor(age: number): ContributingFactor {
  if (age < 45) {
    return { id: "age", label: "Age below 45", points: 0 };
  }

  if (age <= 54) {
    return { id: "age", label: "Age 45 to 54", points: 2 };
  }

  if (age <= 64) {
    return { id: "age", label: "Age 55 to 64", points: 3 };
  }

  return { id: "age", label: "Age over 64", points: 4 };
}

function bmiFactor(bmi: number): ContributingFactor {
  if (bmi < 25) {
    return { id: "bmi", label: "BMI below 25", points: 0 };
  }

  if (bmi <= 30) {
    return { id: "bmi", label: "BMI 25 to 30", points: 1 };
  }

  return { id: "bmi", label: "BMI over 30", points: 3 };
}

function waistCircumferenceFactor(
  sex: Sex,
  waistCircumferenceCm: number | "unknown",
): ContributingFactor {
  if (waistCircumferenceCm === "unknown") {
    return { id: "waist_circumference", label: "Waist circumference unknown", points: 0 };
  }

  if (sex === "male") {
    if (waistCircumferenceCm < 94) {
      return { id: "waist_circumference", label: "Waist circumference below 94 cm", points: 0 };
    }

    if (waistCircumferenceCm <= 102) {
      return { id: "waist_circumference", label: "Waist circumference 94 to 102 cm", points: 3 };
    }

    return { id: "waist_circumference", label: "Waist circumference over 102 cm", points: 4 };
  }

  if (waistCircumferenceCm < 80) {
    return { id: "waist_circumference", label: "Waist circumference below 80 cm", points: 0 };
  }

  if (waistCircumferenceCm <= 88) {
    return { id: "waist_circumference", label: "Waist circumference 80 to 88 cm", points: 3 };
  }

  return { id: "waist_circumference", label: "Waist circumference over 88 cm", points: 4 };
}

function familyHistoryFactor(familyHistory: FamilyHistory): ContributingFactor {
  if (familyHistory === "immediate") {
    return { id: "family_history", label: "Immediate family history of diabetes", points: 5 };
  }

  if (familyHistory === "extended") {
    return { id: "family_history", label: "Extended family history of diabetes", points: 3 };
  }

  return { id: "family_history", label: "No family history of diabetes", points: 0 };
}

function hba1cFactor(hba1cControl: HbA1cControl): ContributingFactor {
  if (hba1cControl === "known_elevated") {
    return { id: "hba1c_control", label: "Self-reported HbA1c is elevated", points: 3 };
  }

  if (hba1cControl === "unknown") {
    return { id: "hba1c_control", label: "HbA1c is unknown", points: 1 };
  }

  return { id: "hba1c_control", label: "Self-reported HbA1c is in range", points: 0 };
}

function glucoseEpisodeFactor(glucoseEpisodeFrequency: EpisodeFrequency): ContributingFactor {
  if (glucoseEpisodeFrequency === "weekly_or_more") {
    return { id: "glucose_episodes", label: "Hypo/hyperglycemic episodes weekly or more", points: 3 };
  }

  if (glucoseEpisodeFrequency === "monthly") {
    return { id: "glucose_episodes", label: "Hypo/hyperglycemic episodes monthly", points: 1 };
  }

  return { id: "glucose_episodes", label: "Hypo/hyperglycemic episodes are rare", points: 0 };
}

function diabetesDurationFactor(diabetesDuration: DiabetesDuration): ContributingFactor {
  if (diabetesDuration === "over_10_years") {
    return { id: "diabetes_duration", label: "Diabetes duration over 10 years", points: 2 };
  }

  if (diabetesDuration === "5_to_10_years") {
    return { id: "diabetes_duration", label: "Diabetes duration 5 to 10 years", points: 1 };
  }

  return { id: "diabetes_duration", label: "Diabetes duration under 5 years", points: 0 };
}

function bloodPressureFactor(bloodPressureControl: BloodPressureControl): ContributingFactor {
  if (bloodPressureControl === "uncontrolled") {
    return { id: "blood_pressure_control", label: "Blood pressure is uncontrolled", points: 2 };
  }

  if (bloodPressureControl === "unknown") {
    return { id: "blood_pressure_control", label: "Blood pressure control is unknown", points: 1 };
  }

  return { id: "blood_pressure_control", label: "Blood pressure is controlled", points: 0 };
}

function smokingFactor(smokingStatus: SmokingStatus): ContributingFactor {
  if (smokingStatus === "current_smoker") {
    return { id: "smoking_status", label: "Current smoker", points: 2 };
  }

  if (smokingStatus === "former_smoker") {
    return { id: "smoking_status", label: "Former smoker", points: 1 };
  }

  return { id: "smoking_status", label: "Non-smoker", points: 0 };
}

function booleanFactor({
  id,
  label,
  applies,
  points,
}: {
  id: string;
  label: string;
  applies: boolean;
  points: number;
}): ContributingFactor {
  return { id, label, points: applies ? points : 0 };
}

function totalPoints(factors: ContributingFactor[]): number {
  return factors.reduce((score, factor) => score + (factor.points ?? 0), 0);
}

function contributingFactors(factors: ContributingFactor[]): ContributingFactor[] {
  return factors.filter((factor) => (factor.points ?? 0) > 0);
}