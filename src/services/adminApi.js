import { supabase } from "../lib/supabaseClient";

const ADMIN_API_URL =
  "https://xrloyjpmkcnumyglobtc.supabase.co/functions/v1/admin";

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}

async function adminRequest(url, options = {}) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Admin request failed.");
  }

  return data;
}

export async function getAdminInbox() {
  return adminRequest(ADMIN_API_URL, {
    method: "GET",
  });
}

export async function getEnquiryDetail(enquiryId) {
  return adminRequest(`${ADMIN_API_URL}?id=${enquiryId}`, {
    method: "GET",
  });
}

export async function sendAdminReply(enquiryId, message) {
  return adminRequest(ADMIN_API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "reply",
      enquiryId,
      message,
    }),
  });
}

export async function updateEnquiryStatus(enquiryId, status) {
  return adminRequest(ADMIN_API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "status",
      enquiryId,
      status,
    }),
  });
}