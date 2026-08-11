import type { Classification } from "@/lib/scoring";

export const nonDiagnosticDisclaimer = "This tool does not diagnose. It estimates risk based on your answers.";

export type ResultContent = {
  eyebrow: string;
  title: string;
  summary: string;
  actionLabel?: string;
  actionHref?: string;
  tips: string[];
};

export const resultContent: Record<Classification, ResultContent> = {
  no_diabetes_low: {
    eyebrow: "Lower diabetes risk",
    title: "Your answers suggest a lower risk right now",
    summary:
      "Keep reinforcing the habits that protect your long-term metabolic health, and repeat screening periodically as your circumstances change.",
    tips: [
      "Keep meals centered on vegetables, legumes, whole grains, and unsweetened drinks.",
      "Aim for at least 30 minutes of physical activity on most days.",
      "Maintain a healthy weight and waist circumference where possible.",
      "Re-screen in 12 months, or sooner if a clinician advises it.",
    ],
  },
  no_diabetes_high: {
    eyebrow: "Higher diabetes risk",
    title: "Please arrange clinical screening",
    summary:
      "Your answers suggest elevated diabetes risk. A hospital, clinic, or pharmacy can check your blood glucose and advise you on next steps.",
    actionLabel: "Plan a clinical screening visit",
    tips: [
      "Ask for a blood glucose or HbA1c test rather than relying on symptoms alone.",
      "Take note of any family history, previous high glucose readings, or blood pressure medication before the visit.",
      "Keep up daily movement and balanced meals while you arrange screening.",
    ],
  },
  diabetes_low: {
    eyebrow: "Lower complication risk",
    title: "Your answers suggest lower complication risk right now",
    summary:
      "Keep following your diabetes care routine and stay connected with routine checkups so changes are caught early.",
    tips: [
      "Take medication as prescribed and speak with a clinician before making changes.",
      "Monitor glucose according to your care plan, especially when unwell or changing routines.",
      "Protect your feet, eyes, kidneys, and blood pressure through routine checks.",
      "Keep meals steady and prioritize daily activity that fits your health status.",
    ],
  },
  diabetes_high: {
    eyebrow: "Higher complication risk",
    title: "A nurse should review your answers",
    summary:
      "Your answers suggest you may need timely support for diabetes-related symptoms or complication risk.",
    actionLabel: "Chat with a nurse on WhatsApp",
    actionHref: "https://wa.me/?text=Hello%2C%20I%20completed%20the%20Custodia%20diabetes%20screening%20and%20my%20result%20said%20I%20should%20chat%20with%20a%20nurse.",
    tips: [
      "Keep taking prescribed medication unless a clinician tells you otherwise.",
      "Seek urgent care now for chest pain, shortness of breath, sudden vision changes, confusion, rapid breathing, or persistent vomiting.",
      "Have your recent symptoms, medication list, and last checkup date ready for the nurse.",
    ],
  },
};