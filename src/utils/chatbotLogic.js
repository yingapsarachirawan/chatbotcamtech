import { sampleAnswers } from "../data/chatbotData";

export function getBotReply(question) {
  const text = question.toLowerCase();

  if (
    text.includes("admission") ||
    text.includes("apply") ||
    text.includes("requirement") ||
    text.includes("document")
  ) {
    return sampleAnswers.admission;
  }

  if (
    text.includes("tuition") ||
    text.includes("fee") ||
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("payment")
  ) {
    return sampleAnswers.tuition;
  }

  if (text.includes("scholarship")) {
    return sampleAnswers.scholarship;
  }

  if (
    text.includes("schedule") ||
    text.includes("class") ||
    text.includes("time") ||
    text.includes("timetable")
  ) {
    return sampleAnswers.schedule;
  }

  if (
    text.includes("contact") ||
    text.includes("office") ||
    text.includes("phone") ||
    text.includes("email")
  ) {
    return sampleAnswers.contact;
  }

  return sampleAnswers.fallback;
}