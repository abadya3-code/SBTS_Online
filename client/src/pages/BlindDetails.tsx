import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Filter,
  MoveRight,
  QrCode,
  Printer,
  ShieldCheck,
  UserCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { QRCodeBlock, buildBlindQrValue } from "@/components/common/QRCodeBlock";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { readAuthSession } from "@/lib/auth";

const phaseOptions = [
  {
    key: "broken",
    label: "Broken / Preparation",
    owner: "Coordinator",
    color: "#ef4444",
    requiresTorque: false,
    approval: "Coordinator validation",
  },
  {
    key: "assembly",
    label: "Assembly",
    owner: "Technician",
    color: "#f59e0b",
    requiresTorque: false,
    approval: "Field execution",
  },
  {
    key: "tightTorque",
    label: "Tight & Torque",
    owner: "T&I Engineer",
    color: "#eab308",
    requiresTorque: true,
    approval: "Torque gate",
  },
  {
    key: "finalTight",
    label: "Final Tight",
    owner: "QC Inspector",
    color: "#22c55e",
    requiresTorque: false,
    approval: "QC sign-off",
  },
  {
    key: "inspectionReady",
    label: "Inspection Ready",
    owner: "Inspection",
    color: "#3b82f6",
    requiresTorque: false,
    approval: "Final package",
  },
] as const;
const roleOptions = [
  "admin",
  "coordinator",
  "technician",
  "tiEngineer",
  "qc",
  "inspection",
  "metalForeman",
  "safety",
] as const;
const roleLabels: Record<string, string> = {
  admin: "System Admin",
  coordinator: "Coordinator",
  technician: "Technician",
  tiEngineer: "T&I Engineer",
  qc: "QC Inspector",
  inspection: "Inspection",
  metalForeman: "Metal Foreman",
  safety: "Safety",
};

type AuthorizedEmployee = {
  badge: string;
  name: string;
  roleKey: string;
  specialty: string;
  initials: string;
  status: "Available" | "On Shift" | "Standby";
};

const authorizedEmployees: AuthorizedEmployee[] = [
  { badge: "admin", name: "System Admin", roleKey: "admin", specialty: "Platform Owner", initials: "SA", status: "Available" },
  { badge: "100245", name: "Abdullah Alaqil", roleKey: "coordinator", specialty: "Blind Coordinator", initials: "AA", status: "On Shift" },
  { badge: "CO-014", name: "Hassan Al-Mutairi", roleKey: "coordinator", specialty: "Shutdown Coordinator", initials: "HM", status: "Available" },
  { badge: "TECH-211", name: "Fahad Al-Qahtani", roleKey: "technician", specialty: "Field Technician", initials: "FQ", status: "On Shift" },
  { badge: "TECH-238", name: "Mohammed Al-Harbi", roleKey: "technician", specialty: "Blind Installation", initials: "MH", status: "Standby" },
  { badge: "TI-001", name: "T&I Engineer Lead", roleKey: "tiEngineer", specialty: "Torque Gate Owner", initials: "TI", status: "Available" },
  { badge: "TORQUE-LEAD", name: "Torque Lead", roleKey: "tiEngineer", specialty: "Hydraulic Torque", initials: "TL", status: "On Shift" },
  { badge: "QC-01", name: "QC Inspector 01", roleKey: "qc", specialty: "Final Tight QC", initials: "QC", status: "Available" },
  { badge: "INSP-07", name: "Inspection Reviewer", roleKey: "inspection", specialty: "Final Package", initials: "IR", status: "Available" },
  { badge: "MF-03", name: "Metal Foreman", roleKey: "metalForeman", specialty: "Slip Blind / Metal", initials: "MF", status: "On Shift" },
  { badge: "SAFE-02", name: "Safety Officer", roleKey: "safety", specialty: "Isolation Safety", initials: "SO", status: "Available" },
];

function employeeByBadge(badge: string, directory = authorizedEmployees) {
  return directory.find(employee => employee.badge.toLowerCase() === badge.toLowerCase());
}

