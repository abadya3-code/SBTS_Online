import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Clock3, Database, Gauge, RefreshCw, ShieldAlert, ShieldCheck, Wifi } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper: string;
  tone?: "good" | "warn" | "bad" | "neutral";
};

function metricToneClass(tone: MetricCardProps["tone"] = "neutral") {
  switch (tone) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200";
    case "bad":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-200";
    default:
      return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
  }
}

function MetricCard({ label, value, helper, tone }: MetricCardProps) {
  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-sm ${metricToneClass(tone)}`}>
      <div className="text-xs font-black uppercase tracking-[0.22em] opacity-70">{label}</div>
      <div className="mt-3 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm font-semibold opacity-75">{helper}</div>
    </div>
  );
}

export default function PerformanceMonitoring() {
  const monitoringQuery = trpc.core.performanceMonitoring.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const data = monitoringQuery.data;
  const runtime = data?.runtime;
  const database = data?.database;
  const persistence = data?.persistence;
  const slowRoutes = runtime?.slowRoutes ?? [];
  const recentErrors = runtime?.recentErrors ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
              <Gauge className="h-4 w-4" /> Observability
            </div>
            <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Performance Monitoring Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500 dark:text-slate-400">
              Admin-only runtime view for API health, database state, Sentry readiness, recent errors, slow routes, and security events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => monitoringQuery.refetch()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${monitoringQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </section>

      {monitoringQuery.isLoading && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          Loading monitoring snapshot...
        </div>
      )}

      {monitoringQuery.error && (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-200">
          {monitoringQuery.error.message}
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Database"
              value={database?.databaseAvailable ? "Connected" : "Unavailable"}
              helper={`Schema: ${persistence?.schemaVersion ?? "unknown"}`}
              tone={database?.databaseAvailable ? "good" : "bad"}
            />
            <MetricCard
              label="Sentry"
              value={runtime?.sentryEnabled ? "Enabled" : "Not set"}
              helper={runtime?.sentryEnabled ? runtime.release : "Add SENTRY_DSN variables"}
              tone={runtime?.sentryEnabled ? "good" : "warn"}
            />
            <MetricCard
              label="API Errors"
              value={runtime?.totalErrors ?? 0}
              helper={`Error rate ${runtime?.errorRatePercent ?? 0}%`}
              tone={(runtime?.totalErrors ?? 0) > 0 ? "warn" : "good"}
            />
            <MetricCard
              label="Security Events"
              value={database?.securityEventsLast24h ?? 0}
              helper={`${database?.forbiddenEventsLast24h ?? 0} denied/forbidden attempts`}
              tone={(database?.criticalSecurityEventsLast24h ?? 0) > 0 ? "bad" : "neutral"}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <Clock3 className="h-5 w-5 text-cyan-600" /> Slow Routes
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <tr>
                      <th className="py-3">Route</th>
                      <th className="py-3">Method</th>
                      <th className="py-3">Count</th>
                      <th className="py-3">Avg ms</th>
                      <th className="py-3">Max ms</th>
                      <th className="py-3">Errors</th>
                      <th className="py-3">Last</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {slowRoutes.length === 0 && (
                      <tr><td colSpan={7} className="py-6 text-slate-500">No API traffic recorded yet.</td></tr>
                    )}
                    {slowRoutes.map(route => (
                      <tr key={`${route.method}-${route.route}`} className="font-semibold text-slate-700 dark:text-slate-200">
                        <td className="py-3">{route.route}</td>
                        <td className="py-3">{route.method}</td>
                        <td className="py-3">{route.count}</td>
                        <td className="py-3">{route.avgMs}</td>
                        <td className="py-3">{route.maxMs}</td>
                        <td className="py-3">{route.errorCount}</td>
                        <td className="py-3">{new Date(route.lastAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Recent Errors
              </div>
              <div className="space-y-3">
                {recentErrors.length === 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                    No runtime errors captured since server start.
                  </div>
                )}
                {recentErrors.slice(0, 8).map(error => (
                  <div key={error.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">{error.type}</span>
                      <span className="text-xs font-bold text-slate-400">{new Date(error.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{error.message}</div>
                    {error.route && <div className="mt-1 text-xs font-semibold text-slate-500">{error.route}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <ShieldAlert className="h-5 w-5 text-rose-500" /> Latest Security Events
              </div>
              <div className="space-y-3">
                {(database?.lastSecurityEvents ?? []).slice(0, 8).map(event => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      <span>{event.eventType}</span><span>{event.severity}</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{event.summary}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{new Date(event.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {(database?.lastSecurityEvents ?? []).length === 0 && <div className="text-sm font-semibold text-slate-500">No security events available.</div>}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <Database className="h-5 w-5 text-cyan-600" /> Persistence Events
              </div>
              <div className="space-y-3">
                {(database?.lastPersistenceEvents ?? []).slice(0, 8).map(event => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      <span>{event.domain}</span><span>{event.status}</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{event.summary}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{new Date(event.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {(database?.lastPersistenceEvents ?? []).length === 0 && <div className="text-sm font-semibold text-slate-500">No persistence events available.</div>}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-white/10"><Wifi className="h-4 w-4" /> Runtime since {new Date(runtime?.bootedAt ?? data.generatedAt).toLocaleString()}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-white/10"><Activity className="h-4 w-4" /> Requests {runtime?.totalRequests ?? 0}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-white/10"><ShieldCheck className="h-4 w-4" /> Environment {runtime?.environment}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
