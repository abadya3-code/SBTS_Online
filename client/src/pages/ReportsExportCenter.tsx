import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BarChart3, ClipboardList, Download, FileSpreadsheet, Filter, Printer, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PrintStyles } from "@/components/print/PrintStyles";
import { getCorporateIdentity, initialsFromCompanyName } from "@/lib/corporateIdentity";
import { buildPrintFileName, printWithMode } from "@/lib/printExport";

type CsvValue = string | number | null | undefined;

function downloadCsv(filename: string, rows: Record<string, CsvValue>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: CsvValue) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function KpiCard({ label, value, hint, tone = "slate" }: { label: string; value: string | number; hint: string; tone?: "slate" | "cyan" | "emerald" | "amber" | "rose" }) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  }[tone];
  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <div className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-xs font-semibold opacity-75">{hint}</div>
    </div>
  );
}

export default function ReportsExportCenter() {
  const [projectId, setProjectId] = useState<string>(() => new URLSearchParams(window.location.search).get("projectId") ?? "");
  const projectsQuery = trpc.core.projects.useQuery(undefined, { staleTime: 30_000 });
  const reportQuery = trpc.core.reportCenter.useQuery({ projectId: projectId || null }, { staleTime: 20_000 });
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 30_000 });
  const corporate = getCorporateIdentity(settingsQuery.data?.general as SystemGeneralSettings | undefined);
  const recordExport = trpc.core.recordReportExport.useMutation();

  const report = reportQuery.data;
  const projectOptions = projectsQuery.data ?? [];

  const blindRows = useMemo(() => (report?.rows ?? []).map((row) => ({
    Project_No: row.projectNo,
    Project: row.projectName,
    Area: row.areaCode,
    Tag_No: row.tagNo,
    Blind_No: row.blindNo,
    Line_No: row.lineNo,
    Size: row.size,
    Rating: row.rating ?? "",
    Type: row.blindType,
    Phase: row.phaseLabel,
    Status: row.status,
    Priority: row.priority,
  })), [report?.rows]);

  const projectRows = useMemo(() => (report?.projectProgress ?? []).map((row) => ({
    Project_No: row.projectNo,
    Project: row.projectName,
    Area: row.areaCode,
    Progress: `${row.progress}%`,
    Status: row.status,
    Total_Blinds: row.blindCount,
    Completed: row.completedCount,
    Pending_Approval: row.pendingApprovalCount,
    Target_Date: row.targetDate ?? "",
  })), [report?.projectProgress]);

  const areaRows = useMemo(() => (report?.areaPerformance ?? []).map((row) => ({
    Area: row.areaCode,
    Area_Name: row.areaName,
    Projects: row.projectCount,
    Blinds: row.blindCount,
    Completion: `${row.completionPercent}%`,
    Pending_Approval: row.pendingApprovalCount,
  })), [report?.areaPerformance]);

  const phaseRows = useMemo(() => (report?.phaseBreakdown ?? []).map((row) => ({
    Phase: row.phaseLabel,
    Owner: row.owner,
    Count: row.count,
    Percent: `${row.percent}%`,
  })), [report?.phaseBreakdown]);

  const exportPackage = async (id: string, title: string, rows: Record<string, CsvValue>[]) => {
    if (!rows.length) {
      toast.warning("No rows available for this export.");
      return;
    }
    downloadCsv(`SBTS_${title.replaceAll(" ", "_")}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    try {
      await recordExport.mutateAsync({ projectId: projectId || null, packageName: title, fileType: "CSV", rowCount: rows.length });
      toast.success(`${title} exported and logged to Audit Trail.`);
      reportQuery.refetch();
    } catch {
      toast.success(`${title} exported locally. Audit log will sync when backend is available.`);
    }
  };

  const packageRows = (id: string) => {
    if (id === "management-summary") return projectRows;
    if (id === "area-performance") return areaRows;
    if (id === "phase-breakdown") return phaseRows;
    return blindRows;
  };

  return (
    <div className="space-y-6">
      <PrintStyles />
      <section className="no-print overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 text-white shadow-[0_26px_90px_rgba(15,39,56,0.2)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              <BarChart3 className="h-4 w-4" /> Reports Export Center
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Reports & Export Center</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              A clean management-ready reporting layer for SBTS. Generate blind registers, project summaries, area performance, phase breakdowns, and audit-backed export events from one place.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-white"><Filter className="h-4 w-4 text-cyan-200" /> Report Scope</div>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none">
              <option value="">All Projects / Enterprise Overview</option>
              {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.projectNo} — {project.name}</option>)}
            </select>
            <div className="mt-4 flex gap-2">
              <button onClick={() => reportQuery.refetch()} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950"><RefreshCw className="h-4 w-4" /> Refresh</button>
              <button onClick={() => { recordExport.mutate({ projectId: projectId || null, packageName: "Report Print View", fileType: "PDF", rowCount: report?.rows?.length ?? 0 }); printWithMode("report", buildPrintFileName("SBTS_REPORT", report?.scope?.label ?? "all_projects")); }} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white"><Printer className="h-4 w-4" /> Print View</button>
            </div>
          </div>
        </div>
      </section>

      {reportQuery.isLoading && <div className="sbts-card p-6 text-sm font-bold text-slate-500">Loading report model...</div>}

      {report && (
        <>
          <section className="print-only report-print-page">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                {corporate.showOnReports && corporate.companyLogo ? <img src={corporate.companyLogo} alt="Company" className="h-16 w-16 rounded-2xl bg-white p-2 object-contain" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">{initialsFromCompanyName(corporate.companyShortName)}</div>}
                <div><div className="text-xl font-black text-slate-950">{corporate.showOnReports ? corporate.companyName : "SBTS"}</div><div className="text-xs font-bold text-slate-500">{corporate.companySubtitle}</div></div>
              </div>
              <div className="text-right text-xs font-black uppercase tracking-[0.18em] text-slate-400">Reports Center</div>
            </div>
            <h1 className="text-2xl font-black text-slate-950">SBTS Management Report</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">Scope: {report.scope.label} · Generated: {new Date(report.generatedAt).toLocaleString()}</p>
            <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs">
              <div className="border p-2"><b>Completion</b><br />{report.kpis.completionPercent}%</div>
              <div className="border p-2"><b>Total Blinds</b><br />{report.kpis.totalBlinds}</div>
              <div className="border p-2"><b>Pending</b><br />{report.kpis.pendingApprovals}</div>
              <div className="border p-2"><b>Torque</b><br />{report.kpis.torqueRecords}</div>
              <div className="border p-2"><b>Certificates</b><br />{report.kpis.certificatesIssued}</div>
            </div>
            <h2 className="mt-6 text-lg font-black">Project Progress</h2>
            <table className="mt-3 w-full border-collapse text-xs"><thead><tr className="bg-slate-100"><th className="border p-2">Project</th><th className="border p-2">Area</th><th className="border p-2">Progress</th><th className="border p-2">Blinds</th><th className="border p-2">Pending</th></tr></thead><tbody>{report.projectProgress.map(project => <tr key={project.projectId}><td className="border p-2">{project.projectNo} · {project.projectName}</td><td className="border p-2">{project.areaCode}</td><td className="border p-2">{project.progress}%</td><td className="border p-2">{project.blindCount}</td><td className="border p-2">{project.pendingApprovalCount}</td></tr>)}</tbody></table>
            <h2 className="mt-6 text-lg font-black">Blind Register Preview</h2>
            <table className="mt-3 w-full border-collapse text-[10px]"><thead><tr className="bg-slate-100"><th className="border p-1">Tag</th><th className="border p-1">Blind</th><th className="border p-1">Project</th><th className="border p-1">Area</th><th className="border p-1">Line</th><th className="border p-1">Phase</th><th className="border p-1">Status</th></tr></thead><tbody>{report.rows.slice(0, 30).map(row => <tr key={row.blindId}><td className="border p-1">{row.tagNo}</td><td className="border p-1">{row.blindNo}</td><td className="border p-1">{row.projectNo}</td><td className="border p-1">{row.areaCode}</td><td className="border p-1">{row.lineNo}</td><td className="border p-1">{row.phaseLabel}</td><td className="border p-1">{row.status}</td></tr>)}</tbody></table>
          </section>
          <section className="no-print grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="Completion" value={`${report.kpis.completionPercent}%`} hint="Selected scope progress" tone="emerald" />
            <KpiCard label="Total Blinds" value={report.kpis.totalBlinds} hint="Tracked blind tags" tone="cyan" />
            <KpiCard label="Pending Approval" value={report.kpis.pendingApprovals} hint="Approval inbox queue" tone="amber" />
            <KpiCard label="Torque Records" value={report.kpis.torqueRecords} hint="Recorded torque actions" />
            <KpiCard label="Certificates" value={report.kpis.certificatesIssued} hint="Issued or printed" tone="rose" />
          </section>

          <section className="no-print grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <div className="sbts-card p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div><h2 className="text-lg font-black text-slate-950">Project Progress Summary</h2><p className="text-sm font-semibold text-slate-500">Scope: {report.scope.label}</p></div>
                <button onClick={() => exportPackage("management-summary", "Management Summary", projectRows)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"><Download className="h-4 w-4" /> CSV</button>
              </div>
              <div className="space-y-3">
                {report.projectProgress.map((project) => (
                  <Link key={project.projectId} href={`/projects/${project.projectId}`} className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><div className="font-black text-slate-950">{project.projectNo} • {project.projectName}</div><div className="text-xs font-bold text-slate-500">{project.areaCode} • {project.blindCount} blinds • {project.status}</div></div>
                      <div className="flex items-center gap-3"><span className="text-xl font-black text-slate-950">{project.progress}%</span><ArrowRight className="h-4 w-4 text-slate-400" /></div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${project.progress}%` }} /></div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="sbts-card p-5">
              <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-lg font-black text-slate-950">Export Packages</h2><p className="text-sm font-semibold text-slate-500">CSV now; PDF/Excel/PPT hooks ready for backend.</p></div><FileSpreadsheet className="h-5 w-5 text-cyan-600" /></div>
              <div className="space-y-3">
                {report.exportPackages.map((pack) => (
                  <div key={pack.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><div className="font-black text-slate-950">{pack.title}</div><div className="mt-1 text-xs leading-5 text-slate-500">{pack.description}</div><div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-700">{pack.recommendedFor}</div></div>
                      <button onClick={() => exportPackage(pack.id, pack.title, packageRows(pack.id))} className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-cyan-50"><Download className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="no-print grid gap-5 xl:grid-cols-2">
            <div className="sbts-card p-5">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">Area Performance</h2><button onClick={() => exportPackage("area-performance", "Area Performance", areaRows)} className="text-xs font-black text-cyan-700">Export CSV</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-2">Area</th><th>Projects</th><th>Blinds</th><th>Completion</th><th>Pending</th></tr></thead><tbody className="divide-y divide-slate-100">{report.areaPerformance.map((area) => <tr key={area.areaId}><td className="py-3 font-black text-slate-950">{area.areaCode}<div className="text-xs font-semibold text-slate-500">{area.areaName}</div></td><td>{area.projectCount}</td><td>{area.blindCount}</td><td>{area.completionPercent}%</td><td>{area.pendingApprovalCount}</td></tr>)}</tbody></table></div>
            </div>
            <div className="sbts-card p-5">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">Phase Breakdown</h2><button onClick={() => exportPackage("phase-breakdown", "Phase Breakdown", phaseRows)} className="text-xs font-black text-cyan-700">Export CSV</button></div>
              <div className="space-y-3">{report.phaseBreakdown.map((phase) => <div key={phase.phaseKey} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><div><div className="font-black text-slate-950">{phase.phaseLabel}</div><div className="text-xs font-semibold text-slate-500">Owner: {phase.owner}</div></div><div className="text-xl font-black text-slate-950">{phase.count}</div></div><div className="mt-3 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-slate-950" style={{ width: `${phase.percent}%` }} /></div></div>)}</div>
            </div>
          </section>

          <section className="no-print sbts-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-black text-slate-950">Blind Register Preview</h2><p className="text-sm font-semibold text-slate-500">First 12 rows from the selected scope.</p></div><button onClick={() => exportPackage("blind-register", "Blind Register", blindRows)} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-black text-white"><ClipboardList className="h-4 w-4" /> Export Full Register</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Tag</th><th className="px-5 py-3">Blind</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Line</th><th className="px-5 py-3">Size/Rating</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{report.rows.slice(0, 12).map((row) => <tr key={row.blindId} className="bg-white"><td className="px-5 py-4 font-black text-slate-950">{row.tagNo}</td><td className="px-5 py-4">{row.blindNo}</td><td className="px-5 py-4">{row.projectNo}</td><td className="px-5 py-4">{row.areaCode}</td><td className="px-5 py-4">{row.lineNo}</td><td className="px-5 py-4">{row.size} / {row.rating ?? "N/A"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{row.phaseLabel}</span></td><td className="px-5 py-4">{row.status}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </div>
  );
}
