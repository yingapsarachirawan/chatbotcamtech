import {
  GraduationCap,
  Wallet,
  CalendarDays,
  Phone,
  FileQuestion,
  Sparkles,
} from "lucide-react";

export const quickQuestions = [
  {
    label: "Admission Requirements",
    description: "Documents and application process",
    icon: GraduationCap,
  },
  {
    label: "Tuition Fee",
    description: "School fee and payment information",
    icon: Wallet,
  },
  {
    label: "Scholarship",
    description: "Scholarship eligibility and deadlines",
    icon: Sparkles,
  },
  {
    label: "Class Schedule",
    description: "Study time and timetable information",
    icon: CalendarDays,
  },
  {
    label: "Contact Office",
    description: "Phone, email, and office support",
    icon: Phone,
  },
  {
    label: "General FAQ",
    description: "Common school questions",
    icon: FileQuestion,
  },
];

export const chatHistory = [
  "Admission requirements",
  "Tuition fee information",
  "Scholarship details",
  "Class schedule",
];