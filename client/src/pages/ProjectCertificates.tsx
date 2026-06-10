import { ArrowLeft, Printer, Save } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { PrintStyles } from "@/components/print/PrintStyles";
import { ProfessionalCertificatePage } from "@/components/print/ProfessionalPrintLayouts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getCorporateIdentity } from "@/lib/corporateIdentity";
import { buildPrintFileName, printWithMode } from "@/lib/printExport";

function certificateState(blind: any, certificate?: any) {
  const phase = String(blind?.phaseLabel ?? blind?.currentPhase ?? "").toLowerCase();
  const status = String(certificate?.status ?? "").toLowerCase();
  if (status === "issued" || status === "printed" || phase.includes("final")) return "Approved";
  return "Pending";
}

export default function ProjectCertificates() {
  const [, params] = useRoute("/projects/:id/certificates");
  const [, setLocation] = useLocation();
  const projectId = params?.id ?? "";
  const utils = trpc.useUtils();
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 20_000 });
  const blindsQuery = trpc.core.blinds.useQuery(undefined, { staleTime: 20_000 });
  const certificatesQuery = trpc.core.certificates.useQuery({ projectId }, { enabled: Boolean(projectId), staleTime: 10_000 });
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 30_000 });
  const corporate = getCorporateIdentity(settingsQuery.data?.general as any);
  const certificateSettings = settingsQuery.data?.certificates;
  const project = projectsQuery.data?.find(item => item.id === projectId);
  const blinds = (blindsQuery.data ?? []).filter(item => item.projectId === projectId);
  const certificates = certificatesQuery.data ?? [];
  const savedCertificates = certificates.filter(item => item.status !== "Superseded");
  const approvedCount = blinds.filter(blind => certificateState(blind, certificates.find(cert => cert.blindId === blind.id && cert.status !== "Superseded")) === "Approved").length;
  const pendingCount = Math.max(blinds.length - approvedCount, 0);

  const issueCertificateMutation = trpc.core.issueCertificate.useMutation({
    onSuccess: async cert => {
      toast.success(`${cert.certificateNo} saved.`);
      await utils.core.certificates.invalidate({ projectId });
    },
    onError: error => toast.error(error.message),
  });

  async function saveMissingCertificates() {
    let count = 0;
    let blocked = 0;
    for (const blind of blinds) {
      const hasCertificate = certificates.some(cert => cert.blindId === blind.id && cert.status !== "Superseded");
      if (hasCertificate) continue;
      try {
        await issueCertificateMutation.mutateAsync({ blindId: blind.id, status: "Issued" });
        count += 1;
      } catch {
        blocked += 1;
      }
    }
    if (count) toast.success(`${count} certificate records created.`);
    if (blocked) toast.warning(`${blocked} certificate(s) blocked by approval lock.`);
  }

  function printPackage() {
    printWithMode("certificate-package", buildPrintFileName("SBTS_CERTIFICATE_PACKAGE", project?.projectNo ?? projectId));
  }

  if (projectsQuery.isLoading || blindsQuery.isLoading || certificatesQuery.isLoading || settingsQuery.isLoading) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Preparing certificates...</div>;
  if (!project) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Project not found.</div>;

  return (
    <div className="space-y-6">
      <PrintStyles />
      <div className="no-print">
        <PageHeader
          eyebrow="Project Certificate Print Package"
          title={`${project.projectNo} · Professional Certificate Package`}
          description="One A4 page per blind certificate. The package is formatted for PDF or direct printing with QR traceability and final approval sections."
          actions={
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLocation(`/projects/${project.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Project</button>
              <button onClick={saveMissingCertificates} disabled={issueCertificateMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"><Save className="h-4 w-4" /> Save Missing</button>
              <button onClick={printPackage} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Printer className="h-4 w-4" /> Print Package</button>
            </div>
          }
        />
      </div>

      <section className="no-print grid gap-4 md:grid-cols-4">
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Project Blinds</div><div className="mt-2 text-3xl font-black text-slate-950">{blinds.length}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Saved Certificates</div><div className="mt-2 text-3xl font-black text-cyan-700">{savedCertificates.length}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Approved</div><div className="mt-2 text-3xl font-black text-emerald-600">{approvedCount}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pending</div><div className="mt-2 text-3xl font-black text-amber-600">{pendingCount}</div></div>
      </section>

      <section className="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Certificate Register</h2>
            <p className="text-sm font-semibold text-slate-500">Preview list before printing. Print output will generate one certificate per page.</p>
          </div>
          <div className="text-right text-xs font-black text-slate-500">Area: {project.areaCode}<br />Project: {project.projectNo}</div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {blinds.slice(0, 12).map(blind => {
            const latest = certificates.find(cert => cert.blindId === blind.id && cert.status !== "Superseded");
            const state = certificateState(blind, latest);
            return (
              <div key={blind.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3"><div className="font-black text-slate-950">{blind.tagNo}</div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${state === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{state}</span></div>
                <div className="mt-2 text-xs font-bold text-slate-500">Phase: {blind.phaseLabel} · Type: {blind.blindType} · Size: {blind.size ?? "-"}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="certificate-print-stack">
        {blinds.map(blind => {
          const latest = certificates.find(cert => cert.blindId === blind.id && cert.status !== "Superseded");
          return (
            <ProfessionalCertificatePage
              key={blind.id}
              blind={blind}
              project={project}
              certificate={latest}
              corporate={corporate}
              title={certificateSettings?.certificateTitle ?? "Smart Blind Tag System Certificate"}
              generatedAt={latest?.issuedAt ?? new Date()}
            />
          );
        })}
      </section>

      {blinds.length === 0 && <div className="sbts-card p-8 text-center text-sm font-bold text-slate-500">No blinds in this project yet.</div>}
    </div>
  );
}
