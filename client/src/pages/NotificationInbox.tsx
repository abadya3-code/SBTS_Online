import { useMemo, useState } from "react";
import { Archive, Bell, CheckCircle2, Clock3, ExternalLink, Filter, Inbox, Search, ShieldAlert, Undo2 } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const severityClass: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  info: "bg-cyan-50 text-cyan-700 ring-cyan-100",
};

export default function NotificationInbox() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const notificationsQuery = trpc.core.notifications.useQuery(undefined, { staleTime: 10_000 });
  const updateNotification = trpc.core.updateNotification.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.core.notifications.invalidate(), utils.core.auditTrail.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const notifications = notificationsQuery.data ?? [];
  const typeOptions = useMemo(() => Array.from(new Set(notifications.map(item => item.type))), [notifications]);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return notifications.filter(item => {
      const statusOk = statusFilter === "all" ? true : statusFilter === "active" ? item.status !== "Archived" : item.status === statusFilter;
      const typeOk = typeFilter === "all" || item.type === typeFilter;
      const textOk = !text || [item.title, item.message, item.type, item.relatedEntity, item.relatedId].join(" ").toLowerCase().includes(text);
      return statusOk && typeOk && textOk;
    });
  }, [notifications, query, statusFilter, typeFilter]);

  const kpis = [
    { label: "Unread", value: notifications.filter(item => item.status === "Unread").length, icon: Bell, tone: "text-cyan-700 bg-cyan-50" },
    { label: "Action Items", value: notifications.filter(item => item.type === "Approval" || item.type === "Action").length, icon: ShieldAlert, tone: "text-amber-700 bg-amber-50" },
    { label: "Archived", value: notifications.filter(item => item.status === "Archived").length, icon: Archive, tone: "text-slate-700 bg-slate-100" },
    { label: "Total Events", value: notifications.length, icon: Inbox, tone: "text-emerald-700 bg-emerald-50" },
  ];

  function applyAction(notificationId: string | number, action: "read" | "archive" | "restore") {
    updateNotification.mutate({ notificationId: String(notificationId), action });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operational Notification Center"
        title="Notification Inbox"
        description="Central inbox for approvals, certificate events, tag printing, workflow updates, and system messages."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map(item => {
          const Icon = item.icon;
          return <div key={item.label} className="sbts-card p-5"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}><Icon className="h-5 w-5" /></div><div className="text-3xl font-black text-slate-950">{item.value}</div><div className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">{item.label}</div></div>;
        })}
      </div>

      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Inbox Actions</h2>
            <p className="text-sm font-semibold text-slate-500">Mark read, archive, restore, or open the related operational page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notifications..." className="w-64 rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-cyan-400" /></div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><option value="active">Active</option><option value="Unread">Unread</option><option value="Read">Read</option><option value="Archived">Archived</option><option value="all">All</option></select>
            <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><option value="all">All Types</option>{typeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select>
            {(query || statusFilter !== "active" || typeFilter !== "all") && <button onClick={() => { setQuery(""); setStatusFilter("active"); setTypeFilter("all"); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-extrabold text-slate-700"><Filter className="h-4 w-4" /> Reset</button>}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {notificationsQuery.isLoading && <div className="p-8 text-sm font-bold text-slate-500">Loading inbox...</div>}
          {filtered.map(item => (
            <div key={String(item.id)} className={`grid gap-4 p-5 xl:grid-cols-[1fr_190px_260px] xl:items-center ${item.status === "Unread" ? "bg-cyan-50/25" : "bg-white"}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ring-1 ${severityClass[item.severity] ?? severityClass.info}`}>{item.type}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{item.status}</span>
                </div>
                <h3 className="mt-2 text-base font-black text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{item.message}</p>
                <div className="mt-2 text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm font-bold text-slate-500"><div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Related</div>{item.relatedEntity ?? "System"}<br />{item.relatedId ?? "—"}</div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                {item.actionUrl && <button onClick={() => { applyAction(item.id, "read"); setLocation(item.actionUrl!); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white"><ExternalLink className="h-4 w-4" /> Open</button>}
                {item.status === "Unread" && <button onClick={() => applyAction(item.id, "read")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700"><CheckCircle2 className="h-4 w-4" /> Read</button>}
                {item.status !== "Archived" ? <button onClick={() => applyAction(item.id, "archive")} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700"><Archive className="h-4 w-4" /> Archive</button> : <button onClick={() => applyAction(item.id, "restore")} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-extrabold text-cyan-700"><Undo2 className="h-4 w-4" /> Restore</button>}
              </div>
            </div>
          ))}
          {!notificationsQuery.isLoading && filtered.length === 0 && <div className="p-10 text-center"><Clock3 className="mx-auto h-10 w-10 text-slate-300" /><div className="mt-3 text-sm font-bold text-slate-500">No notifications match the current filter.</div></div>}
        </div>
      </section>
    </div>
  );
}
