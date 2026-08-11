"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";

type AssessmentRowProps = {
  classification: string;
  diabetesStatus: string;
  flagged: boolean;
  href: string;
  referenceCode: string;
  ruleVersion: string;
  score: string;
  submittedAt: string;
};

export function AssessmentRow({
  classification,
  diabetesStatus,
  flagged,
  href,
  referenceCode,
  ruleVersion,
  score,
  submittedAt,
}: AssessmentRowProps) {
  const router = useRouter();

  function openAssessment() {
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAssessment();
    }
  }

  return (
    <tr
      className={`${flagged ? "flaggedRow" : ""} clickableRow`}
      onClick={openAssessment}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Open assessment ${referenceCode} submitted ${submittedAt}`}
    >
      <td>
        {flagged ? (
          <span className="flagBadge" aria-label="Diabetes high-risk follow-up">
            FLAG
          </span>
        ) : (
          <span className="mutedText">-</span>
        )}
      </td>
      <td>
        <span className="rowLinkText">{submittedAt}</span>
      </td>
      <td>{referenceCode}</td>
      <td>{diabetesStatus}</td>
      <td>{classification}</td>
      <td>{score}</td>
      <td>{ruleVersion}</td>
    </tr>
  );
}