"use client";

import { FormEvent, useState } from "react";

import { nonDiagnosticDisclaimer, resultContent } from "./result-content";
import type { Classification } from "@/lib/scoring";

type DiabetesStatus = "not_diagnosed" | "diagnosed";
type FieldValue = string | number | boolean;
type Responses = Record<string, FieldValue>;

type SubmissionResult = {
  assessmentId: string;
  result: {
    classification: Classification;
    score: number | null;
    contributingFactors: Array<{ id: string; label: string; points?: number }>;
    urgentCareRecommended: boolean;
  };
};

const notDiagnosedDefaults: Responses = {
  age: "",
  heightCm: "",
  weightKg: "",
  sex: "",
  waistCircumferenceCm: "",
  dailyPhysicalActivity: "",
  dailyFruitOrVegetableIntake: "",
  historyOfBloodPressureMedication: "",
  historyOfHighBloodGlucose: "",
  familyHistory: "",
};

const diagnosedDefaults: Responses = {
  foot_wound_or_ulcer: "",
  sudden_vision_loss_or_blurring: "",
  ketoacidosis_symptoms: "",
  chest_pain_or_shortness_of_breath: "",
  hba1cControl: "",
  glucoseEpisodeFrequency: "",
  diabetesDuration: "",
  bloodPressureControl: "",
  smokingStatus: "",
  neuropathySymptoms: "",
  retinopathySymptoms: "",
  nephropathySignals: "",
  medicationAdherence: "",
  lastCheckup: "",
};

