import { useMemo, useState } from "react";
import { Activity, ClipboardList, Filter, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";

const entityStyles: Record<string, string> = {
  Certificate: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Tag: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  Approval: "bg-amber-50 text-amber-700 ring-amber-100",
  Workflow: "bg-violet-50 text-violet-700 ring-violet-100",
  Notification: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function AuditTrail() {
  const auditQuery = trpc.core.auditTrail.useQuery(undefined, { staleTime: 10_000 });
  const [entityFilter, setEntityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const records = auditQuery.data ?? [];
  const entityOptions = useMemo(() => Array.from(new Set(records.map(item => item.entityType))), [records]);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return records.filter(item => {
      const entityOk = entityFilter === "all" || item.entityType === entityFilter;
      const textOk = !text || [item.entityType, item.entityId, item.action, item.summary, item.actorName, item.actorOpenId, item.projectId, item.blindId].join(" ").toLowerCase().includes(text);
      return entityOk && textOk;
    });
  }, [entityFilter, query, records]);
  const kpis = [
    { label: "Audit Events", value: records.length, icon: Activity, tone: "text-cyan-700 bg-cyan-50" },
    { label: "Certificate Events", value: records.filter(item => item.entityType === "Certificate").length, icon: ClipboardList, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Tag Events", value: records.filter(item => item.entityType === "Tag").length, icon: ShieldCheck, tone: "text-amber-700 bg-amber-50" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Certificate & Tag Traceability" title="Audit Trail" description="System trail for certificate issuance/printing, QR tag printing, workflow gates, approvals, and notification actions." />
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map(item => { const Icon = item.icon; return <div key={item.label} className="sbts-card p-5"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}><Icon className="h-5 w-5" /></div><div className="text-3xl font-black text-slate-950">{item.value}</div><div className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">{item.label}</div></div>; })}
      </div>
      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-extrabold text-slate-950">Operational Audit Register</h2><p className="text-sm font-semibold text-slate-500">Trace who did what, when, and against which project/blind.</p></div>
          <div className="flex flex-wrap gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search audit..." className="w-64 rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-cyan-400" /></div><select value={entityFilter} onChange={event => setEntityFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><option value="all">All Entities</option>{entityOptions.map(entity => <option key={entity} value={entity}>{entity}</option>)}</select>{(query || entityFilter !== "all") && <button onClick={() => { setQuery(""); setEntityFilter("all"); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-extrabold text-slate-700"><Filter className="h-4 w-4" /> Reset</button>}</div>
        </div>
        <div className="divide-y divide-slate-100">
          {auditQuery.isLoading && <div className="p-8 text-sm font-bold text-slate-500">Loading audit trail...</div>}
          {filtered.map(item => <div key={String(item.id)} className="grid gap-4 p-5 xl:grid-cols-[220px_1fr_260px] xl:items-center"><div><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${entityStyles[item.entityType] ?? entityStyles.Notification}`}>{item.entityType}</span><div className="mt-2 text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleString()}</div></div><div><h3 className="text-base font-black text-slate-950">{item.action}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{item.summary}</p><div className="mt-2 text-xs font-bold text-slate-400">Entity: {item.entityId} {item.projectId ? ` / Project: ${item.projectId}` : ""} {item.blindId ? ` / Blind: ${item.blindId}` : ""}</div></div><div className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Actor</div><div className="mt-1 font-extrabold text-slate-900">{item.actorName ?? item.actorOpenId ?? "System"}</div><div className="text-xs font-bold text-slate-500">{item.actorRoleKey ?? "—"}</div></div></div>)}
          {!auditQuery.isLoading && filtered.length === 0 && <div className="p-10 text-center text-sm font-bold text-slate-500">No audit events match the current filter.</div>}
        </div>
      </section>
    </div>
  );
}
