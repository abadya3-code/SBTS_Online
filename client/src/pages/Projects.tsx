import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Edit3, FolderKanban, FolderPlus, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ProjectForm = { id?: string; projectNo: string; name: string; areaId: string; maintenanceReason: string; startDate: string; targetDate: string };
const emptyProjectForm: ProjectForm = { projectNo: "", name: "", areaId: "", maintenanceReason: "", startDate: "", targetDate: "" };

function statusClass(status: string) {
  if (status === "Completed") return "bg-emerald-600 text-white";
  if (status === "Final Review") return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (status === "Active") return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const areasQuery = trpc.core.areas.useQuery(undefined, { staleTime: 30_000 });
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 30_000 });
  const areas = areasQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState(() => new URLSearchParams(window.location.search).get("area") ?? "all");
  const areaLocked = areaFilter !== "all";
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);

  const selectedArea = areas.find((area) => area.id === areaFilter);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => {
      const areaOk = areaFilter === "all" || project.areaId === areaFilter;
      const searchOk = !q || [project.projectNo, project.name, project.areaCode, project.areaName, project.status].some((value) => String(value).toLowerCase().includes(q));
      return areaOk && searchOk;
    });
  }, [projects, areaFilter, search]);

  const createProjectMutation = trpc.core.createProject.useMutation({
    onSuccess: async (project) => {
      toast.success(`${project.projectNo} created successfully`);
      setForm(emptyProjectForm);
      setOpen(false);
      await Promise.all([utils.core.projects.invalidate(), utils.core.dashboardSummary.invalidate()]);
      setLocation(`/projects/${project.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateProjectMutation = trpc.core.updateProject.useMutation({
    onSuccess: async (project) => {
      toast.success(`${project.projectNo} updated`);
      setForm(emptyProjectForm);
      setOpen(false);
      await Promise.all([utils.core.projects.invalidate(), utils.core.dashboardSummary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProjectMutation = trpc.core.deleteProject.useMutation({
    onSuccess: async () => {
      toast.success("Project deleted");
      await Promise.all([utils.core.projects.invalidate(), utils.core.dashboardSummary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  function openCreate() {
    setForm({ ...emptyProjectForm, areaId: areaFilter !== "all" ? areaFilter : areas[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(project: typeof projects[number]) {
    setForm({
      id: project.id,
      projectNo: project.projectNo,
      name: project.name,
      areaId: project.areaId,
      maintenanceReason: (project as any).maintenanceReason ?? "",
      startDate: project.startDate ?? "",
      targetDate: project.targetDate ?? "",
    });
    setOpen(true);
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedAreaId = form.areaId || areas[0]?.id;
    if (!selectedAreaId) {
      toast.error("Create an Area first from the Areas page.");
      return;
    }
    const payload = {
      projectNo: form.projectNo,
      name: form.name,
      areaId: selectedAreaId,
      workflowId: "wf-shutdown-standard",
      maintenanceReason: form.maintenanceReason || null,
      startDate: form.startDate || null,
      targetDate: form.targetDate || null,
    };
    if (form.id) updateProjectMutation.mutate({ id: form.id, ...payload });
    else createProjectMutation.mutate(payload);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Control"
        title={selectedArea ? `Projects · ${selectedArea.code}` : "Projects"}
        description={selectedArea ? `Showing projects inside ${selectedArea.name}. Project status is auto-calculated from blind progress.` : "Create and manage project workspaces. Status is no longer entered manually; it follows actual progress from the blinds inside each project."}
        actions={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Plus className="h-4 w-4" /> Add Project</button>}
      />


      <section className="sbts-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-extrabold text-slate-950">Project Register</h2><p className="text-sm font-semibold text-slate-500">Open, edit, or delete project containers. Deleting is blocked when blinds are linked.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-[240px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full bg-transparent outline-none" /></label>
            {areaLocked ? <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-sm font-extrabold text-cyan-900">Area locked: {selectedArea?.code} · {selectedArea?.name}</div> : <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Search is limited to projects. Open an Area card to work inside that area.</div>}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <article key={project.id} className="sbts-card p-5 transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,39,56,0.13)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">{project.projectNo}</div><h3 className="mt-2 text-lg font-extrabold text-slate-950">{project.name}</h3></div>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(project.status)}`}>{project.status}</span>
            </div>
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500"><MapPin className="h-4 w-4" /> {project.areaCode} · {project.areaName}</div>
            <div className="mb-3 flex items-center justify-between text-sm"><span className="font-bold text-slate-600">Auto Progress</span><span className="font-extrabold text-slate-950">{project.progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${project.progress}%` }} /></div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-bold text-slate-500"><div className="rounded-xl bg-slate-50 p-3">Blinds<br /><span className="text-slate-900">{project.blindCount}</span></div><div className="rounded-xl bg-slate-50 p-3">Start<br /><span className="text-slate-900">{project.startDate ?? "TBD"}</span></div><div className="rounded-xl bg-slate-50 p-3">Target<br /><span className="text-slate-900">{project.targetDate ?? "TBD"}</span></div></div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button onClick={() => setLocation(`/projects/${project.id}`)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg">Open Dashboard <ArrowRight className="h-4 w-4" /></button>
              <button onClick={(event) => { event.stopPropagation(); openEdit(project); }} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-700"><Edit3 className="h-4 w-4" /> Edit</button>
              <button onClick={(event) => { event.stopPropagation(); if (confirm(`Delete ${project.projectNo}?`)) deleteProjectMutation.mutate({ id: project.id }); }} className="inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-extrabold text-red-700"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </article>
        ))}
      </div>

      {filteredProjects.length === 0 && <div className="sbts-card p-8 text-center text-sm font-bold text-slate-500">No projects found for this area/filter.</div>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitProject} className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><FolderPlus className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-slate-950">{form.id ? "Edit Project" : "Add Project"}</h2><p className="text-sm font-semibold text-slate-500">Project status is calculated automatically from progress and blind completion.</p></div></div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input required value={form.projectNo} onChange={(e) => setForm({ ...form, projectNo: e.target.value })} placeholder="Project No e.g. PRJ-1050" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project Name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-900">Area: {areas.find(area => area.id === form.areaId)?.code ?? selectedArea?.code ?? "Open from Areas"} · {areas.find(area => area.id === form.areaId)?.name ?? selectedArea?.name ?? ""}</div>
              <textarea value={form.maintenanceReason} onChange={(e) => setForm({ ...form, maintenanceReason: e.target.value })} placeholder="Maintenance reason / project scope description" className="md:col-span-2 min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600">Cancel</button><button disabled={createProjectMutation.isPending || updateProjectMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"><FolderKanban className="h-4 w-4" /> Save Project</button></div>
          </form>
        </div>
      )}
    </div>
  );
}