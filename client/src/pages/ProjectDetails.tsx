import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  MapPin,
  Plus,
  Printer,
  QrCode,
  Save,
  Settings2,
  Tags,
  Upload,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const blindTypes = [
  "Slip Blind",
  "Spectacle Blind",
  "Spacer",
  "Drop Spool",
  "Isolation Blind",
] as const;
const priorities = ["Low", "Normal", "High", "Critical"] as const;

const phaseAssignmentOptions = [
  { key: "broken", label: "Broken / Preparation", defaultRole: "coordinator" },
  { key: "assembly", label: "Assembly", defaultRole: "technician" },
  { key: "tightTorque", label: "Tight & Torque", defaultRole: "tiEngineer" },
  { key: "finalTight", label: "Final Tight", defaultRole: "qc" },
  {
    key: "inspectionReady",
    label: "Inspection Ready",
    defaultRole: "inspection",
  },
] as const;

const roleOptions = [
  { key: "coordinator", label: "Coordinator" },
  { key: "technician", label: "Technician" },
  { key: "tiEngineer", label: "T&I Engineer" },
  { key: "qc", label: "QC Inspector" },
  { key: "inspection", label: "Inspection" },
  { key: "metalForeman", label: "Metal Foreman" },
  { key: "safety", label: "Safety" },
  { key: "admin", label: "System Admin" },
] as const;

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

function roleLabel(roleKey: string) {
  return roleOptions.find(role => role.key === roleKey)?.label ?? roleKey;
}

function employeesForRole(roleKey: string, directory = authorizedEmployees) {
  return directory.filter(employee => employee.roleKey === roleKey || employee.roleKey === "admin");
}

