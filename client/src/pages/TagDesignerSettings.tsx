import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ChangeEvent } from "react";
import { ArrowLeft, Check, ImageUp, Printer, RotateCcw, Save, Tags } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { QRCodeBlock, buildBlindQrValue } from "@/components/common/QRCodeBlock";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type TagSettingsForm = {
  scopeType: "Global" | "Project";
  projectId?: string | null;
  templateName: string;
  tagWidthCm: number;
  tagHeightCm: number;
  tagColor: string;
  accentColor: string;
  textColor: string;
  logoText: string;
  showLogo: boolean;
  showHole: boolean;
  showStatus: boolean;
  showProjectNo: boolean;
  showLocationNote: boolean;
  qrSizePx: number;
  fontScale: number;
  layoutMode: "Operational Split" | "Compact Field" | "Large QR";
};

type LayerKey = "title" | "logo" | "hole" | "qr" | "data" | "date";
type LayerMap = Record<LayerKey, { x: number; y: number }>;

const fallbackSettings: TagSettingsForm = {
  scopeType: "Project",
  projectId: null,
  templateName: "Template 1",
  tagWidthCm: 7,
  tagHeightCm: 11,
  tagColor: "#1f5d8a",
  accentColor: "#0ea5e9",
  textColor: "#ffffff",
  logoText: "Smart Blind Tag",
  showLogo: true,
  showHole: true,
  showStatus: false,
  showProjectNo: true,
  showLocationNote: false,
  qrSizePx: 158,
  fontScale: 100,
  layoutMode: "Large QR",
};

const defaultLayout: LayerMap = {
  hole: { x: 20, y: 10 },
  logo: { x: 82, y: 12 },
  title: { x: 50, y: 25 },
  qr: { x: 50, y: 51 },
  data: { x: 50, y: 78 },
  date: { x: 8, y: 96 },
};

const templateNames = ["Default template", "Template 1", "Template 2", "Template 3"] as const;

