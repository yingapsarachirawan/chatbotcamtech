import { getSessionId } from "../utils/session";

const ENQUIRY_API_URL =
  "https://xrloyjpmkcnumyglobtc.supabase.co/functions/v1/enquiry";

export async function submitEnquiry({
  name,
  email,
  phone,
  interestedProgram,
  message,
}) {
  const response = await fetch(ENQUIRY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: getSessionId(),
      name,
      email,
      phone,
      interestedProgram,
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to submit enquiry");
  }

  return data;
}

export async function getStudentEnquiry() {
  const sessionId = getSessionId();

  const response = await fetch(`${ENQUIRY_API_URL}?sessionId=${sessionId}`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load support conversation");
  }

  return data;
}

export async function sendStudentMessage(enquiryId, message) {
  const response = await fetch(ENQUIRY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "message",
      sessionId: getSessionId(),
      enquiryId,
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send message");
  }

  return data;
}