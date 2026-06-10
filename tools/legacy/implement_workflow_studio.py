from pathlib import Path

root = Path('/home/ubuntu/sbts-professional')

mock_path = root / 'client/src/lib/mockData.ts'
mock = mock_path.read_text()
mock = mock.replace(
    'import { Activity, BarChart3, ClipboardCheck, FileText, FolderKanban, Gauge, ListChecks, LockKeyhole, MapPin, ShieldCheck, SlidersHorizontal, Users, Wrench } from "lucide-react";',
    'import { Activity, BarChart3, ClipboardCheck, FileText, FolderKanban, Gauge, GitBranch, ListChecks, LockKeyhole, ShieldCheck, SlidersHorizontal, Users, Wrench } from "lucide-react";'
)
mock = mock.replace(
    '  { key: "blinds", label: "Blinds", path: "/blinds", icon: ListChecks, description: "Blind registry and phases" },\n  { key: "access-control", label: "Access Control", path: "/access-control", icon: ShieldCheck, description: "Roles, permissions, workflow" },',
    '  { key: "blinds", label: "Blinds", path: "/blinds", icon: ListChecks, description: "Blind registry and phases" },\n  { key: "workflow-studio", label: "Workflow Studio", path: "/workflow-studio", icon: GitBranch, description: "Workflow builder and gates" },\n  { key: "access-control", label: "Access Control", path: "/access-control", icon: ShieldCheck, description: "Roles, permissions, workflow" },'
)
insert_after = '''export const phases: { key: PhaseKey; label: string; color: string; count: number; owner: string }[] = [\n  { key: "broken", label: "Broken / Preparation", color: "#ef4444", count: 16, owner: "Coordinator" },\n  { key: "assembly", label: "Assembly", color: "#f59e0b", count: 22, owner: "Technician" },\n  { key: "tightTorque", label: "Tight & Torque", color: "#eab308", count: 18, owner: "T&I Engineer" },\n  { key: "finalTight", label: "Final Tight", color: "#22c55e", count: 31, owner: "QC Inspector" },\n  { key: "inspectionReady", label: "Inspection Ready", color: "#3b82f6", count: 12, owner: "Inspection" },\n];\n'''
workflow_block = '''\nexport type WorkflowStatus = "Draft" | "Active" | "Locked";\n\nexport type WorkflowPhaseTemplate = {\n  id: string;\n  label: string;\n  phaseKey: PhaseKey;\n  roleKey: RoleKey;\n  requiredPermissionKey: string;\n  gate: string;\n  slaHours: number;\n  evidence: string[];\n  automation: string;\n  color: string;\n  isCritical: boolean;\n};\n\nexport type WorkflowTemplate = {\n  id: string;\n  name: string;\n  description: string;\n  status: WorkflowStatus;\n  projectType: string;\n  version: string;\n  phases: WorkflowPhaseTemplate[];\n};\n\nexport const workflowTemplates: WorkflowTemplate[] = [\n  {\n    id: "wf-shutdown-standard",\n    name: "Shutdown Blind Control",\n    description: "Standard route for blind installation, torque gate, and final inspection sign-off.",\n    status: "Active",\n    projectType: "Shutdown / Turnaround",\n    version: "1.4",\n    phases: [\n      { id: "wf-prepare", label: "Preparation & broken blind request", phaseKey: "broken", roleKey: "coordinator", requiredPermissionKey: "blinds.create", gate: "Area and line number must be verified before field execution starts.", slaHours: 6, evidence: ["Line list", "Isolation reference"], automation: "Notify Technician team when approved", color: "#ef4444", isCritical: true },\n      { id: "wf-assembly", label: "Assembly / installation execution", phaseKey: "assembly", roleKey: "technician", requiredPermissionKey: "workflow.approve", gate: "Technician confirms tag, size, blind type, and QR scan from site.", slaHours: 12, evidence: ["QR scan", "Field photo"], automation: "Escalate to Coordinator after SLA breach", color: "#f59e0b", isCritical: false },\n      { id: "wf-torque", label: "Tight & Torque validation", phaseKey: "tightTorque", roleKey: "tiEngineer", requiredPermissionKey: "workflow.approve", gate: "Torque values and flange condition must be signed by T&I Engineering.", slaHours: 8, evidence: ["Torque sheet", "Tool calibration"], automation: "Unlock Final Tight only after approval", color: "#eab308", isCritical: true },\n      { id: "wf-final", label: "Final Tight quality sign-off", phaseKey: "finalTight", roleKey: "qc", requiredPermissionKey: "workflow.approve", gate: "QC inspector verifies final tight and records acceptance.", slaHours: 8, evidence: ["QC checklist", "Inspector signature"], automation: "Create audit event and update dashboard", color: "#22c55e", isCritical: true },\n      { id: "wf-inspection", label: "Inspection ready handover", phaseKey: "inspectionReady", roleKey: "inspection", requiredPermissionKey: "reports.view", gate: "Inspection team can view final status and release certificate package.", slaHours: 10, evidence: ["Final report", "Certificate reference"], automation: "Notify project stakeholders", color: "#3b82f6", isCritical: false },\n    ],\n  },\n  {\n    id: "wf-maintenance-lite",\n    name: "Maintenance Quick Route",\n    description: "Lean workflow for short maintenance scopes that still requires centralized permission ownership.",\n    status: "Draft",\n    projectType: "Maintenance",\n    version: "0.8",\n    phases: [\n      { id: "wf-lite-request", label: "Request validation", phaseKey: "broken", roleKey: "coordinator", requiredPermissionKey: "projects.view", gate: "Coordinator validates scope and allowed area.", slaHours: 4, evidence: ["Scope note"], automation: "Open task list for Technician", color: "#ef4444", isCritical: false },\n      { id: "wf-lite-execute", label: "Field execution", phaseKey: "assembly", roleKey: "technician", requiredPermissionKey: "blinds.phase.change", gate: "Technician updates blind state from mobile QR scan.", slaHours: 8, evidence: ["QR scan"], automation: "Notify QC when complete", color: "#f59e0b", isCritical: false },\n      { id: "wf-lite-close", label: "QC closeout", phaseKey: "finalTight", roleKey: "qc", requiredPermissionKey: "workflow.approve", gate: "QC reviews closeout evidence and locks the record.", slaHours: 6, evidence: ["Closeout note"], automation: "Write audit log entry", color: "#22c55e", isCritical: true },\n    ],\n  },\n];\n'''
if 'export type WorkflowStatus' not in mock:
    mock = mock.replace(insert_after, insert_after + workflow_block)