function searchEmployees(roleKey: string, query: string, selectedBadges: string[], directory = authorizedEmployees) {
  const normalizedQuery = query.trim().toLowerCase();
  const rolePool = employeesForRole(roleKey, directory).filter(employee => !selectedBadges.includes(employee.badge));
  const activePool = rolePool.filter(employee => employee.status !== "Standby");
  const searchPool = normalizedQuery ? rolePool : activePool;
  const matched = searchPool.filter(employee => {
    if (!normalizedQuery) return true;
    return [employee.name, employee.badge, employee.specialty, roleLabel(employee.roleKey), employee.status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  return matched.slice(0, 6);
}

function employeeByBadge(badge: string, directory = authorizedEmployees) {
  return directory.find(employee => employee.badge === badge);
}

type PhaseAssignment = {
  phaseKey: string;
  roleKey: string;
  authorizedEmployeeBadges: string[];
  authorizedSignatures: string;
  note: string;
};
function assignmentStorageKey(projectId: string) {
  return `sbts.phaseAssignments.${projectId}`;
}
function defaultAssignments(): PhaseAssignment[] {
  return phaseAssignmentOptions.map(phase => ({
    phaseKey: phase.key,
    roleKey: phase.defaultRole,
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
    return phaseAssignmentOptions.map(phase => {
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

type BlindForm = {
  blindNo: string;
  tagNo: string;
  lineNo: string;
  size: string;
  rating: string;
  blindType: string;
  priority: string;
  locationNote: string;
};
const emptyBlindForm: BlindForm = {
  blindNo: "",
  tagNo: "",
  lineNo: "",
  size: "",
  rating: "300#",
  blindType: "Slip Blind",
  priority: "Normal",
  locationNote: "",
};

const bulkSample = `BL-5001\tSB-5001\tD-501\t10 in\t300#\tSlip Blind\tHigh\tNorth rack\nBL-5002\tSB-5002\tD-502\t8 in\t600#\tSpectacle Blind\tNormal\tCompressor bay`;

function statusClass(status: string) {
  if (status === "Completed")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (status === "Pending Approval")
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  if (status === "In Progress")
    return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const projectId = params?.id ?? "";
  const projectsQuery = trpc.core.projects.useQuery(undefined, {
    staleTime: 20_000,
  });
  const blindsQuery = trpc.core.blinds.useQuery(undefined, {
    staleTime: 20_000,
  });
  const employeesQuery = trpc.core.employees.useQuery(undefined, {
    staleTime: 60_000,
  });
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 30_000 });
  const phaseAssignmentsQuery = trpc.core.phaseAssignments.useQuery(
    { projectId },
    { enabled: Boolean(projectId), staleTime: 10_000 }
  );
  const project = projectsQuery.data?.find(item => item.id === projectId);
  const projectBlinds = (blindsQuery.data ?? []).filter(
    blind => blind.projectId === projectId
  );
  const [openAddBlind, setOpenAddBlind] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [openPhaseAssignment, setOpenPhaseAssignment] = useState(false);
  const [form, setForm] = useState<BlindForm>(emptyBlindForm);
  const [bulkText, setBulkText] = useState(bulkSample);
  const [assignments, setAssignments] = useState<PhaseAssignment[]>(() =>
    loadAssignments(projectId)
  );
  const [employeeSearch, setEmployeeSearch] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (!phaseAssignmentsQuery.data) return;
    setAssignments(
      phaseAssignmentsQuery.data.map(item => ({
        phaseKey: item.phaseKey,
        roleKey: item.roleKey,
        authorizedEmployeeBadges: item.authorizedEmployeeBadges,
        authorizedSignatures: item.authorizedEmployeeBadges.join(", "),
        note: item.note ?? "",
      }))
    );
  }, [phaseAssignmentsQuery.data]);

  const saveAssignmentsMutation = trpc.core.savePhaseAssignments.useMutation({
    onSuccess: async () => {
      toast.success("Phase Task Assignment saved to backend gate.");
      setOpenPhaseAssignment(false);
      await utils.core.phaseAssignments.invalidate({ projectId });
    },
    onError: error => toast.error(error.message),
  });

  const createBlindMutation = trpc.core.createBlind.useMutation({
    onSuccess: async blind => {
      toast.success(`${blind.tagNo} created`);
      setForm(emptyBlindForm);
      setOpenAddBlind(false);
      await Promise.all([
        utils.core.blinds.invalidate(),
        utils.core.projects.invalidate(),
        utils.core.dashboardSummary.invalidate(),
      ]);
    },
    onError: error => toast.error(error.message),
  });

  const counts = useMemo(
    () => ({
      total: projectBlinds.length,
      completed: projectBlinds.filter(
        blind =>
          blind.status === "Completed" ||
          blind.currentPhaseKey === "inspectionReady"
      ).length,
      pending: projectBlinds.filter(
        blind => blind.status === "Pending Approval"
      ).length,
      critical: projectBlinds.filter(
        blind => blind.priority === "High" || blind.priority === "Critical"
      ).length,
      slip: projectBlinds.filter(blind =>
        blind.blindType.toLowerCase().includes("slip")
      ).length,
    }),
    [projectBlinds]
  );

  const phaseSummary = useMemo(() => phaseAssignmentOptions.map(phase => ({
    key: phase.key,
    label: phase.label,
    count: projectBlinds.filter(blind => blind.currentPhaseKey === phase.key).length,
  })), [projectBlinds]);

  const blindTypeOptions = useMemo(() => {
    const fromSettings = ((settingsQuery.data as any)?.masterData?.blindTypes as string[] | undefined)?.filter(Boolean);
    return fromSettings?.length ? fromSettings : [...blindTypes];
  }, [settingsQuery.data]);

  function submitBlind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    createBlindMutation.mutate({
      blindNo: form.blindNo,
      tagNo: form.tagNo,
      projectId: project.id,
      areaId: project.areaId,
      lineNo: form.lineNo,
      size: form.size,
      rating: form.rating || null,
      blindType: form.blindType,
      priority: form.priority as (typeof priorities)[number],
      locationNote: form.locationNote || null,
    });
  }

  async function importBulk() {
    if (!project) return;
    const rows = bulkText
      .split(/\r?\n/)
      .map(row => row.trim())
      .filter(Boolean);
    if (rows.length === 0) {
      toast.error("Paste at least one Excel row.");
      return;
    }
    let created = 0;
    for (const row of rows) {
      const cells = row.split(/\t|,/).map(cell => cell.trim());
      const [
        blindNo,
        tagNo,
        lineNo,
        size,
        rating,
        blindType,
        priority,
        locationNote,
      ] = cells;
      if (!blindNo || !tagNo || !lineNo || !size) continue;
      await createBlindMutation.mutateAsync({
        blindNo,
        tagNo,
        projectId: project.id,
        areaId: project.areaId,
        lineNo,
        size,
        rating: rating || null,
        blindType: blindType || "Slip Blind",
        currentPhaseKey: "broken",
        priority: (priority || "Normal") as (typeof priorities)[number],
        locationNote: locationNote || null,
      });
      created += 1;
    }
    await Promise.all([
      utils.core.blinds.invalidate(),
      utils.core.projects.invalidate(),
      utils.core.dashboardSummary.invalidate(),
    ]);
    setOpenBulk(false);
    toast.success(`${created} blinds imported from Excel paste`);
  }

  function futureAction(label: string) {
    toast.message(
      `${label} will be connected in the next workflow/printing sprint.`
    );
  }

  function saveAssignments() {
    saveAssignmentsMutation.mutate({
      projectId,
      assignments: assignments.map(item => ({
        phaseKey: item.phaseKey as (typeof phaseAssignmentOptions)[number]["key"],
        roleKey: item.roleKey as (typeof roleOptions)[number]["key"],
        authorizedEmployeeBadges: item.authorizedEmployeeBadges ?? [],
        note: item.note || null,
      })),
    });
  }

  function updateAssignment(phaseKey: string, patch: Partial<PhaseAssignment>) {
    setAssignments(current =>
      current.map(item => {
        if (item.phaseKey !== phaseKey) return item;
        const next = { ...item, ...patch };
        const badges = next.authorizedEmployeeBadges ?? [];
        return { ...next, authorizedSignatures: badges.join(", ") };
      })
    );
  }

  function toggleAuthorizedEmployee(phaseKey: string, badge: string) {
    setAssignments(current =>
      current.map(item => {
        if (item.phaseKey !== phaseKey) return item;
        const currentBadges = item.authorizedEmployeeBadges ?? [];
        const nextBadges = currentBadges.includes(badge)
          ? currentBadges.filter(value => value !== badge)
          : [...currentBadges, badge];
        return {
          ...item,
          authorizedEmployeeBadges: nextBadges,
          authorizedSignatures: nextBadges.join(", "),
        };
      })
    );
  }

  if (projectsQuery.isLoading)
    return (
      <div className="sbts-card p-8 text-sm font-bold text-slate-500">
        Loading project dashboard...
      </div>
    );
  if (!project)
    return (
      <div className="space-y-5">
        <button
          onClick={() => setLocation("/projects")}
          className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>
        <div className="sbts-card p-8">
          <h1 className="text-xl font-extrabold text-slate-950">
            Project not found
          </h1>
        </div>
      </div>
    );

  const setupActions = [
    {
      label: "Add Blind",
      helper: "Create one blind manually",
      icon: Plus,
      onClick: () => setOpenAddBlind(true),
      ready: true,
    },
    {
      label: "Bulk Add from Excel",
      helper: "Paste multiple blinds from Excel",
      icon: FileSpreadsheet,
      onClick: () => setOpenBulk(true),
      ready: true,
    },
    {
      label: "Phase Task Assignment",
      helper: "Authorize who can update each phase",
      icon: Users,
      onClick: () => setOpenPhaseAssignment(true),
      ready: true,
    },
    {
      label: "Export All Tags",
      helper: "Print 11 × 7 cm QR hanging tags",
      icon: Tags,
      onClick: () => setLocation(`/projects/${project.id}/tags`),
      ready: true,
    },
    {
      label: "Print Certificates",
      helper: "Open project certificate print package",
      icon: Printer,
      onClick: () => setLocation(`/projects/${project.id}/certificates`),
      ready: true,
    },
    {
      label: "Reports & Export",
      helper: "Open filtered management reports for this project",
      icon: BarChart3,
      onClick: () => setLocation(`/reports?projectId=${project.id}`),
      ready: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Dashboard"
        title={`${project.projectNo} · ${project.name}`}
        description={`${project.areaCode} / ${project.areaName} / ${project.status} · ${project.progress}% auto progress`}
        actions={
          <button
            onClick={() => setLocation("/projects")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Projects
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <div className="sbts-card p-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Total Blinds
          </div>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {counts.total}
          </div>
        </div>
        <div className="sbts-card p-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Slip Blinds
          </div>
          <div className="mt-2 text-3xl font-black text-cyan-600">
            {counts.slip}
          </div>
        </div>
        <div className="sbts-card p-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Completed
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {counts.completed}
          </div>
        </div>
        <div className="sbts-card p-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Pending Approval
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {counts.pending}
          </div>
        </div>
        <div className="sbts-card p-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            High / Critical
          </div>
          <div className="mt-2 text-3xl font-black text-red-600">
            {counts.critical}
          </div>
        </div>
      </div>

      <section className="sbts-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Phase Summary</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Live count of this project's blinds by phase. Future phases can be added from workflow configuration.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Project workflow count</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {phaseSummary.map(item => (
            <div key={item.key} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">{item.label}</div>
              <div className="mt-2 text-3xl font-black text-slate-950">{item.count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="sbts-card p-5">
        <div className="mb-5 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-cyan-700" />
          <h2 className="text-lg font-extrabold text-slate-950">
            Project Scope
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Area", `${project.areaCode} · ${project.areaName}`],
            ["Maintenance Reason", (project as any).maintenanceReason ?? "Project maintenance scope / reason not defined yet."],
            ["Start", project.startDate ?? "TBD"],
            ["Target", project.targetDate ?? "TBD"],
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

      <section className="sbts-card p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Project Setup
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                All current and future project setup actions are centralized
                here.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 ring-1 ring-cyan-100">
            Setup Hub
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {setupActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-cyan-700 group-hover:bg-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${action.ready ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"}`}
                  >
                    {action.ready ? "Ready" : "Future"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-950">
                  {action.label}
                </div>
                <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {action.helper}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sbts-card overflow-visible">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-extrabold text-slate-950">
            Project Blinds
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Display-only list. Creation, bulk import, tag export, and
            certificate actions are managed from Project Setup above.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Blind</th>
                <th className="px-5 py-3">Line</th>
                <th className="px-5 py-3">Size / Rating</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">QR</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectBlinds.map(blind => (
                <tr key={blind.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-extrabold text-slate-950">
                    {blind.tagNo}
                    <div className="text-xs font-semibold text-slate-500">
                      {blind.blindNo}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-600">
                    {blind.lineNo}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-600">
                    {blind.size} / {blind.rating ?? "N/A"}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-600">
                    {blind.blindType}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(blind.status)}`}
                    >
                      {blind.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => setLocation(`/blinds/${blind.id}/tag`)} className="group relative rounded-xl p-2 hover:bg-cyan-50" title="Open QR tag">
                      <QrCode className="h-5 w-5 text-slate-500 group-hover:text-cyan-700" />
                      <span className="pointer-events-none absolute right-0 top-10 z-20 hidden w-48 rounded-2xl border border-cyan-100 bg-white p-3 text-xs font-bold text-slate-700 shadow-xl group-hover:block">QR preview is available on hover. Click to open printable tag.</span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setLocation(`/blinds/${blind.id}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white"
                    >
                      <Eye className="h-4 w-4" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectBlinds.length === 0 && (
            <div className="p-8 text-center text-sm font-bold text-slate-500">
              No blinds yet. Use Project Setup to add one blind or import
              multiple rows from Excel.
            </div>
          )}
        </div>
      </section>

      {openAddBlind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitBlind}
            className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Add Blind to {project.projectNo}
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Blind status, phase, and responsibility are controlled by
                    the workflow engine and Phase Task Assignment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddBlind(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                required
                value={form.blindNo}
                onChange={e => setForm({ ...form, blindNo: e.target.value })}
                placeholder="Blind No e.g. BL-4401"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
              <input
                required
                value={form.tagNo}
                onChange={e => setForm({ ...form, tagNo: e.target.value })}
                placeholder="Tag No e.g. SB-4401"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
              <input
                required
                value={form.lineNo}
                onChange={e => setForm({ ...form, lineNo: e.target.value })}
                placeholder="Line No"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
              <input
                required
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}
                placeholder="Size e.g. 10 in"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
              <input
                value={form.rating}
                onChange={e => setForm({ ...form, rating: e.target.value })}
                placeholder="Rating"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
              <select
                value={form.blindType}
                onChange={e => setForm({ ...form, blindType: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              >
                {blindTypeOptions.map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <textarea
                value={form.locationNote}
                onChange={e =>
                  setForm({ ...form, locationNote: e.target.value })
                }
                placeholder="Location note"
                className="md:col-span-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenAddBlind(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={createBlindMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Save Blind
              </button>
            </div>
          </form>
        </div>
      )}

      {openPhaseAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Phase Task Assignment
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Supervisor setup: define who is authorized to update each
                    phase. Badge/signature IDs are enforced inside Blind
                    Details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenPhaseAssignment(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 grid gap-3 rounded-3xl border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-cyan-950">
                  Smart Employee Picker
                </div>
                <div className="mt-1 text-xs font-bold leading-5 text-cyan-800">
                  Select the phase and role, then search by name, badge, or specialty. Only selected employees appear as authorized signers, so the screen stays clean even with 100+ employees.
                </div>
              </div>
            </div>
            <div className="max-h-[66vh] space-y-4 overflow-y-auto pr-2">
              {phaseAssignmentOptions.map(phase => {
                const assignment =
                  assignments.find(item => item.phaseKey === phase.key) ??
                  defaultAssignments().find(
                    item => item.phaseKey === phase.key
                  )!;
                const selectedBadges = assignment.authorizedEmployeeBadges ?? [];
                const query = employeeSearch[phase.key] ?? "";
                const results = searchEmployees(assignment.roleKey, query, selectedBadges, employeeDirectory);
                const selectedEmployees = selectedBadges
                  .map(badge => employeeByBadge(badge, employeeDirectory))
                  .filter(Boolean) as AuthorizedEmployee[];
                return (
                  <div
                    key={phase.key}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 lg:grid-cols-[1.1fr_0.75fr_1fr] lg:items-center">
                      <div>
                        <div className="text-sm font-black text-slate-950">
                          {phase.label}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                          Role: {roleLabel(assignment.roleKey)} · Authorized: {selectedBadges.length}
                        </div>
                      </div>
                      <select
                        value={assignment.roleKey}
                        onChange={event => {
                          const nextRole = event.target.value;
                          const allowedForRole = employeesForRole(nextRole, employeeDirectory).map(employee => employee.badge);
                          const nextBadges = selectedBadges.filter(badge => allowedForRole.includes(badge));
                          setEmployeeSearch(current => ({ ...current, [phase.key]: "" }));
                          updateAssignment(phase.key, {
                            roleKey: nextRole,
                            authorizedEmployeeBadges: nextBadges.length ? nextBadges : ["admin"],
                          });
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
                      >
                        {roleOptions.map(role => (
                          <option key={role.key} value={role.key}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={assignment.note}
                        onChange={event =>
                          updateAssignment(phase.key, {
                            note: event.target.value,
                          })
                        }
                        placeholder="Supervisor note"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                      <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              Search & Add
                            </div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              Find authorized employee
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Max 6 results
                          </span>
                        </div>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={query}
                            onChange={event =>
                              setEmployeeSearch(current => ({
                                ...current,
                                [phase.key]: event.target.value,
                              }))
                            }
                            placeholder="Search name, badge, specialty..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-cyan-400 focus:bg-white"
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          {results.length ? (
                            results.map(employee => (
                              <button
                                key={`${phase.key}-result-${employee.badge}`}
                                type="button"
                                onClick={() => toggleAuthorizedEmployee(phase.key, employee.badge)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
                              >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-cyan-700 shadow-sm ring-1 ring-slate-100">
                                  {employee.initials}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-black text-slate-950">
                                    {employee.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs font-bold text-slate-500">
                                    {employee.badge} · {employee.specialty}
                                  </span>
                                </span>
                                <span className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-black text-white">
                                  Add
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                              No matching employees for this role/search. Try badge, name, or specialty.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                              Authorized for this phase
                            </div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              Selected signers only
                            </div>
                          </div>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-700 ring-1 ring-cyan-100">
                            {selectedBadges.length} selected
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedEmployees.length ? (
                            selectedEmployees.map(employee => (
                              <div
                                key={`${phase.key}-selected-${employee.badge}`}
                                className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3"
                              >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-sm font-black text-white shadow-sm">
                                  {employee.initials}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-black text-slate-950">
                                    {employee.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs font-bold text-slate-500">
                                    {employee.badge} · {employee.status}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleAuthorizedEmployee(phase.key, employee.badge)}
                                  className="rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 p-4 text-center text-xs font-bold text-cyan-800">
                              No authorized employees selected yet. Add at least one signer before saving.
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                            <Search className="h-3.5 w-3.5" /> Gate badges
                          </span>
                          {selectedBadges.map(badge => (
                            <span key={badge} className="rounded-full bg-cyan-50 px-3 py-1 font-black text-cyan-700 ring-1 ring-cyan-100">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
              Professional rule: phase update is not a free action. The user
              must enter a badge/signature ID belonging to one of the selected employee cards for the target phase. Assignments are saved to backend tables and validated by the phase gate API before any phase update.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenPhaseAssignment(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignments}
                disabled={saveAssignmentsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {openBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Bulk Add Blinds from Excel
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Paste rows copied from Excel. Columns: Blind No, Tag No,
                    Line No, Size, Rating, Type, Priority, Location Note.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenBulk(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none focus:border-cyan-400"
            />
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
              Tip: copy directly from Excel; tab-separated rows are supported.
              Status, phase, and owner are not imported because workflow
              controls them.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenBulk(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={importBulk}
                disabled={createBlindMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
              >
                <Upload className="h-4 w-4" /> Import Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
