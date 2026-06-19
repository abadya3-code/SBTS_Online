import type { NextFunction, Request, Response } from "express";
import { recordSecurityEvent } from "../db";

type SentryNodeApi = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, context?: Record<string, unknown>) => string;
  setTag?: (key: string, value: string) => void;
};

type RuntimeRouteMetric = {
  route: string;
  method: string;
  count: number;
  errorCount: number;
  totalMs: number;
  maxMs: number;
  lastStatus: number;
  lastAt: string;
};

type RuntimeErrorEvent = {
  id: string;
  type: "server" | "client" | "trpc";
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  route?: string;
  statusCode?: number;
  createdAt: string;
};

const MAX_RECENT_ERRORS = 50;
const routeMetrics = new Map<string, RuntimeRouteMetric>();
const recentErrors: RuntimeErrorEvent[] = [];
const bootedAt = new Date().toISOString();
let sentry: SentryNodeApi | null = null;
let sentryEnabled = false;

function getRelease() {
  return process.env.SENTRY_RELEASE || process.env.SBTS_APP_VERSION || "sbts-local";
}

export async function initServerObservability() {
  if (!process.env.SENTRY_DSN || sentryEnabled) return;
  try {
    const module = (await import("@sentry/node")) as SentryNodeApi;
    module.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
      release: getRelease(),
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    module.setTag?.("app", "SBTS");
    module.setTag?.("sprint", "17.10");
    sentry = module;
    sentryEnabled = true;
  } catch (error) {
    console.warn("[Observability] Sentry server initialization skipped:", error);
  }
}

function routeKey(req: Request) {
  const rawPath = req.path || req.originalUrl || "/";
  if (rawPath.startsWith("/api/trpc")) return "/api/trpc";
  if (rawPath.startsWith("/api/client-error")) return "/api/client-error";
  if (rawPath.startsWith("/api/health")) return "/api/health";
  return rawPath.split("?")[0] || "/";
}

function pushError(event: RuntimeErrorEvent) {
  recentErrors.unshift(event);
  if (recentErrors.length > MAX_RECENT_ERRORS) recentErrors.pop();
}

export function recordRuntimeError(input: Omit<RuntimeErrorEvent, "id" | "createdAt">) {
  pushError({
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input,
  });
}

export function captureServerException(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  sentry?.captureException(error, { extra: context });
  recordRuntimeError({
    type: "server",
    severity: "error",
    message,
    route: typeof context?.route === "string" ? context.route : undefined,
  });
}

export function captureTrpcError(input: {
  path?: string;
  type?: string;
  error: unknown;
  userOpenId?: string | null;
}) {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  sentry?.captureException(input.error, {
    tags: { source: "trpc", path: input.path ?? "unknown" },
    extra: { type: input.type, userOpenId: input.userOpenId ?? null },
  });
  recordRuntimeError({
    type: "trpc",
    severity: "error",
    message,
    route: input.path,
  });
}

export function captureClientErrorPayload(payload: unknown, req: Request) {
  const data = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const message = typeof data.message === "string" ? data.message : "Client error captured";
  const severity = data.level === "warning" ? "warning" : "error";
  const route = typeof data.url === "string" ? data.url : req.headers.referer;

  sentry?.captureMessage(message, {
    level: severity,
    tags: { source: "client" },
    extra: {
      payload: data,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? null,
    },
  });

  recordRuntimeError({
    type: "client",
    severity,
    message,
    route,
  });
}

export function observabilityRequestMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = performance.now();
  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const key = `${req.method} ${routeKey(req)}`;
    const current = routeMetrics.get(key) ?? {
      route: routeKey(req),
      method: req.method,
      count: 0,
      errorCount: 0,
      totalMs: 0,
      maxMs: 0,
      lastStatus: res.statusCode,
      lastAt: new Date().toISOString(),
    };
    current.count += 1;
    current.totalMs += durationMs;
    current.maxMs = Math.max(current.maxMs, durationMs);
    current.lastStatus = res.statusCode;
    current.lastAt = new Date().toISOString();
    if (res.statusCode >= 400) current.errorCount += 1;
    routeMetrics.set(key, current);

    if (res.statusCode >= 500) {
      recordRuntimeError({
        type: "server",
        severity: "error",
        message: `HTTP ${res.statusCode} on ${key}`,
        route: key,
        statusCode: res.statusCode,
      });
    }
  });
  next();
}

export function observabilityErrorMiddleware(error: unknown, req: Request, _res: Response, next: NextFunction) {
  captureServerException(error, {
    route: `${req.method} ${routeKey(req)}`,
    userAgent: req.headers["user-agent"] ?? null,
  });
  next(error);
}

export function getRuntimeMonitoringSnapshot() {
  const routes = Array.from(routeMetrics.values())
    .map(metric => ({
      ...metric,
      avgMs: metric.count ? Math.round(metric.totalMs / metric.count) : 0,
    }))
    .sort((a, b) => b.avgMs - a.avgMs);

  const totalRequests = routes.reduce((sum, route) => sum + route.count, 0);
  const totalErrors = routes.reduce((sum, route) => sum + route.errorCount, 0);

  return {
    bootedAt,
    sentryEnabled,
    release: getRelease(),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    generatedAt: new Date().toISOString(),
    totalRequests,
    totalErrors,
    errorRatePercent: totalRequests ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0,
    slowRoutes: routes.slice(0, 10),
    recentErrors,
  };
}

export async function recordForbiddenAccess(input: {
  eventType: string;
  summary: string;
  actorOpenId?: string | null;
  roleKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await recordSecurityEvent({
    eventType: input.eventType,
    severity: "warning",
    actorOpenId: input.actorOpenId ?? null,
    roleKey: input.roleKey ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });
}