mock_path.write_text(mock)

workflow_page = r'''/*
Design Philosophy: Industrial Command Center Minimalism.
Workflow Studio is a controlled engineering workbench: every phase, gate, permission, and role owner is visible in one command surface so workflow design does not drift away from access governance.
*/
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Copy, GitBranch, Layers3, Link2, Plus, Save, ShieldCheck, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { initialRoles, permissionGroups, workflowTemplates, type PhaseKey, type RoleKey, type RoleModel, type WorkflowPhaseTemplate, type WorkflowStatus, type WorkflowTemplate } from "@/lib/mockData";

const allPermissions = permissionGroups.flatMap((group) => group.permissions);
const phaseOptions: { key: PhaseKey; label: string; color: string }[] = [
  { key: "broken", label: "Broken / Preparation", color: "#ef4444" },
  { key: "assembly", label: "Assembly", color: "#f59e0b" },
  { key: "tightTorque", label: "Tight & Torque", color: "#eab308" },
  { key: "finalTight", label: "Final Tight", color: "#22c55e" },
  { key: "inspectionReady", label: "Inspection Ready", color: "#3b82f6" },
];
const statusOptions: WorkflowStatus[] = ["Draft", "Active", "Locked"];

function phaseFactory(index: number, roleKey: RoleKey): WorkflowPhaseTemplate {
  const option = phaseOptions[Math.min(index, phaseOptions.length - 1)];
  return {
    id: `wf-custom-${Date.now()}-${index}`,
    label: `${option.label} phase`,
    phaseKey: option.key,
    roleKey,
    requiredPermissionKey: "workflow.approve",
    gate: "Define the operational condition that must be satisfied before this phase can move forward.",
    slaHours: 8,
    evidence: ["QR scan"],
    automation: "Create audit log entry when phase is approved",
    color: option.color,
    isCritical: false,
  };
}

function permissionLabel(key: string) {
  return allPermissions.find((permission) => permission.key === key)?.label ?? key;
}

function roleName(roles: RoleModel[], key: string) {
  return roles.find((role) => role.key === key)?.name ?? key;
}

function complianceScore(workflow: WorkflowTemplate, roles: RoleModel[]) {
  const aligned = workflow.phases.filter((phase) => roles.find((role) => role.key === phase.roleKey)?.permissionKeys.includes(phase.requiredPermissionKey)).length;
  return Math.round((aligned / Math.max(workflow.phases.length, 1)) * 100);
}

export default function WorkflowStudio() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(workflowTemplates);
  const [roles, setRoles] = useState<RoleModel[]>(initialRoles);
  const [activeWorkflowId, setActiveWorkflowId] = useState(workflowTemplates[0].id);
  const [activePhaseId, setActivePhaseId] = useState(workflowTemplates[0].phases[0].id);

  const activeWorkflow = useMemo(() => workflows.find((workflow) => workflow.id === activeWorkflowId) ?? workflows[0], [workflows, activeWorkflowId]);
  const activePhase = useMemo(() => activeWorkflow.phases.find((phase) => phase.id === activePhaseId) ?? activeWorkflow.phases[0], [activeWorkflow, activePhaseId]);
  const selectedRole = roles.find((role) => role.key === activePhase.roleKey) ?? roles[0];
  const roleHasPermission = selectedRole.permissionKeys.includes(activePhase.requiredPermissionKey);
  const score = complianceScore(activeWorkflow, roles);

  function updateWorkflow(updater: (workflow: WorkflowTemplate) => WorkflowTemplate) {
    setWorkflows((current) => current.map((workflow) => (workflow.id === activeWorkflow.id ? updater(workflow) : workflow)));
  }

  function updateWorkflowField<K extends keyof WorkflowTemplate>(key: K, value: WorkflowTemplate[K]) {
    updateWorkflow((workflow) => ({ ...workflow, [key]: value }));
  }

  function updatePhase(updater: (phase: WorkflowPhaseTemplate) => WorkflowPhaseTemplate) {
    updateWorkflow((workflow) => ({
      ...workflow,
      phases: workflow.phases.map((phase) => (phase.id === activePhase.id ? updater(phase) : phase)),
    }));
  }

  function updatePhaseField<K extends keyof WorkflowPhaseTemplate>(key: K, value: WorkflowPhaseTemplate[K]) {
    updatePhase((phase) => ({ ...phase, [key]: value }));
  }

  function addPhase() {
    const nextPhase = phaseFactory(activeWorkflow.phases.length, roles[0].key);
    updateWorkflow((workflow) => ({ ...workflow, phases: [...workflow.phases, nextPhase] }));
    setActivePhaseId(nextPhase.id);
    toast.success("New workflow phase added to the draft model.");
  }

  function removePhase() {
    if (activeWorkflow.phases.length === 1) {
      toast.error("A workflow must keep at least one phase.");
      return;
    }
    const currentIndex = activeWorkflow.phases.findIndex((phase) => phase.id === activePhase.id);
    const nextPhase = activeWorkflow.phases[currentIndex - 1] ?? activeWorkflow.phases[currentIndex + 1];
    updateWorkflow((workflow) => ({ ...workflow, phases: workflow.phases.filter((phase) => phase.id !== activePhase.id) }));
    setActivePhaseId(nextPhase.id);
    toast.info("Phase removed from workflow draft.");
  }

  function movePhase(direction: -1 | 1) {
    const index = activeWorkflow.phases.findIndex((phase) => phase.id === activePhase.id);
    const target = index + direction;
    if (target < 0 || target >= activeWorkflow.phases.length) return;
    updateWorkflow((workflow) => {
      const next = [...workflow.phases];
      const [phase] = next.splice(index, 1);
      next.splice(target, 0, phase);
      return { ...workflow, phases: next };
    });
  }

  function duplicateWorkflow() {
    const copy: WorkflowTemplate = {
      ...activeWorkflow,
      id: `${activeWorkflow.id}-copy-${Date.now()}`,
      name: `${activeWorkflow.name} Copy`,
      status: "Draft",
      version: "0.1",
      phases: activeWorkflow.phases.map((phase, index) => ({ ...phase, id: `${phase.id}-copy-${Date.now()}-${index}` })),
    };
    setWorkflows((current) => [...current, copy]);
    setActiveWorkflowId(copy.id);
    setActivePhaseId(copy.phases[0].id);
    toast.info("Workflow duplicated as a draft template.");
  }

  function createWorkflow() {
    const firstPhase = phaseFactory(0, "coordinator");
    const draft: WorkflowTemplate = {
      id: `wf-new-${Date.now()}`,
      name: "New controlled workflow",
      description: "Define purpose, ownership, permissions, gates, and evidence requirements before activation.",
      status: "Draft",
      projectType: "Custom project type",
      version: "0.1",
      phases: [firstPhase],
    };
    setWorkflows((current) => [...current, draft]);
    setActiveWorkflowId(draft.id);
    setActivePhaseId(firstPhase.id);
    toast.success("Blank workflow created. Start by editing the first phase.");
  }

  function syncRequiredPermission() {
    if (roleHasPermission) {
      toast.info("Selected role already has the required permission.");
      return;
    }
    setRoles((current) => current.map((role) => role.key === selectedRole.key ? { ...role, permissionKeys: [...role.permissionKeys, activePhase.requiredPermissionKey] } : role));
    toast.success(`${selectedRole.name} synced with ${permissionLabel(activePhase.requiredPermissionKey)} permission.`);
  }

  function saveDraft() {
    toast.success("Workflow draft saved locally. The Node + PostgreSQL phase will persist it to workflow tables.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workflow governance"
        title="Workflow Studio"
        description="Create, edit, and validate operational workflow routes while keeping every phase tied to role ownership and system permissions from the centralized access model."
        actions={
          <>
            <Link href="/access-control" className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-extrabold text-cyan-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-100">
              <ShieldCheck className="h-4 w-4" /> Access model
            </Link>
            <button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">
              <Save className="h-4 w-4" /> Save workflow
            </button>
          </>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[330px_1fr_390px]">
        <aside className="sbts-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-950">Workflow templates</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Routes connected to RBAC.</p>
              </div>
              <button onClick={createWorkflow} className="rounded-2xl bg-cyan-50 p-2.5 text-cyan-700 ring-1 ring-cyan-100 transition hover:bg-cyan-100" aria-label="Create workflow">
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {workflows.map((workflow) => {
              const active = workflow.id === activeWorkflow.id;
              const workflowScore = complianceScore(workflow, roles);
              return (
                <button key={workflow.id} onClick={() => { setActiveWorkflowId(workflow.id); setActivePhaseId(workflow.phases[0].id); }} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-cyan-200 bg-cyan-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold text-slate-950">{workflow.name}</div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{workflow.projectType} · v{workflow.version}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{workflow.phases.length}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phases</div></div>
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{workflowScore}%</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aligned</div></div>
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{workflow.status}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="sbts-card p-5">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr_0.45fr_0.35fr]">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Workflow name</span>
                <input value={activeWorkflow.name} onChange={(event) => updateWorkflowField("name", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Project type</span>
                <input value={activeWorkflow.projectType} onChange={(event) => updateWorkflowField("projectType", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status</span>
                <select value={activeWorkflow.status} onChange={(event) => updateWorkflowField("status", event.target.value as WorkflowStatus)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Version</span>
                <input value={activeWorkflow.version} onChange={(event) => updateWorkflowField("version", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
              </label>
            </div>
            <textarea value={activeWorkflow.description} onChange={(event) => updateWorkflowField("description", event.target.value)} className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
          </div>

          <div className="sbts-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950">Interactive phase route</h3>
                <p className="mt-1 text-sm text-slate-500">Select any phase to edit owner role, required permission, gates, evidence, and automation rules.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={duplicateWorkflow} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"><Copy className="h-4 w-4" /> Duplicate</button>
                <button onClick={addPhase} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-cyan-400"><Plus className="h-4 w-4" /> Add phase</button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {activeWorkflow.phases.map((phase, index) => {
                const selected = phase.id === activePhase.id;
                const owner = roles.find((role) => role.key === phase.roleKey);
                const aligned = owner?.permissionKeys.includes(phase.requiredPermissionKey) ?? false;
                return (
                  <button key={phase.id} onClick={() => setActivePhaseId(phase.id)} className={`group w-full rounded-[1.35rem] border p-4 text-left transition ${selected ? "border-cyan-300 bg-cyan-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex items-center gap-4 xl:w-[38%]">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: phase.color }}>
                          <span className="text-sm font-extrabold">{index + 1}</span>
                          {index < activeWorkflow.phases.length - 1 && <span className="absolute left-1/2 top-full hidden h-8 w-px -translate-x-1/2 bg-slate-200 xl:block" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-extrabold text-slate-950">{phase.label}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span>{roleName(roles, phase.roleKey)}</span><span>·</span><span>{permissionLabel(phase.requiredPermissionKey)}</span></div>
                        </div>
                      </div>
                      <div className="grid flex-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gate</div><div className="mt-1 truncate text-xs font-bold text-slate-700">{phase.gate}</div></div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SLA</div><div className="mt-1 text-xs font-bold text-slate-700">{phase.slaHours} hours</div></div>
                        <div className={`rounded-2xl px-3 py-2 ring-1 ${aligned ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-amber-50 text-amber-900 ring-amber-100"}`}><div className="text-[10px] font-bold uppercase tracking-wider opacity-70">RBAC</div><div className="mt-1 flex items-center gap-1.5 text-xs font-extrabold">{aligned ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{aligned ? "Aligned" : "Needs sync"}</div></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="sbts-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold">Phase editor</h3>
                  <p className="mt-1 text-xs font-medium text-slate-300">Change phase logic and access ownership.</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => movePhase(-1)} className="rounded-xl bg-white/10 p-2 text-slate-200 transition hover:bg-white/20" aria-label="Move phase up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => movePhase(1)} className="rounded-xl bg-white/10 p-2 text-slate-200 transition hover:bg-white/20" aria-label="Move phase down"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={removePhase} className="rounded-xl bg-red-400/15 p-2 text-red-100 transition hover:bg-red-400/25" aria-label="Remove phase"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Phase label</span>
                <input value={activePhase.label} onChange={(event) => updatePhaseField("label", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Phase family</span>
                  <select value={activePhase.phaseKey} onChange={(event) => {
                    const next = phaseOptions.find((option) => option.key === event.target.value)!;
                    updatePhase((phase) => ({ ...phase, phaseKey: next.key, color: next.color }));
                  }} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100">
                    {phaseOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Owner role</span>
                  <select value={activePhase.roleKey} onChange={(event) => updatePhaseField("roleKey", event.target.value as RoleKey)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100">
                    {roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Required permission</span>
                <select value={activePhase.requiredPermissionKey} onChange={(event) => updatePhaseField("requiredPermissionKey", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100">
                  {permissionGroups.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.permissions.map((permission) => <option key={permission.key} value={permission.key}>{permission.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>

              <div className={`rounded-2xl border p-4 ${roleHasPermission ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${roleHasPermission ? "bg-emerald-600 text-white" : "bg-amber-400 text-slate-950"}`}>
                    {roleHasPermission ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className={`text-sm font-extrabold ${roleHasPermission ? "text-emerald-900" : "text-amber-950"}`}>{roleHasPermission ? "Permission model aligned" : "Permission sync required"}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{selectedRole.name} {roleHasPermission ? "already owns" : "does not yet own"} the required permission: {permissionLabel(activePhase.requiredPermissionKey)}.</p>
                    {!roleHasPermission && <button onClick={syncRequiredPermission} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800"><Link2 className="h-4 w-4" /> Sync to role</button>}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Gate condition</span>
                <textarea value={activePhase.gate} onChange={(event) => updatePhaseField("gate", event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
              </label>

              <div className="grid gap-3 sm:grid-cols-[0.55fr_1fr] 2xl:grid-cols-1">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">SLA hours</span>
                  <input type="number" min="1" value={activePhase.slaHours} onChange={(event) => updatePhaseField("slaHours", Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Evidence required</span>
                  <input value={activePhase.evidence.join(", ")} onChange={(event) => updatePhaseField("evidence", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Automation</span>
                <input value={activePhase.automation} onChange={(event) => updatePhaseField("automation", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" />
              </label>

              <button onClick={() => updatePhaseField("isCritical", !activePhase.isCritical)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${activePhase.isCritical ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                <span><span className="block text-sm font-extrabold">Critical gate</span><span className="mt-1 block text-xs opacity-75">Requires stricter review before next phase.</span></span>
                <span className={`h-6 w-11 rounded-full p-1 transition ${activePhase.isCritical ? "bg-red-500" : "bg-slate-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${activePhase.isCritical ? "translate-x-5" : "translate-x-0"}`} /></span>
              </button>
            </div>
          </section>

          <section className="sbts-card p-5">
            <div className="mb-4 flex items-center gap-3"><Layers3 className="h-5 w-5 text-cyan-700" /><h3 className="font-extrabold text-slate-950">Governance summary</h3></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><div className="text-xl font-extrabold text-slate-950">{score}%</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aligned</div></div>
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><div className="text-xl font-extrabold text-slate-950">{activeWorkflow.phases.filter((phase) => phase.isCritical).length}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Critical</div></div>
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><div className="text-xl font-extrabold text-slate-950">{new Set(activeWorkflow.phases.map((phase) => phase.roleKey)).size}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roles</div></div>
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950">
              This studio is intentionally connected to the same role and permission catalog used by Access Control. Backend persistence should map this model to workflow_templates, workflow_phases, phase_role_owners, phase_permission_requirements, and workflow_audit_rules.
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
'''
(root / 'client/src/pages/WorkflowStudio.tsx').write_text(workflow_page)

