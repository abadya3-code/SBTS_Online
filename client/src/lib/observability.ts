import * as Sentry from "@sentry/react";

type ClientErrorLevel = "info" | "warning" | "error";

type ClientErrorPayload = {
  message: string;
  level: ClientErrorLevel;
  source: string;
  url: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

let initialized = false;

function getRelease() {
  return import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_SBTS_APP_VERSION || "sbts-local";
}

export function initClientObservability() {
  if (initialized) return;
  initialized = true;

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      release: getRelease(),
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    });
  }

  window.addEventListener("error", event => {
    captureClientError(event.error ?? event.message, {
      source: "window.error",
      metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener("unhandledrejection", event => {
    captureClientError(event.reason, {
      source: "window.unhandledrejection",
    });
  });
}

export function captureClientError(
  error: unknown,
  options?: { source?: string; level?: ClientErrorLevel; metadata?: Record<string, unknown> }
) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown client error");
  const stack = error instanceof Error ? error.stack : undefined;
  const payload: ClientErrorPayload = {
    message,
    stack,
    level: options?.level ?? "error",
    source: options?.source ?? "client",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    metadata: options?.metadata,
    createdAt: new Date().toISOString(),
  };

  if (import.meta.env.VITE_SENTRY_DSN) {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: payload });
    } else {
      Sentry.captureMessage(message, { level: payload.level, extra: payload });
    }
  }

  sendClientError(payload);
}

function sendClientError(payload: ClientErrorPayload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/client-error", blob);
      return;
    }
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "include",
      keepalive: true,
    });
  } catch (sendError) {
    console.error("[SBTS Observability] Failed to send client error", sendError);
  }
}