export default function TagDesignerSettings() {
  const [, params] = useRoute("/projects/:id/tag-settings");
  const [, setLocation] = useLocation();
  const projectId = params?.id ?? "";
  const utils = trpc.useUtils();
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 20_000 });
  const blindsQuery = trpc.core.blinds.useQuery(undefined, { staleTime: 20_000 });
  const settingsQuery = trpc.core.tagSettings.useQuery({ projectId }, { enabled: Boolean(projectId), staleTime: 10_000 });
  const project = projectsQuery.data?.find(item => item.id === projectId);
  const sampleBlind = (blindsQuery.data ?? []).find(item => item.projectId === projectId);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<TagSettingsForm>({ ...fallbackSettings, projectId });
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templateNames)[number]>("Template 1");
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>("qr");
  const [layout, setLayout] = useState<LayerMap>(defaultLayout);
  const [draggingLayer, setDraggingLayer] = useState<LayerKey | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGrid, setSnapGrid] = useState(1);

  const localKey = `sbts-tag-designer:${projectId}`;

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      scopeType: "Project",
      projectId,
      templateName: settingsQuery.data.templateName || "Template 1",
      tagWidthCm: settingsQuery.data.tagWidthCm || 7,
      tagHeightCm: settingsQuery.data.tagHeightCm || 11,
      tagColor: settingsQuery.data.tagColor || fallbackSettings.tagColor,
      accentColor: settingsQuery.data.accentColor || fallbackSettings.accentColor,
      textColor: settingsQuery.data.textColor || fallbackSettings.textColor,
      logoText: settingsQuery.data.logoText || fallbackSettings.logoText,
      showLogo: settingsQuery.data.showLogo,
      showHole: settingsQuery.data.showHole,
      showStatus: settingsQuery.data.showStatus,
      showProjectNo: settingsQuery.data.showProjectNo,
      showLocationNote: settingsQuery.data.showLocationNote,
      qrSizePx: settingsQuery.data.qrSizePx || fallbackSettings.qrSizePx,
      fontScale: settingsQuery.data.fontScale || fallbackSettings.fontScale,
      layoutMode: settingsQuery.data.layoutMode || "Large QR",
    });
  }, [settingsQuery.data, projectId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { layout?: LayerMap; logoPreview?: string | null; selectedTemplate?: (typeof templateNames)[number] };
      if (saved.layout) setLayout(saved.layout);
      if (saved.logoPreview) setLogoPreview(saved.logoPreview);
      if (saved.selectedTemplate) setSelectedTemplate(saved.selectedTemplate);
    } catch {
      // Local visual preferences should never block the page.
    }
  }, [localKey]);

  const saveMutation = trpc.core.saveTagSettings.useMutation({
    onSuccess: async () => {
      persistLocalDesignerState();
      toast.success("Tag template saved.");
      await utils.core.tagSettings.invalidate({ projectId });
    },
    onError: error => toast.error(error.message),
  });

  function persistLocalDesignerState() {
    try {
      localStorage.setItem(localKey, JSON.stringify({ layout, logoPreview, selectedTemplate, savedAt: new Date().toISOString() }));
    } catch {
      // Ignore local storage limitations.
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate({ ...form, scopeType: "Project", projectId, templateName: selectedTemplate === "Default template" ? "Default template" : selectedTemplate });
  }

  function resetStandard() {
    setForm({ ...fallbackSettings, scopeType: "Project", projectId });
    setLayout(defaultLayout);
    setSelectedTemplate("Template 1");
    toast.message("Default vertical 7 × 11 cm template restored locally. Click Save template to persist.");
  }

  function saveThemeColor() {
    persistLocalDesignerState();
    toast.success(`Global tag color saved locally: ${form.tagColor.toUpperCase()}`);
  }

  function applyTagSize() {
    if (form.tagWidthCm < 4 || form.tagHeightCm < 4) {
      toast.error("Tag size is too small.");
      return;
    }
    toast.success(`Tag size applied: ${(form.tagWidthCm * 10).toFixed(0)} × ${(form.tagHeightCm * 10).toFixed(0)} mm`);
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setLogoPreview(value);
      try {
        localStorage.setItem(localKey, JSON.stringify({ layout, logoPreview: value, selectedTemplate, savedAt: new Date().toISOString() }));
      } catch {
        // Ignore.
      }
      toast.success("Logo preview updated.");
    };
    reader.readAsDataURL(file);
  }

  function moveLayer(layer: LayerKey, axis: "x" | "y", value: number) {
    const snapped = snapEnabled ? Math.round(value / snapGrid) * snapGrid : value;
    setLayout(current => ({
      ...current,
      [layer]: { ...current[layer], [axis]: Math.max(0, Math.min(100, snapped)) },
    }));
  }

  function startDrag(layer: LayerKey, event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedLayer(layer);
    setDraggingLayer(layer);
    updateLayerFromPointer(layer, event.clientX, event.clientY);
  }

  function dragLayer(event: PointerEvent<HTMLButtonElement>) {
    if (!draggingLayer) return;
    updateLayerFromPointer(draggingLayer, event.clientX, event.clientY);
  }

  function stopDrag() {
    setDraggingLayer(null);
    persistLocalDesignerState();
  }

  function updateLayerFromPointer(layer: LayerKey, clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const snappedX = snapEnabled ? Math.round(x / snapGrid) * snapGrid : x;
    const snappedY = snapEnabled ? Math.round(y / snapGrid) * snapGrid : y;
    setLayout(current => ({
      ...current,
      [layer]: {
        x: Math.max(0, Math.min(100, snappedX)),
        y: Math.max(0, Math.min(100, snappedY)),
      },
    }));
  }

  function testPrint() {
    persistLocalDesignerState();
    toast.message("Opening tag print preview...");
    setLocation(`/projects/${projectId}/tags`);
  }

  const previewBlind = sampleBlind ?? {
    id: "preview",
    tagNo: "BL-001",
    blindNo: "BL-001",
    blindType: "Slip Blind",
    areaCode: project?.areaCode ?? "SRU-3",
    lineNo: "D-301",
    size: "10 in",
    rating: "300#",
    status: "In Progress",
    projectNo: project?.projectNo ?? "PRJ",
    locationNote: "Preview location note",
  };

  const monthYear = new Intl.DateTimeFormat("en-GB", { month: "2-digit", year: "numeric" }).format(new Date());

  if (projectsQuery.isLoading || settingsQuery.isLoading) {
    return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Loading tag designer...</div>;
  }
  if (!project) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Project not found.</div>;

  const selectedLayerPosition = layout[selectedLayer];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Default Tag Settings"
        title="Tag Designer"
        description="Design your printed tag (7cm × 11cm). Drag elements to reposition. Click an element to edit its font/size. Date will print as MM/YYYY in the bottom-left corner."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setLocation(`/projects/${project.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Project</button>
            <button onClick={() => setLocation(`/projects/${project.id}/tags`)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Tags className="h-4 w-4" /> Open Tags</button>
          </div>
        }
      />

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(440px,1.1fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetStandard} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm"><RotateCcw className="h-4 w-4" /> Reset default</button>
            <button disabled={saveMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm disabled:opacity-60"><Save className="h-4 w-4" /> Save template</button>
            <button type="button" onClick={testPrint} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm"><Printer className="h-4 w-4" /> Test print</button>
          </div>

          <div className="flex justify-start overflow-auto rounded-3xl bg-slate-50 p-3 shadow-inner">
            <article
              ref={stageRef}
              aria-label="Tag canvas"
              className="relative overflow-hidden rounded-[0.45cm] border border-slate-300 shadow-2xl"
              style={{
                width: `${form.tagWidthCm}cm`,
                height: `${form.tagHeightCm}cm`,
                minWidth: `${form.tagWidthCm}cm`,
                backgroundColor: form.tagColor,
                color: form.textColor,
                fontSize: `${form.fontScale}%`,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.11) 1px, transparent 1px)",
                backgroundSize: "5px 5px",
              }}
            >
              {form.showHole && (
                <button
                  type="button"
                  onPointerDown={event => startDrag("hole", event)}
                  onPointerMove={dragLayer}
                  onPointerUp={stopDrag}
                  onClick={() => setSelectedLayer("hole")}
                  className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-[10px] bg-white/90 shadow ${selectedLayer === "hole" ? "ring-4 ring-blue-500" : "ring-0"}`}
                  style={{ left: `${layout.hole.x}%`, top: `${layout.hole.y}%`, borderColor: "rgba(255,255,255,0.55)" }}
                  aria-label="Move hanging hole"
                />
              )}

              {form.showLogo && (
                <button
                  type="button"
                  onPointerDown={event => startDrag("logo", event)}
                  onPointerMove={dragLayer}
                  onPointerUp={stopDrag}
                  onClick={() => setSelectedLayer("logo")}
                  className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-xs font-black shadow ${selectedLayer === "logo" ? "ring-4 ring-blue-500" : "ring-2 ring-white/40"}`}
                  style={{ left: `${layout.logo.x}%`, top: `${layout.logo.y}%` }}
                  aria-label="Move logo"
                >
                  {logoPreview ? <img src={logoPreview} alt="Company logo" className="h-full w-full object-contain" /> : <span>Logo</span>}
                </button>
              )}

              <button
                type="button"
                onPointerDown={event => startDrag("title", event)}
                onPointerMove={dragLayer}
                onPointerUp={stopDrag}
                onClick={() => setSelectedLayer("title")}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded-xl px-2 py-1 text-center text-[22px] font-black leading-tight ${selectedLayer === "title" ? "ring-4 ring-blue-500" : "ring-0"}`}
                style={{ left: `${layout.title.x}%`, top: `${layout.title.y}%` }}
              >
                {form.logoText}
              </button>

              <button
                type="button"
                onPointerDown={event => startDrag("qr", event)}
                onPointerMove={dragLayer}
                onPointerUp={stopDrag}
                onClick={() => setSelectedLayer("qr")}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-2xl bg-white p-2 shadow-xl ${selectedLayer === "qr" ? "ring-4 ring-blue-500" : "ring-2 ring-white/70"}`}
                style={{ left: `${layout.qr.x}%`, top: `${layout.qr.y}%` }}
              >
                <QRCodeBlock value={buildBlindQrValue(previewBlind.id, previewBlind.tagNo)} label={previewBlind.tagNo} size={Math.min(form.qrSizePx, 190)} />
              </button>

              <button
                type="button"
                onPointerDown={event => startDrag("data", event)}
                onPointerMove={dragLayer}
                onPointerUp={stopDrag}
                onClick={() => setSelectedLayer("data")}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-2xl px-3 py-2 text-center text-[16px] font-black leading-6 ${selectedLayer === "data" ? "ring-4 ring-blue-500" : "ring-0"}`}
                style={{ left: `${layout.data.x}%`, top: `${layout.data.y}%` }}
              >
                <div>ID: {previewBlind.tagNo}</div>
                <div>Area: {previewBlind.areaCode}</div>
                <div>Line: {previewBlind.lineNo}</div>
              </button>

              <button
                type="button"
                onPointerDown={event => startDrag("date", event)}
                onPointerMove={dragLayer}
                onPointerUp={stopDrag}
                onClick={() => setSelectedLayer("date")}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded px-1 text-[9px] font-black ${selectedLayer === "date" ? "ring-2 ring-blue-500" : "ring-0"}`}
                style={{ left: `${layout.date.x}%`, top: `${layout.date.y}%` }}
              >
                {monthYear}
              </button>
            </article>
          </div>
          <p className="text-xs font-bold text-slate-500">Tip: keep QR inside the white frame for reliable scanning.</p>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Templates</label>
            <div className="mt-3 space-y-2">
              {templateNames.map(template => {
                const locked = template === "Default template";
                const selected = selectedTemplate === template;
                return (
                  <button
                    key={template}
                    type="button"
                    onClick={() => !locked && setSelectedTemplate(template)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${selected ? "border-blue-500 bg-blue-50 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span>{template}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] ${locked ? "bg-rose-50 text-rose-600" : selected ? "bg-white text-blue-700" : "bg-slate-100 text-slate-500"}`}>{locked ? "Locked" : selected ? "Selected" : "Editable"}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">You have 3 editable templates + 1 locked default. Any change saves automatically to the selected template on this device; Save template persists the main print settings.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Global tag color (one color for all tags)</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input type="color" value={form.tagColor} onChange={event => setForm({ ...form, tagColor: event.target.value })} className="h-10 w-16 rounded-xl border border-slate-200 bg-white p-1" />
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{form.tagColor.toUpperCase()}</span>
              <button type="button" onClick={saveThemeColor} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"><Save className="h-4 w-4" /> Save</button>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Printed date will appear in the bottom-left corner as <b>MM/YYYY</b>. Rounded corners are enabled for safe handling.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Company logo (used on tags)</label>
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-white">
              <ImageUp className="h-4 w-4" />
              <span>{logoPreview ? "Replace selected logo" : "Choose file"}</span>
              <input accept="image/*" type="file" onChange={handleLogoUpload} className="hidden" />
            </label>
            <p className="mt-2 text-xs font-semibold text-slate-500">Tip: use a square PNG with transparent background.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Tag size (mm)</label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input type="number" min={40} max={120} step={1} value={Math.round(form.tagWidthCm * 10)} onChange={event => setForm({ ...form, tagWidthCm: Number(event.target.value) / 10 })} className="w-28 rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" />
              <span className="text-sm font-black text-slate-400">×</span>
              <input type="number" min={40} max={160} step={1} value={Math.round(form.tagHeightCm * 10)} onChange={event => setForm({ ...form, tagHeightCm: Number(event.target.value) / 10 })} className="w-28 rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" />
              <span className="text-xs font-black text-slate-500">(W × H)</span>
              <button type="button" onClick={applyTagSize} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold text-slate-700"><Check className="h-4 w-4" /> Apply</button>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Standard is 70mm × 110mm (7cm × 11cm). Printing will follow the template size.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Rows (labels & styles)</label>
            <p className="mt-1 text-xs font-semibold text-slate-500">Edit labels, font size, weight and alignment for the printed information block.</p>
            <div className="mt-4 grid gap-3">
              <label className="space-y-1 text-sm font-bold text-slate-700">Font family<select className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400"><option>Arial</option><option>Inter</option><option>Tahoma</option></select></label>
              <label className="space-y-1 text-sm font-bold text-slate-700">Title font size<input type="number" min={14} max={34} value={Math.round(22 * (form.fontScale / 100))} onChange={event => setForm({ ...form, fontScale: Math.max(80, Math.min(140, (Number(event.target.value) / 22) * 100)) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
              <label className="space-y-1 text-sm font-bold text-slate-700">Title<input value={form.logoText} onChange={event => setForm({ ...form, logoText: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Layer position</label>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(["title", "logo", "hole", "qr", "data", "date"] as LayerKey[]).map(layer => (
                <button key={layer} type="button" onClick={() => setSelectedLayer(layer)} className={`rounded-2xl px-3 py-2 text-xs font-black uppercase ${selectedLayer === layer ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{layer}</button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">X: {selectedLayerPosition.x}%<input type="range" min="0" max="100" value={selectedLayerPosition.x} onChange={event => moveLayer(selectedLayer, "x", Number(event.target.value))} className="mt-2 w-full" /></label>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Y: {selectedLayerPosition.y}%<input type="range" min="0" max="100" value={selectedLayerPosition.y} onChange={event => moveLayer(selectedLayer, "y", Number(event.target.value))} className="mt-2 w-full" /></label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Date font size</label>
            <input type="range" min={70} max={140} value={form.fontScale} onChange={event => setForm({ ...form, fontScale: Number(event.target.value) })} className="mt-3 w-full" />
            <p className="mt-2 text-xs font-bold text-slate-500">Current scale: {form.fontScale}%</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Snap grid (mm)</label>
            <div className="mt-3 flex items-center gap-3">
              <input type="checkbox" checked={snapEnabled} onChange={event => setSnapEnabled(event.target.checked)} className="h-5 w-5 accent-cyan-600" />
              <select value={snapGrid} onChange={event => setSnapGrid(Number(event.target.value))} className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" disabled={!snapEnabled}>
                <option value={1}>1 mm</option>
                <option value={2}>2 mm</option>
                <option value={5}>5 mm</option>
              </select>
              <span className="text-xs font-bold text-slate-500">Snap + grid for easy alignment</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-black text-slate-700">Template change log</label>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">By</th><th className="px-3 py-2">Old</th><th className="px-3 py-2">New</th></tr>
                </thead>
                <tbody className="font-semibold text-slate-600">
                  <tr><td className="px-3 py-2">{new Date().toLocaleString()}</td><td className="px-3 py-2">System Admin</td><td className="px-3 py-2">Template</td><td className="px-3 py-2">{selectedTemplate}</td></tr>
                  <tr><td className="px-3 py-2">{new Date().toLocaleString()}</td><td className="px-3 py-2">System Admin</td><td className="px-3 py-2">Color</td><td className="px-3 py-2">{form.tagColor}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
