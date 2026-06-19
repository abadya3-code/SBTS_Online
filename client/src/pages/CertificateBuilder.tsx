import { ArrowLeft, Printer, Save } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { PrintStyles } from "@/components/print/PrintStyles";
import { ProfessionalCertificatePage } from "@/components/print/ProfessionalPrintLayouts";
import type { ApprovalRecord, CertificateSettings, SystemGeneralSettings } from "@/types/operationalModels";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getCorporateIdentity } from "@/lib/corporateIdentity";
import { buildPrintFileName, printWithMode } from "@/lib/printExport";

export default function CertificateBuilder() {
  const [location, setLocation] = useLocation();
  const id = decodeURIComponent(location.split("/blinds/")[1]?.split("/certificate")[0] ?? "");
  const utils = trpc.useUtils();
  const blindQuery = trpc.core.blindDetail.useQuery({ id }, { enabled: Boolean(id), staleTime: 10_000 });
  const blind = blindQuery.data;
  const torqueQuery = trpc.core.torqueRecords.useQuery({ blindId: blind?.id ?? "" }, { enabled: Boolean(blind?.id), staleTime: 10_000 });
  const approvalsQuery = trpc.core.approvalCenter.useQuery(undefined, { staleTime: 10_000 });
  const certificatesQuery = trpc.core.certificates.useQuery({ blindId: blind?.id ?? "" }, { enabled: Boolean(blind?.id), staleTime: 10_000 });
  const certificateLockQuery = trpc.core.certificateLock.useQuery({ blindId: blind?.id ?? "" }, { enabled: Boolean(blind?.id), staleTime: 10_000 });
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 20_000 });
  const certSettings = settingsQuery.data?.certificates as CertificateSettings | undefined;
  const generalSettings = settingsQuery.data?.general as SystemGeneralSettings | undefined;
  const corporate = getCorporateIdentity(generalSettings);
  const certificateLogo = corporate.showOnCertificates ? (corporate.companyLogo || certSettings?.certificateLogoUrl || "") : (certSettings?.certificateLogoUrl || "");
  const torqueRecords = torqueQuery.data ?? [];
  const approvals = (approvalsQuery.data ?? []).filter(item => item.blindId === blind?.id);
  const lockStatus = certificateLockQuery.data;
  const latestCertificate = certificatesQuery.data?.[0];
  const certNo = latestCertificate?.certificateNo ?? (blind ? `SBTS-CERT-${blind.tagNo.replace(/[^A-Z0-9]/gi, "")}-R01` : "SBTS-CERT");
  const requiredApprovers: Array<ApprovalRecord | string> = lockStatus?.requiredApprovers ?? [];

  const issueCertificateMutation = trpc.core.issueCertificate.useMutation({
    onSuccess: async cert => {
      await utils.core.certificates.invalidate({ blindId: blind?.id ?? "" });
      await utils.core.certificateLock.invalidate({ blindId: blind?.id ?? "" });
      await utils.core.blindDetail.invalidate({ id });
      toast.success(`${cert.certificateNo} saved to certificate register.`);
    },
    onError: error => toast.error(error.message),
  });

  function saveCertificate(status: "Draft" | "Issued" | "Printed") {
    if (!blind) return;
    issueCertificateMutation.mutate({ blindId: blind.id, status });
  }

  function printCertificate() {
    if (!blind) return;
    saveCertificate("Printed");
    printWithMode("certificate", buildPrintFileName("SBTS_CERTIFICATE", blind.tagNo));
  }

  if (blindQuery.isLoading || settingsQuery.isLoading) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Building certificate...</div>;
  if (!blind) {
    return (
      <div className="space-y-5">
        <button onClick={() => setLocation("/projects")} className="inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="sbts-card p-8"><h1 className="text-xl font-extrabold text-slate-950">Blind not found</h1></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrintStyles />
      <div className="no-print">
        <PageHeader
          eyebrow="Professional Certificate Print"
          title={`${certNo} · ${blind.tagNo}`}
          description="A4 one-page certificate generated from blind details, workflow logs, torque records, final approvals, and QR traceability."
          actions={
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLocation(`/blinds/${blind.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Blind Details</button>
              <button onClick={() => saveCertificate("Issued")} disabled={issueCertificateMutation.isPending || Boolean(lockStatus?.locked)} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"><Save className="h-4 w-4" /> Save Certificate</button>
              <button onClick={printCertificate} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Printer className="h-4 w-4" /> Print Certificate</button>
            </div>
          }
        />
      </div>

      <section className="no-print grid gap-4 md:grid-cols-4">
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Certificate Status</div><div className="mt-2 text-lg font-black text-slate-950">{latestCertificate?.status ?? "Preview"}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Revision</div><div className="mt-2 text-lg font-black text-cyan-700">R{latestCertificate?.revision ?? 1}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Final Approval</div><div className="mt-2 text-lg font-black text-emerald-700">{(lockStatus?.approvedCount ?? 0)}/{(lockStatus?.requiredApprovers?.length ?? 0)}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Certificate Lock</div><div className={`mt-2 text-lg font-black ${lockStatus?.locked ? "text-amber-700" : "text-slate-950"}`}>{lockStatus?.locked ? "Locked" : "Unlocked"}</div></div>
      </section>

      <ProfessionalCertificatePage
        blind={blind}
        certificate={latestCertificate}
        corporate={corporate}
        certificateLogo={certificateLogo}
        torqueRecords={torqueRecords}
        workflowLogs={blind.logs ?? []}
        approvals={approvals}
        requiredApprovers={requiredApprovers}
        title={certSettings?.certificateTitle ?? "Smart Blind Tag System Certificate"}
        generatedAt={latestCertificate?.issuedAt ?? new Date()}
      />
    </div>
  );
}
