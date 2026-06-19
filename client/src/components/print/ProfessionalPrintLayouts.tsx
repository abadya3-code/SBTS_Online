import { BadgeCheck, CalendarDays, ClipboardCheck, FileText, ShieldCheck, Wrench } from "lucide-react";
import { QRCodeBlock, buildBlindQrValue } from "@/components/common/QRCodeBlock";
import { initialsFromCompanyName } from "@/lib/corporateIdentity";
import type { ApprovalRecord, CertificateRecord, PrintableBlind, PrintableProject, TorqueRecord, WorkflowLogRecord } from "@/types/operationalModels";

export type CorporateIdentity = {
  companyName?: string;
  companyShortName?: string;
  companySubtitle?: string;
  companyLogo?: string;
  showOnCertificates?: boolean;
  showOnTags?: boolean;
};

export type TagSettings = {
  tagWidthCm: number;
  tagHeightCm: number;
  tagColor: string;
  accentColor: string;
  textColor: string;
  logoText: string;
  logoImage?: string;
  showLogo?: boolean;
  showHole?: boolean;
  showProjectNo?: boolean;
  showLocationNote?: boolean;
  qrSizePx: number;
  fontScale?: number;
  holeSizePx?: number;
};

function valueOrDash(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : "-";
}

export function formatPrintDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrintDate(value?: string | Date | null) {
  if (!value) return new Date().toLocaleDateString("en-GB");
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB");
}

