import { useMemo, useState, type FormEvent } from "react";
import { ClipboardList, Eye, Plus, QrCode, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const blindTypes = ["Slip Blind", "Spectacle Blind", "Spacer", "Drop Spool", "Blind Flange"];
const priorities = ["Low", "Normal", "High", "Critical"] as const;
const phaseOptions = ["broken", "assembly", "tightTorque", "finalTight", "inspectionReady"] as const;
const roleOptions = ["coordinator", "technician", "tiEngineer", "qc", "inspection", "metalForeman", "safety"] as const;
type BlindForm = { blindNo: string; tagNo: string; projectId: string; areaId: string; lineNo: string; size: string; rating: string; blindType: string; currentPhaseKey: string; ownerRoleKey: string; priority: string; locationNote: string };
const emptyForm: BlindForm = { blindNo: "", tagNo: "", projectId: "", areaId: "", lineNo: "", size: "", rating: "300#", blindType: "Slip Blind", currentPhaseKey: "broken", ownerRoleKey: "coordinator", priority: "Normal", locationNote: "" };

export default function Blinds() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const blindsQuery = trpc.core.blinds.useQuery(undefined, { staleTime: 30_000 });
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 30_000 });
  const areasQuery = trpc.core.areas.useQuery(undefined, { staleTime: 30_000 });
  const rows = blindsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const initialProjectFilter = new URLSearchParams(location.split("?")[1] ?? "").get("project") ?? "all";
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [form, setForm] = useState<BlindForm>(emptyForm);

  const selectedProject = useMemo(() => projects.find((project) => project.id === (form.projectId || projects[0]?.id)), [form.projectId, projects]);
  const selectedAreaId = form.areaId || selectedProject?.areaId || areas[0]?.id || "";

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((blind) => {
      const projectOk = projectFilter === "all" || blind.projectId === projectFilter;
      const phaseOk = phaseFilter === "all" || blind.currentPhaseKey === phaseFilter;
      const searchOk = !q || [blind.tagNo, blind.blindNo, blind.lineNo, blind.projectName, blind.areaCode, blind.blindType, blind.status].some((value) => String(value).toLowerCase().includes(q));
      return projectOk && phaseOk && searchOk;
    });
  }, [rows, search, projectFilter, phaseFilter]);

  const createBlindMutation = trpc.core.createBlind.useMutation({
    onSuccess: async (blind) => {
      toast.success(`${blind.tagNo} created successfully`);
      setForm(emptyForm);
      setOpen(false);
      await Promise.all([utils.core.blinds.invalidate(), utils.core.projects.invalidate(), utils.core.dashboardSummary.invalidate()]);
      setLocation(`/blinds/${blind.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  function submitBlind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const projectId = form.projectId || projects[0]?.id;
    const areaId = selectedAreaId;
    if (!projectId || !areaId) { toast.error("Create an Area and Project first."); return; }
    createBlindMutation.mutate({
      blindNo: form.blindNo,
      tagNo: form.tagNo,
      projectId,
      areaId,
      lineNo: form.lineNo,
      size: form.size,
      rating: form.rating || null,
      blindType: form.blindType,
      currentPhaseKey: form.currentPhaseKey as (typeof phaseOptions)[number],
      ownerRoleKey: form.ownerRoleKey as (typeof roleOptions)[number],
      priority: form.priority as (typeof priorities)[number],
      status: "Open",
      locationNote: form.locationNote || null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Blind Registry"
        title="Blinds Registry"
        description="Search, filter, and open Blind Details. New blind creation is now behind an action button for cleaner layout."
        actions={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Plus className="h-4 w-4" /> Add Blind</button>}
      />


      <section className="sbts-card p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blind, tag, line, project..." className="w-full bg-transparent outline-none" /></label>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400"><option value="all">All Projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectNo}</option>)}</select>
          <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400"><option value="all">All Phases</option>{phaseOptions.map((phase) => <option key={phase} value={phase}>{phase}</option>)}</select>
          <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Add</button>
        </div>
      </section>

      <section className="sbts-card overflow-hidden">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-extrabold text-slate-950">Registry Table</h2><p className="text-sm font-semibold text-slate-500">{filteredRows.length} visible record(s)</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Blind</th><th className="px-5 py-3">Project / Area</th><th className="px-5 py-3">Line</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">QR</th><th className="px-5 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((blind) => <tr key={blind.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-extrabold text-slate-950">{blind.tagNo}<div className="text-xs font-semibold text-slate-500">{blind.blindNo} · {blind.blindType}</div></td><td className="px-5 py-4 font-bold text-slate-600">{blind.projectName}<div className="text-xs text-slate-400">{blind.areaCode}</div></td><td className="px-5 py-4 font-bold text-slate-600">{blind.lineNo}<div className="text-xs text-slate-400">{blind.size} / {blind.rating ?? "N/A"}</div></td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 ring-1 ring-cyan-100">{blind.phaseLabel}</span><div className="mt-1 text-xs font-semibold text-slate-400">{blind.status}</div></td><td className="px-5 py-4 font-bold text-slate-600">{blind.ownerLabel}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${blind.priority === "High" || blind.priority === "Critical" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{blind.priority}</span></td><td className="px-5 py-4"><QrCode className="h-5 w-5 text-slate-400" /></td><td className="px-5 py-4"><button onClick={() => setLocation(`/blinds/${blind.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white"><Eye className="h-4 w-4" /> Details</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitBlind} className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><ClipboardList className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-slate-950">Add Blind</h2><p className="text-sm font-semibold text-slate-500">Focused modal action. Project and Area are selected here without cluttering the registry.</p></div></div><button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.projectId || projects[0]?.id || ""} onChange={(e) => setForm({ ...form, projectId: e.target.value, areaId: projects.find((p) => p.id === e.target.value)?.areaId ?? form.areaId })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{projects.map((project) => <option key={project.id} value={project.id}>{project.projectNo} · {project.name}</option>)}</select>
              <select value={selectedAreaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{areas.map((area) => <option key={area.id} value={area.id}>{area.code} · {area.name}</option>)}</select>
              <input required value={form.blindNo} onChange={(e) => setForm({ ...form, blindNo: e.target.value })} placeholder="Blind No e.g. BL-4401" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.tagNo} onChange={(e) => setForm({ ...form, tagNo: e.target.value })} placeholder="Tag No e.g. SB-4401" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.lineNo} onChange={(e) => setForm({ ...form, lineNo: e.target.value })} placeholder="Line No" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="Size e.g. 10 in" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="Rating" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <select value={form.blindType} onChange={(e) => setForm({ ...form, blindType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{blindTypes.map((type) => <option key={type}>{type}</option>)}</select>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
              <select value={form.currentPhaseKey} onChange={(e) => setForm({ ...form, currentPhaseKey: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{phaseOptions.map((phase) => <option key={phase} value={phase}>{phase}</option>)}</select>
              <select value={form.ownerRoleKey} onChange={(e) => setForm({ ...form, ownerRoleKey: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</select>
              <textarea value={form.locationNote} onChange={(e) => setForm({ ...form, locationNote: e.target.value })} placeholder="Location note" className="md:col-span-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600">Cancel</button><button disabled={createBlindMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"><Plus className="h-4 w-4" /> Save Blind</button></div>
          </form>
        </div>
      )}
    </div>
  );
}