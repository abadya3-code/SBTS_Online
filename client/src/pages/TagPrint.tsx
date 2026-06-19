import { useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { PrintStyles } from "@/components/print/PrintStyles";
import { ProfessionalTagCard, type CorporateIdentity, type TagSettings } from "@/components/print/ProfessionalPrintLayouts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getCorporateIdentity } from "@/lib/corporateIdentity";
import { buildPrintFileName, printWithMode } from "@/lib/printExport";
import type { SystemGeneralSettings, SystemTagSettings } from "@/types/operationalModels";

function buildTagSettings(systemTags: SystemTagSettings | null | undefined, general: SystemGeneralSettings | null | undefined, corporate: CorporateIdentity): TagSettings {
  return {
    templateName: "Global System Tag Template",
    tagWidthCm: systemTags?.defaultTagWidthCm ?? 11,
    tagHeightCm: systemTags?.defaultTagHeightCm ?? 7,
    tagColor: systemTags?.defaultTagColor ?? "#718293",
    accentColor: systemTags?.defaultAccentColor ?? "#ffffff",
    textColor: systemTags?.defaultTextColor ?? "#ffffff",
    logoText: corporate.showOnTags ? "Smart Blind Tag" : (general?.logoText ?? "Smart Blind Tag"),
    logoImage: corporate.showOnTags ? corporate.companyLogo : "",
    showLogo: true,
    showHole: systemTags?.showHole ?? true,
    showProjectNo: systemTags?.showProjectNo ?? true,
    showLocationNote: systemTags?.showLocationNote ?? false,
    qrSizePx: systemTags?.defaultQrSizePx ?? 175,
    fontScale: systemTags?.fontScale ?? 100,
    holeSizePx: systemTags?.holeSizePx ?? 42,
  };
}

export default function TagPrint() {
  const [, params] = useRoute("/projects/:id/tags");
  const [, setLocation] = useLocation();
  const projectId = params?.id ?? "";
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 20_000 });
  const blindsQuery = trpc.core.blinds.useQuery(undefined, { staleTime: 20_000 });
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 20_000 });
  const project = projectsQuery.data?.find(item => item.id === projectId);
  const blinds = (blindsQuery.data ?? []).filter(item => item.projectId === projectId);
  const general = settingsQuery.data?.general as SystemGeneralSettings | undefined;
  const corporate = getCorporateIdentity(general);
  const settings = buildTagSettings(settingsQuery.data?.tags, general, corporate);
  const [registerPrint, setRegisterPrint] = useState(false);
  const recordTagPrint = trpc.core.recordTagPrint.useMutation({ onError: error => toast.error(error.message) });

  function printTags() {
    recordTagPrint.mutate({ projectId, scope: "Project", tagCount: Math.max(blinds.length, 1) });
    printWithMode("tag", buildPrintFileName("SBTS_TAGS", project?.projectNo ?? projectId));
  }

  function exportTagList() {
    setRegisterPrint(true);
    toast.message("Print dialog opened for a PDF-ready tag register. Choose Microsoft Print to PDF or Save as PDF.");
    setTimeout(() => {
      printWithMode("tag-register", buildPrintFileName("SBTS_TAG_REGISTER", project?.projectNo ?? projectId));
      setTimeout(() => setRegisterPrint(false), 900);
    }, 150);
  }

  if (projectsQuery.isLoading || blindsQuery.isLoading || settingsQuery.isLoading) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Preparing printable tags...</div>;
  if (!project) {
    return (
      <div className="space-y-5">
        <button onClick={() => setLocation("/projects")} className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700"><ArrowLeft className="h-4 w-4" /> Back to Projects</button>
        <div className="sbts-card p-8"><h1 className="text-xl font-extrabold text-slate-950">Project not found</h1></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrintStyles />
      <div className="no-print">
        <PageHeader
          eyebrow="Professional Field Tag Printing"
          title={`${project.projectNo} · Blind QR Tags`}
          description="Modern 11 × 7 cm field tag format. Each tag prints on its own page with a large QR code, field ID, area, line, size, date, logo, and punch-hole mark."
          actions={
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLocation(`/projects/${project.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Project</button>
              <button onClick={exportTagList} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><Download className="h-4 w-4" /> Export Register PDF</button>
              <button onClick={printTags} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Printer className="h-4 w-4" /> Print Tags</button>
            </div>
          }
        />
      </div>

      <section className="no-print grid gap-4 md:grid-cols-4">
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Tags</div><div className="mt-2 text-3xl font-black text-slate-950">{blinds.length}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Area</div><div className="mt-2 text-lg font-black text-cyan-700">{project.areaCode}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Print Size</div><div className="mt-2 text-lg font-black text-slate-950">{settings.tagWidthCm} × {settings.tagHeightCm} cm</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">QR Size</div><div className="mt-2 text-lg font-black text-slate-950">{settings.qrSizePx}px</div></div>
      </section>

      <section className={`${registerPrint ? "print-only" : "no-print"} report-print-page rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`}>
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">{corporate.showOnReports && corporate.companyLogo ? <img src={corporate.companyLogo} alt="Company" className="h-14 w-14 rounded-xl bg-white p-2 object-contain" /> : null}<div><div className="text-lg font-black text-slate-950">{corporate.showOnReports ? corporate.companyName : "SBTS"}</div><div className="text-xs font-bold text-slate-500">{corporate.companySubtitle}</div></div></div>
          <div className="text-right text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tag Register</div>
        </div>
        <h1 className="text-2xl font-black text-slate-950">Tag Register · {project.projectNo}</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">{project.name} · {project.areaCode} · {blinds.length} tag(s)</p>
        <table className="mt-6 w-full border-collapse text-left text-xs">
          <thead><tr className="bg-slate-100"><th className="border p-2">Tag</th><th className="border p-2">Blind</th><th className="border p-2">Line</th><th className="border p-2">Size</th><th className="border p-2">Rating</th><th className="border p-2">Type</th></tr></thead>
          <tbody>{blinds.map(blind => <tr key={blind.id}><td className="border p-2 font-black">{blind.tagNo}</td><td className="border p-2">{blind.blindNo}</td><td className="border p-2">{blind.lineNo}</td><td className="border p-2">{blind.size}</td><td className="border p-2">{blind.rating ?? "N/A"}</td><td className="border p-2">{blind.blindType}</td></tr>)}</tbody>
        </table>
      </section>

      <section className={`${registerPrint ? "no-print" : "print-grid"} grid justify-center gap-6 xl:grid-cols-2`}>
        {blinds.map(blind => <ProfessionalTagCard key={blind.id} blind={blind} project={project} settings={settings} corporate={corporate} />)}
      </section>

      {blinds.length === 0 && <div className="sbts-card p-8 text-center text-sm font-bold text-slate-500">No blinds in this project yet.</div>}
    </div>
  );
}
