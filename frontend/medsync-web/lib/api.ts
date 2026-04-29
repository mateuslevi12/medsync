import { getGatewayUrl, getToken } from "./session";

export interface ApiErrorShape {
  status?: number;
  statusText?: string;
  path?: string;
  message: string;
  details: string[];
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  auth?: boolean;
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface RequestError extends Error {
  status: number;
  statusText: string;
  path: string;
  data: unknown;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const gateway = getGatewayUrl();
  const url = `${gateway}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (options.auth !== false) {
    const token = options.token || getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const rawText = await response.text();
  let parsedData: unknown = null;

  if (rawText) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = { raw: rawText };
    }
  }

  if (!response.ok) {
    const error = new Error("Request failed") as RequestError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.path = path;
    error.data = parsedData;
    throw error;
  }

  return parsedData as T;
}

export function parseApiError(error: unknown): ApiErrorShape {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    const typedError = error as RequestError;
    const data =
      typedError.data && typeof typedError.data === "object"
        ? (typedError.data as {
            message?: string;
            path?: string;
            details?: string[];
          })
        : {};

    return {
      status: typedError.status,
      statusText: typedError.statusText,
      path: typedError.path || data.path || "",
      message: data.message || typedError.statusText || "Erro na API",
      details: Array.isArray(data.details) ? data.details : []
    };
  }

  return {
    message: error instanceof Error ? error.message : "Erro inesperado",
    details: []
  };
}
