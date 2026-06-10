import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Filter, Inbox, Search, ShieldCheck, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  Approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 ring-rose-200",
};

type ApprovalDecision = "Approved" | "Rejected";

type ActionState = {
  approvalId: string;
  tagNo: string;
  decision: ApprovalDecision;
};

export default function ApprovalCenter() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const approvalsQuery = trpc.core.approvalCenter.useQuery(undefined, { staleTime: 10_000 });
  const pendingQuery = trpc.core.pendingApprovals.useQuery(undefined, { staleTime: 10_000 });
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [roleFilter, setRoleFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<ActionState | null>(null);
  const [signatureId, setSignatureId] = useState("");
  const [remarks, setRemarks] = useState("");

  const approvals = approvalsQuery.data ?? [];
  const pending = pendingQuery.data ?? [];
  const roleOptions = useMemo(
    () => Array.from(new Set(approvals.map(item => item.requiredRoleLabel).filter(Boolean))),
    [approvals]
  );
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return approvals.filter(item => {
      const statusOk = statusFilter === "all" || item.status === statusFilter;
      const roleOk = roleFilter === "all" || item.requiredRoleLabel === roleFilter;
      const textOk = !text || [item.tagNo, item.blindNo, item.projectName, item.areaCode, item.lineNo, item.phaseLabel]
        .join(" ")
        .toLowerCase()
        .includes(text);
      return statusOk && roleOk && textOk;
    });
  }, [approvals, query, roleFilter, statusFilter]);

  const approveMutation = trpc.core.approveRequest.useMutation({
    onSuccess: async updated => {
      toast.success(`${updated.tagNo} ${updated.status.toLowerCase()}`);
      setAction(null);
      setSignatureId("");
      setRemarks("");
      await Promise.all([
        utils.core.approvalCenter.invalidate(),
        utils.core.pendingApprovals.invalidate(),
        utils.core.blinds.invalidate(),
        utils.core.dashboardSummary.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });

  function openAction(item: NonNullable<typeof approvalsQuery.data>[number], decision: ApprovalDecision) {
    setAction({ approvalId: String(item.id), tagNo: item.tagNo, decision });
    setSignatureId("");
    setRemarks("");
  }

  function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    approveMutation.mutate({
      approvalId: action.approvalId,
      decision: action.decision,
      signatureId: signatureId.trim(),
      remarks: remarks.trim() || null,
    });
  }

  const kpis = [
    { label: "Pending Inbox", value: pending.length, icon: Inbox, tone: "text-amber-700 bg-amber-50" },
    { label: "Approved", value: approvals.filter(item => item.status === "Approved").length, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Rejected", value: approvals.filter(item => item.status === "Rejected").length, icon: XCircle, tone: "text-rose-700 bg-rose-50" },
    { label: "Total Requests", value: approvals.length, icon: ShieldCheck, tone: "text-cyan-700 bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Controlled Sign-off"
        title="Approval Center"
        description="Central pending approval inbox for phase gates, final tight sign-offs, and future certificate approvals."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="sbts-card p-5">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-black text-slate-950">{item.value}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">{item.label}</div>
            </div>
          );
        })}
      </div>

      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Pending Approval Inbox</h2>
            <p className="text-sm font-semibold text-slate-500">Approve or reject requests only with authorized Project Setup signatures.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search tag, blind, project..."
                className="w-64 rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
            </div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">
              <option value="all">All Roles</option>
              {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            {(query || statusFilter !== "Pending" || roleFilter !== "all") && (
              <button onClick={() => { setQuery(""); setStatusFilter("Pending"); setRoleFilter("all"); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-extrabold text-slate-700">
                <Filter className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {approvalsQuery.isLoading && <div className="p-8 text-sm font-bold text-slate-500">Loading approvals...</div>}
          {filtered.map(item => (
            <div key={String(item.id)} className="grid gap-4 p-5 xl:grid-cols-[1.35fr_0.7fr_0.7fr_250px] xl:items-center">
              <div>
                <button onClick={() => setLocation(`/blinds/${item.blindId}`)} className="text-left text-base font-black text-slate-950 hover:text-cyan-700">
                  {item.tagNo} · {item.lineNo}
                </button>
                <div className="mt-1 text-sm font-semibold text-slate-500">{item.projectName} / {item.areaCode} / {item.blindNo} / {item.size}{item.rating ? ` / ${item.rating}` : ""}</div>
                <div className="mt-2 text-xs font-bold text-slate-400">Created: {new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Approval Gate</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{item.phaseLabel}</div>
                <div className="text-xs font-bold text-slate-500">Required: {item.requiredRoleLabel}</div>
              </div>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[item.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>{item.status}</span>
                {item.approvedByName && <div className="mt-2 text-xs font-bold text-slate-500">By {item.approvedByName}</div>}
              </div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <button onClick={() => setLocation(`/blinds/${item.blindId}`)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700">Details</button>
                {item.status === "Pending" && (
                  <>
                    <button onClick={() => openAction(item, "Rejected")} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 ring-1 ring-rose-100">Reject</button>
                    <button onClick={() => openAction(item, "Approved")} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white">Approve</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!approvalsQuery.isLoading && filtered.length === 0 && (
            <div className="p-10 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
              <div className="mt-3 text-sm font-bold text-slate-500">No approval requests match the current filter.</div>
            </div>
          )}
        </div>
      </section>

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitAction} className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-cyan-700">Authorized approval signature</div>
                <h2 className="mt-1 text-xl font-black text-slate-950">{action.decision} · {action.tagNo}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Enter an authorized badge from this project phase assignment.</p>
              </div>
              <button type="button" onClick={() => setAction(null)} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input required value={signatureId} onChange={event => setSignatureId(event.target.value)} placeholder="Signature ID / Badge No." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <textarea value={remarks} onChange={event => setRemarks(event.target.value)} placeholder="Approval remarks / rejection reason" className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAction(null)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600">Cancel</button>
              <button disabled={approveMutation.isPending} className={`rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60 ${action.decision === "Approved" ? "bg-slate-950" : "bg-rose-600"}`}>{action.decision}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