app_path = root / 'client/src/App.tsx'
app = app_path.read_text()
if 'WorkflowStudio' not in app:
    app = app.replace('import Blinds from "./pages/Blinds";\n', 'import Blinds from "./pages/Blinds";\nimport WorkflowStudio from "./pages/WorkflowStudio";\n')
    app = app.replace('        <Route path="/blinds" component={Blinds} />\n        <Route path="/access-control" component={AccessControl} />', '        <Route path="/blinds" component={Blinds} />\n        <Route path="/workflow-studio" component={WorkflowStudio} />\n        <Route path="/access-control" component={AccessControl} />')
app_path.write_text(app)

access_path = root / 'client/src/pages/AccessControl.tsx'
access = access_path.read_text()
if 'from "wouter"' not in access:
    access = access.replace('import { useMemo, useState } from "react";\n', 'import { useMemo, useState } from "react";\nimport { Link } from "wouter";\n')
if 'Open Workflow Studio' not in access:
    access = access.replace(
        'import { Check, ChevronRight, Copy, Eye, GitBranch, LockKeyhole, Plus, Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";',
        'import { Check, ChevronRight, Copy, Eye, GitBranch, LockKeyhole, Plus, Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";'
    )
    access = access.replace(
        '                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950">\n                  Workflow ownership is controlled by role templates. If a role owns a phase, users in that role can see and act on the corresponding phase tasks according to their system permissions.\n                </div>',
        '                <div className="flex flex-col gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950 lg:flex-row lg:items-center lg:justify-between">\n                  <p>Workflow ownership is controlled by role templates. If a role owns a phase, users in that role can see and act on the corresponding phase tasks according to their system permissions.</p>\n                  <Link href="/workflow-studio" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-slate-800">\n                    <GitBranch className="h-4 w-4" /> Open Workflow Studio\n                  </Link>\n                </div>'
    )
