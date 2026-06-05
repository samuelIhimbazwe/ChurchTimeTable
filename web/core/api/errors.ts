import axios from "axios";

interface ApiErrorEnvelope {
  error?: {
    message?: string;
    code?: string;
  } | null;
}

const TECHNICAL_PATTERNS = [
  /request failed with status code \d+/i,
  /network error/i,
  /timeout/i,
  /ECONNREFUSED/i,
  /ERR_/i,
];

export function getApiErrorMessage(error: unknown, fallback = "Unable to load information. Please try again later.") {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const message = error.response?.data?.error?.message;
    if (message && !TECHNICAL_PATTERNS.some((p) => p.test(message))) {
      return message;
    }

    if (error.response?.status) {
      return fallback;
    }

    if (error.message && !TECHNICAL_PATTERNS.some((p) => p.test(error.message))) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    if (!TECHNICAL_PATTERNS.some((p) => p.test(error.message))) {
      return error.message;
    }
  }

  return fallback;
}
