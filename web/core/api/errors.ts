import axios from "axios";

interface ApiErrorEnvelope {
  error?: {
    message?: string;
  } | null;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const message = error.response?.data?.error?.message;
    if (message) {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