export function printMonthYear(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function statusLabel(blind: PrintableBlind, certificate?: CertificateRecord) {
  const phase = String(blind?.phaseLabel ?? blind?.currentPhase ?? "").toLowerCase();
  const certStatus = String(certificate?.status ?? "").toLowerCase();
  if (certStatus === "issued" || certStatus === "printed" || certStatus === "locked") return "APPROVED";
  if (phase.includes("final") || phase.includes("approved")) return "APPROVED";
  return "PENDING";
}

function statusClass(status: string) {
  if (status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function CorporateLogo({ corporate, fallback = "SBTS" }: { corporate: CorporateIdentity; fallback?: string }) {
  const showLogo = Boolean(corporate.companyLogo);
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-950">
        {showLogo ? <img src={corporate.companyLogo} alt="Company logo" className="h-full w-full object-contain p-1" /> : initialsFromCompanyName(corporate.companyShortName ?? fallback)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-slate-950">{corporate.companyName ?? "Smart Blind Tag System"}</div>
        <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{corporate.companySubtitle ?? "Field Isolation Certificate"}</div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, strong = false }: { label: string; value: unknown; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-1 truncate text-[12px] ${strong ? "font-black" : "font-bold"} text-slate-950`}>{valueOrDash(value)}</div>
    </div>
  );
}

export function ProfessionalCertificatePage({
  blind,
  project,
  certificate,
  corporate,
  torqueRecords = [],
  workflowLogs = [],
  approvals = [],
  requiredApprovers = [],
  title = "Smart Blind Tag System Certificate",
  certificateLogo = "",
  generatedAt,
}: {
  blind: PrintableBlind;
  project?: PrintableProject;
  certificate?: CertificateRecord;
  corporate: CorporateIdentity;
  torqueRecords?: TorqueRecord[];
  workflowLogs?: WorkflowLogRecord[];
  approvals?: ApprovalRecord[];
  requiredApprovers?: Array<ApprovalRecord | string>;
  title?: string;
  certificateLogo?: string;
  generatedAt?: string | Date | null;
}) {
  const certNo = certificate?.certificateNo ?? `SBTS-CERT-${valueOrDash(blind?.tagNo).replace(/[^A-Z0-9]/gi, "")}-R01`;
  const approvalState = statusLabel(blind, certificate);
  const logs = workflowLogs.length ? workflowLogs : (blind?.logs ?? []);
  const finalApprovals = approvals.length ? approvals : requiredApprovers;
  const logoCorporate = certificateLogo ? { ...corporate, companyLogo: certificateLogo } : corporate;

  return (
    <article className="certificate-page print-page sbts-certificate-sheet mx-auto bg-white shadow-xl">
      <header className="sbts-cert-header grid grid-cols-[1.25fr_1.1fr_1fr] items-center gap-4 border-b-2 border-slate-950 pb-3">
        <CorporateLogo corporate={logoCorporate} />
        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">Digital Field Certificate</div>
          <h1 className="mt-1 text-lg font-black leading-tight text-slate-950">{title}</h1>
          <div className={`mx-auto mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${statusClass(approvalState)}`}>{approvalState}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Certificate No.</div>
          <div className="mt-1 text-xs font-black text-slate-950">{certNo}</div>
          <div className="mt-2 text-[10px] font-bold text-slate-500">Generated: {formatPrintDateTime(generatedAt ?? certificate?.issuedAt ?? new Date())}</div>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-[1fr_140px] gap-3">
        <div className="grid grid-cols-3 gap-2">
          <InfoCell label="Area" value={blind?.areaCode ?? project?.areaCode} strong />
          <InfoCell label="Project" value={blind?.projectNo ?? project?.projectNo} strong />
          <InfoCell label="Blind / Tag" value={blind?.tagNo ?? blind?.blindNo} strong />
          <InfoCell label="Line / Equipment" value={blind?.lineNo} />
          <InfoCell label="Type" value={blind?.blindType} />
          <InfoCell label="Size" value={blind?.size} />
          <InfoCell label="Rating" value={blind?.rating ?? "N/A"} />
          <InfoCell label="Current Phase" value={blind?.phaseLabel ?? blind?.currentPhase} />
          <InfoCell label="Status" value={blind?.status} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-2 text-center">
          <QRCodeBlock value={buildBlindQrValue(blind?.id, blind?.tagNo)} label={valueOrDash(blind?.tagNo)} size={112} />
          <div className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">Scan live record</div>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-950"><ClipboardCheck className="h-4 w-4 text-cyan-700" /> Workflow Summary</div>
          <div className="mt-2 space-y-1.5">
            {(logs ?? []).slice(0, 5).map((log: WorkflowLogRecord, index: number) => (
              <div key={String(log?.id ?? index)} className="rounded-lg bg-slate-50 px-2 py-1.5">
                <div className="truncate text-[10px] font-black text-slate-950">{valueOrDash(log?.fromPhaseLabel ?? log?.fromPhaseKey ?? log?.action)} → {valueOrDash(log?.toPhaseLabel ?? log?.toPhaseKey ?? blind?.phaseLabel)}</div>
                <div className="mt-0.5 truncate text-[9px] font-bold text-slate-500">{valueOrDash(log?.workerName ?? log?.performedByName ?? log?.actorName)} · {formatPrintDateTime(log?.createdAt)}</div>
              </div>
            ))}
            {!logs?.length && <div className="rounded-lg border border-dashed border-slate-200 p-2 text-[10px] font-bold text-slate-500">No workflow records available.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-950"><Wrench className="h-4 w-4 text-amber-600" /> Torque / Technical Evidence</div>
          <div className="mt-2 space-y-1.5">
            {(torqueRecords ?? []).slice(0, 4).map((record: TorqueRecord, index: number) => (
              <div key={String(record?.id ?? index)} className="rounded-lg bg-amber-50 px-2 py-1.5">
                <div className="truncate text-[10px] font-black text-slate-950">{valueOrDash(record?.machineType ?? record?.toolType)} · {valueOrDash(record?.psiValue ?? record?.psi)} PSI</div>
                <div className="mt-0.5 truncate text-[9px] font-bold text-slate-500">{valueOrDash(record?.technicianName)} · {formatPrintDateTime(record?.createdAt)}</div>
              </div>
            ))}
            {!torqueRecords?.length && <div className="rounded-lg border border-dashed border-slate-200 p-2 text-[10px] font-bold text-slate-500">No torque records captured.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-950"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Final Approvals</div>
          <div className="mt-2 space-y-1.5">
            {(finalApprovals ?? []).slice(0, 5).map((approval: ApprovalRecord | string, index: number) => {
              const approvalRecord = typeof approval === "string" ? undefined : approval;
              const label = approvalRecord?.label ?? approvalRecord?.phaseLabel ?? approvalRecord?.requiredRoleLabel ?? approval;
              const status = approvalRecord?.status ?? (approvalRecord?.approvedByName ? "Approved" : approvalState === "APPROVED" ? "Approved" : "Pending");
              return (
                <div key={String(approvalRecord?.id ?? label ?? index)} className={`rounded-lg px-2 py-1.5 ${String(status).toLowerCase().includes("approved") ? "bg-emerald-50" : "bg-amber-50"}`}>
                  <div className="truncate text-[10px] font-black text-slate-950">{valueOrDash(label)} · {valueOrDash(status)}</div>
                  <div className="mt-0.5 truncate text-[9px] font-bold text-slate-500">By: {valueOrDash(approvalRecord?.approvedByName ?? approvalRecord?.approvedByOpenId ?? approvalRecord?.by)}</div>
                </div>
              );
            })}
            {!finalApprovals?.length && <div className="rounded-lg border border-dashed border-slate-200 p-2 text-[10px] font-bold text-slate-500">No final approvals recorded.</div>}
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-3 gap-3 text-[10px] font-bold text-slate-700">
          <div><span className="font-black text-slate-950">Safety note:</span> Digital certificate is generated from SBTS workflow, torque, approval, and audit data.</div>
          <div><span className="font-black text-slate-950">Traceability:</span> QR opens the live blind record for verification.</div>
          <div><span className="font-black text-slate-950">Lock:</span> Approved certificates are controlled records and must not be manually altered.</div>
        </div>
      </section>

      <footer className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-200 pt-3">
        {["Operation / Unit", "QA / QC", "Inspection / Final"].map((role) => (
          <div key={role} className="rounded-xl border border-slate-200 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{role}</div>
            <div className="mt-6 border-t border-slate-400 pt-1 text-[9px] font-bold text-slate-500">Digital approval / date</div>
          </div>
        ))}
      </footer>
    </article>
  );
}

export function ProfessionalTagCard({ blind, project, settings, corporate }: { blind: PrintableBlind; project?: PrintableProject; settings: TagSettings; corporate: CorporateIdentity }) {
  const tagWidth = settings.tagWidthCm || 11;
  const tagHeight = settings.tagHeightCm || 7;
  const qrSize = Math.min(settings.qrSizePx || 175, 178);
  const phase = valueOrDash(blind?.phaseLabel ?? blind?.currentPhase);

  return (
    <article
      className="tag-card sbts-field-tag relative overflow-hidden border-2 border-slate-950 shadow-lg"
      style={{
        width: `${tagWidth}cm`,
        height: `${tagHeight}cm`,
        background: settings.tagColor || "#718293",
        color: settings.textColor || "#ffffff",
        fontSize: `${settings.fontScale ?? 100}%`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-10 bg-black/10" />
      {settings.showHole !== false && <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border-[0.18cm] border-white/80 bg-white/95 shadow-inner" style={{ width: settings.holeSizePx ?? 42, height: settings.holeSizePx ?? 42 }} />}
      <div className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/90 p-1 text-[10px] font-black text-slate-900">
        {settings.logoImage ? <img src={settings.logoImage} alt="Company logo" className="h-full w-full object-contain" /> : initialsFromCompanyName(corporate.companyShortName ?? settings.logoText ?? "SB")}
      </div>
      <div className="relative flex h-full flex-col items-center px-4 pb-3 pt-14 text-center">
        <div className="text-[0.42cm] font-black leading-none tracking-tight">{settings.logoText || "Smart Blind Tag"}</div>
        <div className="mt-2 rounded-[0.28cm] bg-white p-2 shadow-sm ring-1 ring-black/10">
          <QRCodeBlock value={buildBlindQrValue(blind?.id, blind?.tagNo)} label={valueOrDash(blind?.tagNo)} size={qrSize} />
        </div>
        <div className="mt-2 w-full rounded-[0.24cm] bg-black/12 px-3 py-2">
          <div className="grid grid-cols-[0.8fr_1fr] gap-x-2 text-left text-[0.24cm] font-black leading-tight">
            <div className="text-right opacity-85">ID:</div><div>{valueOrDash(blind?.tagNo ?? blind?.blindNo)}</div>
            <div className="text-right opacity-85">Area:</div><div>{valueOrDash(blind?.areaCode ?? project?.areaCode)}</div>
            <div className="text-right opacity-85">Line:</div><div>{valueOrDash(blind?.lineNo)}</div>
            <div className="text-right opacity-85">Size:</div><div>{valueOrDash(blind?.size)}</div>
          </div>
        </div>
        <div className="mt-auto flex w-full items-end justify-between text-[0.18cm] font-black uppercase tracking-[0.12em] opacity-90">
          <span>{printMonthYear()}</span>
          <span className="max-w-[5.5cm] truncate text-right">{settings.showProjectNo ? valueOrDash(project?.projectNo ?? blind?.projectNo) : phase}</span>
        </div>
      </div>
    </article>
  );
}
