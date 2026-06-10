import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Eye, Layers3, MapPinned, QrCode, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";

function isCompleted(phaseKey: string, status: string) {
  return phaseKey === "inspectionReady" || status === "Completed";
}

export default function SlipBlinds() {
  const [, setLocation] = useLocation();
  const areasQuery = trpc.core.areas.useQuery(undefined, { staleTime: 30_000 });
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 30_000 });
  const blindsQuery = trpc.core.blinds.useQuery(undefined, { staleTime: 20_000 });
  const areas = areasQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const blinds = blindsQuery.data ?? [];
  const slipBlinds = useMemo(() => blinds.filter((blind) => blind.blindType.toLowerCase().includes("slip")), [blinds]);
  const [areaId, setAreaId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const selectedArea = areas.find((area) => area.id === areaId);
  const selectedProject = projects.find((project) => project.id === projectId);
  const projectOptions = projects.filter((project) => !areaId || project.areaId === areaId);
  const projectSlipBlinds = slipBlinds.filter((blind) => blind.projectId === projectId && (!search.trim() || [blind.tagNo, blind.blindNo, blind.lineNo, blind.size, blind.phaseLabel].some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()))));
  const total = slipBlinds.length;
  const completed = slipBlinds.filter((blind) => isCompleted(blind.currentPhaseKey, blind.status)).length;
  const inProgress = total - completed;

  function backToAreas() {
    setAreaId("");
    setProjectId("");
    setSelected([]);
  }

  function backToProjects() {
    setProjectId("");
    setSelected([]);
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id));
  }

  const allSelected = projectSlipBlinds.length > 0 && projectSlipBlinds.every((blind) => selected.includes(blind.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Slip Blind Control"
        title="Slip Blind Dashboard"
        description="Dedicated dashboard for Slip Blind tracking by Area → Project → Slip Blind list, following the SBTS patch47.48 operating idea with cleaner React/Tailwind execution."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <button onClick={backToAreas} className="sbts-card p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,39,56,0.12)]"><div className="flex items-center justify-between"><div><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Slip Blinds</div><div className="mt-2 text-3xl font-black text-slate-950">{total}</div></div><Layers3 className="h-8 w-8 text-cyan-600" /></div></button>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Completed / Final</div><div className="mt-2 text-3xl font-black text-emerald-600">{completed}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">In Progress</div><div className="mt-2 text-3xl font-black text-amber-600">{inProgress}</div></div>
      </div>

      <div className="sbts-card flex flex-wrap items-center gap-2 p-4 text-sm font-extrabold text-slate-600">
        <button onClick={backToAreas} className="rounded-xl px-2 py-1 text-cyan-700 hover:bg-cyan-50">Areas</button>
        {selectedArea && <><ChevronRight className="h-4 w-4 text-slate-300" /><button onClick={backToProjects} className="rounded-xl px-2 py-1 text-cyan-700 hover:bg-cyan-50">{selectedArea.code} · {selectedArea.name}</button></>}
        {selectedProject && <><ChevronRight className="h-4 w-4 text-slate-300" /><span className="rounded-xl bg-slate-100 px-2 py-1 text-slate-900">{selectedProject.projectNo} · {selectedProject.name}</span></>}
      </div>

      {!areaId && (
        <section className="sbts-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Areas</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Select an area to view related Slip Blind projects.</p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">{areas.length} areas</span>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
          {areas.map((area) => {
            const list = slipBlinds.filter((blind) => blind.areaId === area.id);
            const done = list.filter((blind) => isCompleted(blind.currentPhaseKey, blind.status)).length;
            return (
              <button key={area.id} onClick={() => { setAreaId(area.id); setProjectId(""); }} className="sbts-card p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,39,56,0.13)]">
                <div className="mb-4 flex items-start justify-between"><div><div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">{area.code}</div><h3 className="mt-2 text-lg font-extrabold text-slate-950">{area.name}</h3></div><MapPinned className="h-5 w-5 text-slate-400" /></div>
                <div className="grid grid-cols-3 gap-3 text-xs font-bold text-slate-500"><div className="rounded-xl bg-slate-50 p-3">Total<br /><span className="text-slate-900">{list.length}</span></div><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Done<br /><span>{done}</span></div><div className="rounded-xl bg-amber-50 p-3 text-amber-700">Active<br /><span>{list.length - done}</span></div></div>
              </button>
            );
          })}
          </div>
        </section>
      )}

      {areaId && !projectId && (
        <section className="space-y-4">
          <button onClick={backToAreas} className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700"><ArrowLeft className="h-4 w-4" /> Back to Areas</button>
          <div className="grid gap-5 lg:grid-cols-3">
            {projectOptions.map((project) => {
              const list = slipBlinds.filter((blind) => blind.projectId === project.id);
              const done = list.filter((blind) => isCompleted(blind.currentPhaseKey, blind.status)).length;
              return (
                <button key={project.id} onClick={() => { setProjectId(project.id); setSelected([]); }} className="sbts-card p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,39,56,0.13)]">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">{project.projectNo}</div><h3 className="mt-2 text-lg font-extrabold text-slate-950">{project.name}</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-bold text-slate-500"><div className="rounded-xl bg-slate-50 p-3">Slip<br /><span className="text-slate-900">{list.length}</span></div><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Done<br /><span>{done}</span></div><div className="rounded-xl bg-amber-50 p-3 text-amber-700">Active<br /><span>{list.length - done}</span></div></div>
                </button>
              );
            })}
          </div>
          {projectOptions.length === 0 && <div className="sbts-card p-8 text-center text-sm font-bold text-slate-500">No projects found in this area.</div>}
        </section>
      )}

      {projectId && (
        <section className="sbts-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-lg font-extrabold text-slate-950">Slip Blind List</h2><p className="text-sm font-semibold text-slate-500">Selected: {selected.length}. Use Project Dashboard to add more Slip Blinds.</p></div>
            <div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search slip blinds..." className="w-56 bg-transparent outline-none" /></label><button onClick={() => setSelected([])} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600"><X className="h-4 w-4" /> Clear Selection</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3"><input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? projectSlipBlinds.map((blind) => blind.id) : [])} /></th><th className="px-5 py-3">#</th><th className="px-5 py-3">Blind</th><th className="px-5 py-3">Line</th><th className="px-5 py-3">Size / Rating</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">QR</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projectSlipBlinds.map((blind, index) => <tr key={blind.id} className="hover:bg-slate-50"><td className="px-5 py-4"><input type="checkbox" checked={selected.includes(blind.id)} onChange={(e) => toggleSelected(blind.id, e.target.checked)} /></td><td className="px-5 py-4 font-bold text-slate-500">{index + 1}</td><td className="px-5 py-4 font-extrabold text-slate-950">{blind.tagNo}<div className="text-xs font-semibold text-slate-500">{blind.blindNo}</div></td><td className="px-5 py-4 font-bold text-slate-600">{blind.lineNo}</td><td className="px-5 py-4 font-bold text-slate-600">{blind.size} / {blind.rating ?? "N/A"}</td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 ring-1 ring-cyan-100">{blind.phaseLabel}</span></td><td className="px-5 py-4"><QrCode className="h-5 w-5 text-slate-400" /></td><td className="px-5 py-4"><button onClick={() => setLocation(`/blinds/${blind.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white"><Eye className="h-4 w-4" /> Details</button></td></tr>)}
              </tbody>
            </table>
            {projectSlipBlinds.length === 0 && <div className="p-8 text-center text-sm font-bold text-slate-500">No slip blinds found in this project.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
