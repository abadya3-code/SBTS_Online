import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Edit3, MapPinned, Plus, Search, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AreaForm = { id?: string; code: string; name: string; plant: string; description: string };
const emptyAreaForm: AreaForm = { code: "", name: "", plant: "Shedgum Gas Plant", description: "" };

export default function Areas() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const areasQuery = trpc.core.areas.useQuery(undefined, { staleTime: 30_000 });
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 30_000 });
  const areas = areasQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<AreaForm>(emptyAreaForm);
  const isEditing = Boolean(form.id);

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((area) => [area.code, area.name, area.plant, area.description].some((value) => String(value ?? "").toLowerCase().includes(q)));
  }, [areas, search]);

  const createAreaMutation = trpc.core.createArea.useMutation({
    onSuccess: async () => {
      toast.success("Area created successfully");
      closeModal();
      await Promise.all([utils.core.areas.invalidate(), utils.core.dashboardSummary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateAreaMutation = trpc.core.updateArea.useMutation({
    onSuccess: async () => {
      toast.success("Area updated successfully");
      closeModal();
      await Promise.all([utils.core.areas.invalidate(), utils.core.projects.invalidate(), utils.core.blinds.invalidate(), utils.core.dashboardSummary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAreaMutation = trpc.core.deleteArea.useMutation({
    onSuccess: async () => {
      toast.success("Area deleted successfully");
      await Promise.all([utils.core.areas.invalidate(), utils.core.dashboardSummary.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  function closeModal() {
    setForm(emptyAreaForm);
    setOpen(false);
  }

  function openCreateModal() {
    setForm(emptyAreaForm);
    setOpen(true);
  }

  function openEditModal(area: (typeof areas)[number]) {
    setForm({
      id: area.id,
      code: area.code,
      name: area.name,
      plant: area.plant,
      description: area.description ?? "",
    });
    setOpen(true);
  }

  function submitArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      code: form.code,
      name: form.name,
      plant: form.plant,
      status: "Active" as const,
      description: form.description || null,
    };

    if (form.id) {
      updateAreaMutation.mutate({ id: form.id, ...payload });
      return;
    }

    createAreaMutation.mutate(payload);
  }

  function deleteArea(area: (typeof areas)[number]) {
    const linkedProjects = projects.filter((project) => project.areaId === area.id).length;
    const message = linkedProjects > 0
      ? `This area has ${linkedProjects} linked project(s). Move or delete those projects first before deleting the area.`
      : `Delete ${area.code} · ${area.name}?`;

    if (linkedProjects > 0) {
      toast.error(message);
      return;
    }

    if (window.confirm(message)) {
      deleteAreaMutation.mutate({ id: area.id });
    }
  }

  function openAreaProjects(areaId: string) {
    setLocation(`/projects?area=${encodeURIComponent(areaId)}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Area Management"
        title="Areas"
        description="Manage plant areas as clean operational boundaries. Each area opens its linked projects directly."
        actions={<button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Plus className="h-4 w-4" /> Add Area</button>}
      />


      <div className="grid gap-4 md:grid-cols-3">
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Areas</div><div className="mt-2 text-3xl font-black text-slate-950">{areas.length}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Linked Projects</div><div className="mt-2 text-3xl font-black text-cyan-700">{projects.length}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Navigation</div><div className="mt-2 text-lg font-black text-slate-950">Area → Projects</div></div>
      </div>

      <section className="sbts-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-lg font-extrabold text-slate-950">Area Register</h2><p className="text-sm font-semibold text-slate-500">Click an area card to open the projects filtered by that area.</p></div>
          <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search area..." className="w-full bg-transparent outline-none" /></label>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {filteredAreas.map((area) => {
            const areaProjects = projects.filter((project) => project.areaId === area.id);
            return (
              <article
                key={area.id}
                onClick={() => openAreaProjects(area.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => event.key === "Enter" && openAreaProjects(area.id)}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_18px_45px_rgba(15,39,56,0.12)] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div><div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">{area.code}</div><h3 className="mt-1 text-lg font-black text-slate-950">{area.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{area.plant}</p></div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 ring-1 ring-cyan-100">Area</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-500">
                  <div className="rounded-2xl bg-slate-50 p-3"><MapPinned className="mb-2 h-4 w-4 text-cyan-700" />Projects<br /><span className="text-slate-900">{areaProjects.length}</span></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><ArrowRight className="mb-2 h-4 w-4 text-cyan-700" />Open<br /><span className="text-slate-900">Area Projects</span></div>
                </div>
                <p className="mt-4 min-h-[44px] text-sm font-semibold leading-6 text-slate-500">{area.description || "No description added yet."}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Click card to view projects</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); openEditModal(area); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); deleteArea(area); }}
                      disabled={deleteAreaMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitArea} className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><Building2 className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-slate-950">{isEditing ? "Edit Area" : "Add Area"}</h2></div></div>
              <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Area Code e.g. SGP-05" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Area Name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <input required value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })} placeholder="Plant" className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-600">Cancel</button><button disabled={createAreaMutation.isPending || updateAreaMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"><Plus className="h-4 w-4" /> {isEditing ? "Update Area" : "Save Area"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}