export function QuestionnaireForm() {
  const [diabetesStatus, setDiabetesStatus] = useState<DiabetesStatus>("not_diagnosed");
  const [responses, setResponses] = useState<Responses>(notDiagnosedDefaults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  function selectBranch(nextStatus: DiabetesStatus) {
    setDiabetesStatus(nextStatus);
    setResponses(nextStatus === "not_diagnosed" ? notDiagnosedDefaults : diagnosedDefaults);
    setSubmissionResult(null);
    setErrors([]);
  }

  function updateResponse(key: string, value: FieldValue) {
    setResponses((currentResponses) => ({ ...currentResponses, [key]: value }));
  }

  async function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    setSubmissionResult(null);

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diabetesStatus, responses: normalizeResponses(responses) }),
      });
      const body = await response.json();

      if (!response.ok) {
        setErrors(Array.isArray(body.errors) ? body.errors : ["Assessment could not be submitted."]);
        return;
      }

      setSubmissionResult(body);
    } catch {
      setErrors(["Assessment could not be submitted. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="questionnaire-title">
      <div className="panelHeader">
        <p className="eyebrow">Diabetes risk triage</p>
        <h1 id="questionnaire-title">Custodia screening</h1>
      </div>

      <div className="segmentedControl" aria-label="Diabetes diagnosis status">
        <button
          type="button"
          className={diabetesStatus === "not_diagnosed" ? "active" : ""}
          onClick={() => selectBranch("not_diagnosed")}
        >
          I have not / I am not sure
        </button>
        <button
          type="button"
          className={diabetesStatus === "diagnosed" ? "active" : ""}
          onClick={() => selectBranch("diagnosed")}
        >
          I have been diagnosed
        </button>
      </div>

      <form onSubmit={submitAssessment} className="questionnaireForm">
        {diabetesStatus === "not_diagnosed" ? (
          <NotDiagnosedQuestions responses={responses} updateResponse={updateResponse} />
        ) : (
          <DiagnosedQuestions responses={responses} updateResponse={updateResponse} />
        )}

        {errors.length > 0 ? (
          <div className="errorBox" role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <button type="submit" className="submitButton" disabled={isSubmitting}>
          {isSubmitting ? "Scoring..." : "Submit assessment"}
        </button>
      </form>

      {submissionResult ? <ResultSummary submissionResult={submissionResult} /> : null}

      {submissionResult ? null : <p className="disclaimer">{nonDiagnosticDisclaimer}</p>}
    </section>
  );
}

function NotDiagnosedQuestions({
  responses,
  updateResponse,
}: {
  responses: Responses;
  updateResponse: (key: string, value: FieldValue) => void;
}) {
  return (
    <div className="questionGrid">
      <NumberField label="Age" id="age" value={responses.age} onChange={updateResponse} />
      <NumberField label="Height (cm)" id="heightCm" value={responses.heightCm} onChange={updateResponse} />
      <NumberField label="Weight (kg)" id="weightKg" value={responses.weightKg} onChange={updateResponse} />
      <SelectField
        label="Sex"
        id="sex"
        value={responses.sex}
        onChange={updateResponse}
        options={[
          ["male", "Male"],
          ["female", "Female"],
        ]}
      />
      <SelectField
        label="Waist circumference"
        id="waistCircumferenceCm"
        value={responses.waistCircumferenceCm}
        onChange={updateResponse}
        options={[
          ["unknown", "I don't know"],
          ["70", "70 cm"],
          ["80", "80 cm"],
          ["88", "88 cm"],
          ["94", "94 cm"],
          ["102", "102 cm"],
          ["110", "110 cm"],
        ]}
      />
      <YesNoField
        label="Do you get at least 30 minutes of physical activity daily?"
        id="dailyPhysicalActivity"
        value={responses.dailyPhysicalActivity}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you eat fruit or vegetables daily?"
        id="dailyFruitOrVegetableIntake"
        value={responses.dailyFruitOrVegetableIntake}
        onChange={updateResponse}
      />
      <YesNoField
        label="Have you ever taken blood pressure medication?"
        id="historyOfBloodPressureMedication"
        value={responses.historyOfBloodPressureMedication}
        onChange={updateResponse}
      />
      <YesNoField
        label="Have you ever had high blood glucose?"
        id="historyOfHighBloodGlucose"
        value={responses.historyOfHighBloodGlucose}
        onChange={updateResponse}
      />
      <SelectField
        label="Family history of diabetes"
        id="familyHistory"
        value={responses.familyHistory}
        onChange={updateResponse}
        options={[
          ["none", "No family history"],
          ["extended", "Grandparent, aunt, uncle, or cousin"],
          ["immediate", "Parent, sibling, or child"],
        ]}
      />
    </div>
  );
}

function DiagnosedQuestions({
  responses,
  updateResponse,
}: {
  responses: Responses;
  updateResponse: (key: string, value: FieldValue) => void;
}) {
  return (
    <div className="questionGrid">
      <YesNoField
        label="Do you currently have an unhealed foot wound or ulcer?"
        id="foot_wound_or_ulcer"
        value={responses.foot_wound_or_ulcer}
        onChange={updateResponse}
      />
      <YesNoField
        label="Have you had sudden vision loss or blurring?"
        id="sudden_vision_loss_or_blurring"
        value={responses.sudden_vision_loss_or_blurring}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you have nausea, vomiting, rapid breathing, or confusion?"
        id="ketoacidosis_symptoms"
        value={responses.ketoacidosis_symptoms}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you have chest pain or shortness of breath?"
        id="chest_pain_or_shortness_of_breath"
        value={responses.chest_pain_or_shortness_of_breath}
        onChange={updateResponse}
      />
      <SelectField
        label="HbA1c control"
        id="hba1cControl"
        value={responses.hba1cControl}
        onChange={updateResponse}
        options={[
          ["known_good", "Known and in range"],
          ["known_elevated", "Known and elevated"],
          ["unknown", "I don't know"],
        ]}
      />
      <SelectField
        label="Hypo/hyperglycemic episodes"
        id="glucoseEpisodeFrequency"
        value={responses.glucoseEpisodeFrequency}
        onChange={updateResponse}
        options={[
          ["rare", "Rare"],
          ["monthly", "Monthly"],
          ["weekly_or_more", "Weekly or more"],
        ]}
      />
      <SelectField
        label="Duration of diabetes"
        id="diabetesDuration"
        value={responses.diabetesDuration}
        onChange={updateResponse}
        options={[
          ["under_5_years", "Under 5 years"],
          ["5_to_10_years", "5 to 10 years"],
          ["over_10_years", "Over 10 years"],
        ]}
      />
      <SelectField
        label="Blood pressure control"
        id="bloodPressureControl"
        value={responses.bloodPressureControl}
        onChange={updateResponse}
        options={[
          ["controlled", "Controlled"],
          ["uncontrolled", "Uncontrolled"],
          ["unknown", "I don't know"],
        ]}
      />
      <SelectField
        label="Smoking status"
        id="smokingStatus"
        value={responses.smokingStatus}
        onChange={updateResponse}
        options={[
          ["non_smoker", "Non-smoker"],
          ["former_smoker", "Former smoker"],
          ["current_smoker", "Current smoker"],
        ]}
      />
      <YesNoField
        label="Do you have numbness, tingling, or loss of sensation?"
        id="neuropathySymptoms"
        value={responses.neuropathySymptoms}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you have blurred vision or night vision issues?"
        id="retinopathySymptoms"
        value={responses.retinopathySymptoms}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you have swelling, foamy urine, or unusual fatigue?"
        id="nephropathySignals"
        value={responses.nephropathySignals}
        onChange={updateResponse}
      />
      <YesNoField
        label="Do you take medication as prescribed?"
        id="medicationAdherence"
        value={responses.medicationAdherence}
        onChange={updateResponse}
      />
      <SelectField
        label="Last diabetes checkup"
        id="lastCheckup"
        value={responses.lastCheckup}
        onChange={updateResponse}
        options={[
          ["within_12_months", "Within 12 months"],
          ["over_12_months", "More than 12 months ago"],
        ]}
      />
    </div>
  );
}

function NumberField({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: FieldValue;
  onChange: (key: string, value: FieldValue) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        required
        min="1"
        type="number"
        value={String(value)}
        onChange={(event) => onChange(id, event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  id,
  value,
  options,
  onChange,
}: {
  label: string;
  id: string;
  value: FieldValue;
  options: Array<[string, string]>;
  onChange: (key: string, value: FieldValue) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select required value={String(value)} onChange={(event) => onChange(id, event.target.value)}>
        <option value="">Select one</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function YesNoField({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: FieldValue;
  onChange: (key: string, value: FieldValue) => void;
}) {
  return (
    <fieldset className="field radioField">
      <legend>{label}</legend>
      <label>
        <input
          required
          type="radio"
          name={id}
          checked={value === true}
          onChange={() => onChange(id, true)}
        />
        Yes
      </label>
      <label>
        <input
          required
          type="radio"
          name={id}
          checked={value === false}
          onChange={() => onChange(id, false)}
        />
        No
      </label>
    </fieldset>
  );
}

function ResultSummary({ submissionResult }: { submissionResult: SubmissionResult }) {
  const { result } = submissionResult;
  const content = resultContent[result.classification];
  const showContributingFactors =
    result.classification === "no_diabetes_high" && result.contributingFactors.length > 0;

  return (
    <section className={`resultPanel resultPanel-${result.classification}`} aria-live="polite">
      <div className="resultHeader">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p>{content.summary}</p>
        <p className="scoreLine">
          {result.score === null ? "Triggered by a red-flag response" : `Score: ${result.score}`}
        </p>
      </div>

      {result.urgentCareRecommended ? <p className="urgent">Please seek urgent clinical care now.</p> : null}

      {showContributingFactors ? (
        <div className="factorBox">
          <h3>Why this result appeared</h3>
          <ul>
            {result.contributingFactors.map((factor) => (
              <li key={factor.id}>{factor.label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="tipsBlock">
        <h3>Next steps</h3>
        <ul>
          {content.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {content.actionHref && content.actionLabel ? (
        <a className="resultAction" href={content.actionHref} target={content.actionHref.startsWith("http") ? "_blank" : undefined}>
          {content.actionLabel}
        </a>
      ) : content.actionLabel ? (
        <p className="resultCallout">{content.actionLabel}</p>
      ) : null}

      <a className="jsonLink" href={`/api/assessments/${submissionResult.assessmentId}/result`}>
        View saved result JSON
      </a>

      <p className="disclaimer resultDisclaimer">{nonDiagnosticDisclaimer}</p>
    </section>
  );
}

function normalizeResponses(responses: Responses): Responses {
  return Object.fromEntries(
    Object.entries(responses).map(([key, value]) => {
      if (key === "age" || key === "heightCm" || key === "weightKg") {
        return [key, Number(value)];
      }

      if (key === "waistCircumferenceCm" && value !== "unknown") {
        return [key, Number(value)];
      }

      return [key, value];
    }),
  );
}