type PhaseAssignment = {
  phaseKey: string;
  roleKey: string;
  authorizedEmployeeBadges?: string[];
  authorizedSignatures: string;
  note: string;
};
function assignmentStorageKey(projectId: string) {
  return `sbts.phaseAssignments.${projectId}`;
}
function defaultAssignments(): PhaseAssignment[] {
  return phaseOptions.map(phase => ({
    phaseKey: phase.key,
    roleKey:
      phase.key === "broken"
        ? "coordinator"
        : phase.key === "assembly"
          ? "technician"
          : phase.key === "tightTorque"
            ? "tiEngineer"
            : phase.key === "finalTight"
              ? "qc"
              : "inspection",
    authorizedEmployeeBadges:
      phase.key === "tightTorque" ? ["admin", "TI-001", "TORQUE-LEAD"] : ["admin"],
    authorizedSignatures:
      phase.key === "tightTorque" ? "admin, TI-001, TORQUE-LEAD" : "admin",
    note:
      phase.key === "tightTorque"
        ? "Torque phase requires approved T&I / torque signature."
        : "Supervisor-authorized phase updater.",
  }));
}
function loadAssignments(projectId: string): PhaseAssignment[] {
  if (typeof window === "undefined") return defaultAssignments();
  const raw = window.localStorage.getItem(assignmentStorageKey(projectId));
  if (!raw) return defaultAssignments();
  try {
    const parsed = JSON.parse(raw) as PhaseAssignment[];
    return phaseOptions.map(phase => {
      const fallback = defaultAssignments().find(item => item.phaseKey === phase.key)!;
      const saved = parsed.find(item => item.phaseKey === phase.key);
      if (!saved) return fallback;
      const badges =
        saved.authorizedEmployeeBadges?.length
          ? saved.authorizedEmployeeBadges
          : saved.authorizedSignatures
              .split(/[,\n]/)
              .map(item => item.trim())
              .filter(Boolean);
      return {
        ...fallback,
        ...saved,
        authorizedEmployeeBadges: badges,
        authorizedSignatures: badges.join(", "),
      };
    });
  } catch {
    return defaultAssignments();
  }
}
function parseAuthorized(value: string): string[] {
  return value
    .split(/[,.\n]/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

type MoveForm = {
  toPhaseKey: string;
  signatureId: string;
  remarks: string;
  torqueType: string;
  psi: string;
  toolId: string;
  technicianName: string;
  technicianBadge: string;
};
const emptyMoveForm: MoveForm = {
  toPhaseKey: "",
  signatureId: "",
  remarks: "",
  torqueType: "Hydraulic",
  psi: "",
  toolId: "",
  technicianName: "",
  technicianBadge: "",
};

function phaseLabel(key?: string | null) {
  return phaseOptions.find(phase => phase.key === key)?.label ?? key ?? "Start";
}
function actorLabel(role?: string | null, openId?: string | null) {
  return `${roleLabels[role ?? ""] ?? role ?? "Unknown"}${openId ? ` · ${openId}` : ""}`;
}

export default function BlindDetails() {
  const [location, setLocation] = useLocation();
  const id = decodeURIComponent(
    location.split("/blinds/")[1]?.split("?")[0] ?? ""
  );
  const utils = trpc.useUtils();
  const authSession = readAuthSession();
  const activeUser = authSession.profile;
  const detailQuery = trpc.core.blindDetail.useQuery(
    { id },
    { enabled: Boolean(id), staleTime: 10_000 }
  );
  const blind = detailQuery.data;
  const employeesQuery = trpc.core.employees.useQuery(undefined, {
    staleTime: 60_000,
  });
  const backendEmployees: AuthorizedEmployee[] = useMemo(
    () =>
      (employeesQuery.data ?? []).map(employee => ({
        badge: employee.badge,
        name: employee.fullName,
        roleKey: employee.roleKey,
        specialty: employee.specialty,
        initials: employee.initials,
        status: employee.status === "Standby" ? "Standby" : employee.shift ? "On Shift" : "Available",
      })),
    [employeesQuery.data]
  );
  const employeeDirectory = backendEmployees.length ? backendEmployees : authorizedEmployees;
  const phaseAssignmentsQuery = trpc.core.phaseAssignments.useQuery(
    { projectId: blind?.projectId ?? "" },
    { enabled: Boolean(blind?.projectId), staleTime: 10_000 }
  );
  const torqueRecordsQuery = trpc.core.torqueRecords.useQuery(
    { blindId: blind?.id ?? "" },
    { enabled: Boolean(blind?.id), staleTime: 10_000 }
  );
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 30_000 });
  const [openMove, setOpenMove] = useState(false);
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [moveForm, setMoveForm] = useState<MoveForm>(emptyMoveForm);

  const activePhaseIndex = useMemo(
    () => phaseOptions.findIndex(phase => phase.key === blind?.currentPhaseKey),
    [blind?.currentPhaseKey]
  );
  const defaultNextPhase =
    blind?.nextPhaseKey ?? blind?.currentPhaseKey ?? "broken";
  const selectedTargetPhase = phaseOptions.find(
    phase => phase.key === (moveForm.toPhaseKey || defaultNextPhase)
  );
  const requiresTorque = !!selectedTargetPhase?.requiresTorque;
  const assignments = useMemo(() => {
    if (phaseAssignmentsQuery.data?.length) {
      return phaseAssignmentsQuery.data.map(item => ({
        phaseKey: item.phaseKey,
        roleKey: item.roleKey,
        authorizedEmployeeBadges: item.authorizedEmployeeBadges,
        authorizedSignatures: item.authorizedEmployeeBadges.join(", "),
        note: item.note ?? "",
      }));
    }
    return blind?.projectId ? loadAssignments(blind.projectId) : defaultAssignments();
  }, [blind?.projectId, phaseAssignmentsQuery.data]);
  const selectedAssignment = assignments.find(
    item => item.phaseKey === (moveForm.toPhaseKey || defaultNextPhase)
  );
  const selectedRoleLabel =
    roleLabels[selectedAssignment?.roleKey ?? ""] ??
    selectedAssignment?.roleKey ??
    "Not assigned";
  const authorizedSignatureList =
    selectedAssignment?.authorizedEmployeeBadges?.length
      ? selectedAssignment.authorizedEmployeeBadges.map(item => item.toLowerCase())
      : parseAuthorized(selectedAssignment?.authorizedSignatures ?? "");
  const authorizedPeople = authorizedSignatureList.map(badge => employeeByBadge(badge, employeeDirectory)).filter(Boolean) as AuthorizedEmployee[];
  const finalApprovalProfile = useMemo(() => {
    const profiles = (settingsQuery.data as any)?.approvals?.profiles ?? [];
    const type = String(blind?.blindType ?? "").toLowerCase();
    return profiles.find((profile: any) => type.includes(String(profile.blindType).toLowerCase())) ?? profiles.find((profile: any) => String(profile.blindType).toLowerCase() === "blind");
  }, [settingsQuery.data, blind?.blindType]);

  const actorOptions = useMemo(() => {
    const set = new Set(
      (blind?.logs ?? [])
        .map(log => log.actorRoleKey)
        .filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [blind?.logs]);

  const filteredLogs = useMemo(() => {
    return (blind?.logs ?? []).filter(log => {
      const actorOk = actorFilter === "all" || log.actorRoleKey === actorFilter;
      const actionOk = actionFilter === "all" || log.action === actionFilter;
      return actorOk && actionOk;
    });
  }, [blind?.logs, actorFilter, actionFilter]);

  const moveMutation = trpc.core.moveBlindPhase.useMutation({
    onSuccess: async updated => {
      toast.success(`${updated.tagNo} moved to ${updated.phaseLabel}`);
      setMoveForm(emptyMoveForm);
      setOpenMove(false);
      await Promise.all([
        utils.core.blindDetail.invalidate({ id }),
        utils.core.blinds.invalidate(),
        utils.core.projects.invalidate(),
        utils.core.dashboardSummary.invalidate(),
        utils.core.torqueRecords.invalidate({ blindId: id }),
      ]);
    },
    onError: error => toast.error(error.message),
  });

  function openPhaseModal() {
    setMoveForm({ ...emptyMoveForm, toPhaseKey: defaultNextPhase, signatureId: activeUser.badge, technicianName: activeUser.fullName, technicianBadge: activeUser.badge });
    setOpenMove(true);
  }

  function submitMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!blind) return;
    const toPhaseKey = (moveForm.toPhaseKey ||
      defaultNextPhase) as (typeof phaseOptions)[number]["key"];
    const target = phaseOptions.find(phase => phase.key === toPhaseKey);
    const assignment = assignments.find(item => item.phaseKey === toPhaseKey);
    const allowed = assignment?.authorizedEmployeeBadges?.length
      ? assignment.authorizedEmployeeBadges.map(item => item.toLowerCase())
      : parseAuthorized(assignment?.authorizedSignatures ?? "");
    const signature = activeUser.badge.trim().toLowerCase();
    if (moveForm.signatureId.trim().toLowerCase() !== signature) {
      toast.error("Signature must match the logged-in user. Phase updates cannot be signed by another employee.");
      return;
    }
    if (!assignment || allowed.length === 0 || !allowed.includes(signature)) {
      toast.error(
        "This signature is not authorized for the selected phase. Update Project Setup → Phase Task Assignment."
      );
      return;
    }
    if (target?.requiresTorque && (!moveForm.psi || !moveForm.toolId)) {
      toast.error(
        "Torque PSI and Tool/Machine ID are required for Tight & Torque."
      );
      return;
    }
    const torqueNote = target?.requiresTorque
      ? ` | Torque: ${moveForm.psi} PSI, ${moveForm.torqueType}, Tool: ${moveForm.toolId}, Tech: ${moveForm.technicianName || "N/A"}${moveForm.technicianBadge ? ` (${moveForm.technicianBadge})` : ""}`
      : "";
    const signedEmployee = employeeByBadge(activeUser.badge, employeeDirectory);
    const signatureNote = ` | Signed by: ${signedEmployee?.name ?? activeUser.fullName} (${activeUser.badge} / ${activeUser.roleLabel})`;
    moveMutation.mutate({
      blindId: blind.id,
      toPhaseKey,
      actorRoleKey: activeUser.roleKey as (typeof roleOptions)[number],
      signatureId: activeUser.badge,
      remarks: `${moveForm.remarks || `Moved to ${target?.label ?? toPhaseKey}`}${signatureNote}${torqueNote}`,
      torqueType: moveForm.torqueType || null,
      psi: moveForm.psi ? Number(moveForm.psi) : null,
      toolId: moveForm.toolId || null,
      technicianName: moveForm.technicianName || activeUser.fullName,
      technicianBadge: moveForm.technicianBadge || activeUser.badge,
    });
  }

  if (detailQuery.isLoading)
    return (
      <div className="sbts-card p-8 text-sm font-bold text-slate-500">
        Loading blind details...
      </div>
    );
  if (!blind)
    return (
      <div className="space-y-5">
        <button
          onClick={() =>
            setLocation(
              blind?.projectId ? `/projects/${blind.projectId}` : "/projects"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </button>
        <div className="sbts-card p-8">
          <h1 className="text-xl font-extrabold text-slate-950">
            Blind not found
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            The selected blind ID does not exist in the core model.
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Blind detail / Patch 47.48 workflow style"
        title={`${blind.tagNo} · ${blind.lineNo}`}
        description={`${blind.projectName} / ${blind.areaCode} / ${blind.blindType} / ${blind.size}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setLocation(
                  blind?.projectId
                    ? `/projects/${blind.projectId}`
                    : "/projects"
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Project
            </button>
            <button
              onClick={() => setLocation(`/blinds/${blind.id}/tag`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"
            >
              <Printer className="h-4 w-4" /> Print Tag
            </button>
            <button
              onClick={() => setLocation(`/blinds/${blind.id}/certificate`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-extrabold text-cyan-800 shadow-sm"
            >
              <FileText className="h-4 w-4" /> Certificate
            </button>
            <button
              onClick={openPhaseModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"
            >
              <MoveRight className="h-4 w-4" /> Update Phase
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
        <Database className="h-4 w-4" /> Backend gate active: phase updates create approval requests when needed and torque records are displayed below.
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="sbts-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-extrabold text-slate-950">
              Operational Snapshot
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Blind No", blind.blindNo],
              ["Tag No", blind.tagNo],
              ["Status", blind.status],
              ["Project", blind.projectNo ?? blind.projectName],
              ["Area", `${blind.areaCode} · ${blind.areaName ?? ""}`],
              ["Line", blind.lineNo],
              ["Size / Rating", `${blind.size} / ${blind.rating ?? "N/A"}`],
              ["Type", blind.blindType],
              ["Priority", blind.priority],
              ["QR Link", blind.qrCode],
              ["Location", blind.locationNote ?? "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {label}
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="sbts-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <QrCode className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-extrabold text-slate-950">
              Field QR Tag
            </h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
            <QRCodeBlock value={buildBlindQrValue(blind.id, blind.tagNo)} label={blind.tagNo} size={150} />
            <div className="mt-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Scan opens live blind details
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <button
              onClick={() => setLocation(`/blinds/${blind.id}/tag`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"
            >
              <Printer className="h-4 w-4" /> Print Tag
            </button>
            <button
              onClick={() => setLocation(`/blinds/${blind.id}/certificate`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"
            >
              <FileText className="h-4 w-4" /> Build Certificate
            </button>
          </div>
        </aside>
      </div>

      <section className="sbts-card p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Workflow Timeline
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Done is only shown when the blind actually moved through the
                phase, not because a new phase was added.
              </p>
            </div>
          </div>
          <button
            onClick={openPhaseModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <MoveRight className="h-4 w-4" /> Update Phase
          </button>
        </div>
        <div className="space-y-3">
          {phaseOptions.map((phase, index) => {
            const done = index < activePhaseIndex;
            const active = index === activePhaseIndex;
            const last = (blind.logs ?? []).find(
              log => log.toPhaseKey === phase.key
            );
            return (
              <div
                key={phase.key}
                className={`rounded-3xl border p-4 ${active ? "border-cyan-300 bg-cyan-50" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
                style={{
                  borderLeftWidth: 6,
                  borderLeftColor: active
                    ? phase.color
                    : done
                      ? "#22c55e"
                      : "#cbd5e1",
                }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-9 w-9 items-center justify-center rounded-2xl ${done ? "bg-emerald-600 text-white" : active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-950">
                        {phase.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">
                        Authorized role:{" "}
                        {roleLabels[
                          assignments.find(item => item.phaseKey === phase.key)
                            ?.roleKey ?? ""
                        ] ?? phase.owner}{" "}
                        · Approval: {phase.approval} · Torque:{" "}
                        {phase.requiresTorque ? "Required" : "Not required"}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-400">
                        Last:{" "}
                        {last
                          ? `${actorLabel(last.actorRoleKey, last.actorOpenId)} · ${new Date(last.createdAt).toLocaleString()}`
                          : "No recorded action yet"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${done ? "bg-emerald-600 text-white" : active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {done ? "✓ DONE" : active ? "CURRENT" : "PENDING"}
                  </div>
                </div>
              </div>
            );
          })}
          <div
            className="rounded-3xl border border-slate-200 bg-white p-4"
            style={{
              borderLeftWidth: 6,
              borderLeftColor:
                blind.status === "Completed" ? "#22c55e" : "#f59e0b",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-black text-slate-950">
                  Final approvals
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  Required profile for {blind.blindType}: {(finalApprovalProfile?.requiredApprovers ?? ["Operation Foreman", "Project Engineer", "Inspection Unit"]).join(" · ")}.
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${blind.status === "Completed" ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"}`}
              >
                {blind.status === "Completed" ? "APPROVED" : "PENDING"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Torque Records</h2>
            <p className="text-sm font-semibold text-slate-500">
              Values entered during Tight & Torque phase are saved and visible for certificate preparation.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-100">
            {(torqueRecordsQuery.data ?? []).length} records
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {torqueRecordsQuery.isLoading && (
            <div className="p-6 text-sm font-bold text-slate-500">Loading torque records...</div>
          )}
          {(torqueRecordsQuery.data ?? []).map(record => (
            <div key={String(record.id)} className="grid gap-4 p-5 md:grid-cols-[1fr_140px_160px] md:items-center">
              <div>
                <div className="text-sm font-black text-slate-950">
                  {record.machineType} · {record.psiValue} PSI · {record.phaseLabel}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  Technician: {record.technicianName ?? "N/A"} {record.technicianBadge ? `(${record.technicianBadge})` : ""}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-400">{record.remarks ?? "No remarks"}</div>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-lg font-black text-amber-800">
                {record.psiValue}
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-500">PSI</div>
              </div>
              <div className="text-xs font-bold text-slate-400 md:text-right">
                {new Date(record.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {!torqueRecordsQuery.isLoading && (torqueRecordsQuery.data ?? []).length === 0 && (
            <div className="p-8 text-center text-sm font-bold text-slate-500">
              No torque records yet. Move this blind to Tight & Torque and complete the torque gate to create a record.
            </div>
          )}
        </div>
      </section>

      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Activity Log
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Clickable actor filter copied from the patch47.48 concept and
              rebuilt for React.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              <option value="all">All Actors</option>
              {actorOptions.map(actor => (
                <option key={actor} value={actor}>
                  {roleLabels[actor] ?? actor}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              <option value="all">All Actions</option>
              {Array.from(
                new Set((blind.logs ?? []).map(log => log.action))
              ).map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            {(actorFilter !== "all" || actionFilter !== "all") && (
              <button
                onClick={() => {
                  setActorFilter("all");
                  setActionFilter("all");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-extrabold text-slate-700"
              >
                <Filter className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="grid gap-3 p-5 md:grid-cols-[1fr_180px]"
            >
              <div>
                <div className="text-sm font-extrabold text-slate-950">
                  {log.action} · {phaseLabel(log.fromPhaseKey)} →{" "}
                  {phaseLabel(log.toPhaseKey)}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  {log.remarks ?? "No remarks"}
                </div>
                <button
                  onClick={() => setActorFilter(log.actorRoleKey ?? "all")}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 hover:bg-cyan-100 hover:text-cyan-800"
                >
                  <UserRound className="h-3.5 w-3.5" />{" "}
                  {actorLabel(log.actorRoleKey, log.actorOpenId)}
                </button>
              </div>
              <div className="text-xs font-bold text-slate-400">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-sm font-bold text-slate-500">
              No activity matches the current filters.
            </div>
          )}
        </div>
      </section>

      {openMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitMove}
            className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <MoveRight className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Phase Update Gate
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Controlled movement signed only by the logged-in authorized user. No employee can update a phase using another employee name.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenMove(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Current Phase
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {blind.phaseLabel}
                </div>
              </div>
              <select
                value={moveForm.toPhaseKey || defaultNextPhase}
                onChange={e =>
                  setMoveForm({ ...moveForm, toPhaseKey: e.target.value })
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              >
                {phaseOptions.map(phase => (
                  <option key={phase.key} value={phase.key}>
                    {phase.label}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Authorized Role
                </div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {selectedRoleLabel}
                </div>
              </div>
              <div className="md:col-span-3 rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Blind</div>
                    <div className="mt-1 text-sm font-black text-slate-950">{blind.tagNo} · {blind.blindNo}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">From</div>
                    <div className="mt-1 text-sm font-black text-slate-950">{blind.phaseLabel}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">To</div>
                    <div className="mt-1 text-sm font-black text-slate-950">{selectedTargetPhase?.label}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-cyan-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">{activeUser.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-slate-950">{activeUser.fullName}</div>
                    <div className="text-xs font-bold text-slate-500">Logged-in updater · {activeUser.roleLabel} · Badge {activeUser.badge}</div>
                  </div>
                </div>
                <input
                  required
                  value={moveForm.signatureId}
                  onChange={e => setMoveForm({ ...moveForm, signatureId: e.target.value })}
                  placeholder="Signature ID / Badge No."
                  className="mt-3 w-full rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
                />
                <div className="mt-2 text-xs font-bold text-cyan-900">* This will be saved in the History log as a signature. Signature must match the logged-in user and the user must be authorized in Phase Task Assignment.</div>
              </div>
              <textarea
                value={moveForm.remarks}
                onChange={e =>
                  setMoveForm({ ...moveForm, remarks: e.target.value })
                }
                placeholder="Remarks / field note"
                className="md:col-span-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
            </div>
            {requiresTorque && (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-900">
                  <Wrench className="h-4 w-4" /> Torque Required for this phase
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={moveForm.torqueType}
                    onChange={e =>
                      setMoveForm({ ...moveForm, torqueType: e.target.value })
                    }
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option>Hydraulic</option>
                    <option>Manual</option>
                  </select>
                  <input
                    required={requiresTorque}
                    value={moveForm.psi}
                    onChange={e =>
                      setMoveForm({ ...moveForm, psi: e.target.value })
                    }
                    placeholder="PSI value"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                  <input
                    required={requiresTorque}
                    value={moveForm.toolId}
                    onChange={e =>
                      setMoveForm({ ...moveForm, toolId: e.target.value })
                    }
                    placeholder="Tool / Machine ID"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                  <input
                    value={moveForm.technicianName}
                    onChange={e =>
                      setMoveForm({
                        ...moveForm,
                        technicianName: e.target.value,
                      })
                    }
                    placeholder="Technician name"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                  <input
                    value={moveForm.technicianBadge}
                    onChange={e =>
                      setMoveForm({
                        ...moveForm,
                        technicianBadge: e.target.value,
                      })
                    }
                    placeholder="Technician badge"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenMove(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={moveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
              >
                <MoveRight className="h-4 w-4" /> Confirm Signed Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