access_path.write_text(access)

todo_path = root / 'todo.md'
todo = todo_path.read_text()
todo = todo.replace('- [ ] مراجعة ملفات الواجهة الحالية لتحديد مسارات التنقل ومصادر بيانات الأدوار والصلاحيات.', '- [x] مراجعة ملفات الواجهة الحالية لتحديد مسارات التنقل ومصادر بيانات الأدوار والصلاحيات.')
todo = todo.replace('- [ ] إنشاء نموذج بيانات Frontend لمسارات العمل يشمل المراحل، الدور المسؤول، صلاحيات الاعتماد، الشروط، والتنبيهات.', '- [x] إنشاء نموذج بيانات Frontend لمسارات العمل يشمل المراحل، الدور المسؤول، صلاحيات الاعتماد، الشروط، والتنبيهات.')
todo = todo.replace('- [ ] تنفيذ صفحة Workflow Studio تفاعلية لإنشاء وتعديل مسارات العمل وربط كل مرحلة بدور وصلاحيات محددة.', '- [x] تنفيذ صفحة Workflow Studio تفاعلية لإنشاء وتعديل مسارات العمل وربط كل مرحلة بدور وصلاحيات محددة.')
todo = todo.replace('- [ ] تحديث الشريط الجانبي والروابط لإضافة Workflow Studio كميزة مركزية مرتبطة بـ Access Control.', '- [x] تحديث الشريط الجانبي والروابط لإضافة Workflow Studio كميزة مركزية مرتبطة بـ Access Control.')
todo = todo.replace('- [ ] إضافة روابط واضحة بين Access Control و Workflow Studio لتأكيد أن الصلاحيات والمهام تدار من نموذج واحد.', '- [x] إضافة روابط واضحة بين Access Control و Workflow Studio لتأكيد أن الصلاحيات والمهام تدار من نموذج واحد.')
todo_path.write_text(todo)

print('Workflow Studio implementation files written successfully.')
