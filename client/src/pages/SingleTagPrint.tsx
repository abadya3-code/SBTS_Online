import { ArrowLeft, Printer } from "lucide-react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/common/PageHeader";
import { PrintStyles } from "@/components/print/PrintStyles";
import { ProfessionalTagCard } from "@/components/print/ProfessionalPrintLayouts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getCorporateIdentity } from "@/lib/corporateIdentity";
import { buildPrintFileName, printWithMode } from "@/lib/printExport";

function buildTagSettings(systemTags: any, general: any, corporate: any) {
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

export default function SingleTagPrint() {
  const [location, setLocation] = useLocation();
  const id = decodeURIComponent(location.split("/blinds/")[1]?.split("/tag")[0] ?? "");
  const detailQuery = trpc.core.blindDetail.useQuery({ id }, { enabled: Boolean(id), staleTime: 10_000 });
  const blind = detailQuery.data;
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 20_000 });
  const general = settingsQuery.data?.general;
  const corporate = getCorporateIdentity(general as any);
  const settings = buildTagSettings(settingsQuery.data?.tags, general, corporate);
  const recordTagPrint = trpc.core.recordTagPrint.useMutation({ onError: error => toast.error(error.message) });

  function printTag() {
    if (!blind) return;
    recordTagPrint.mutate({ blindId: blind.id, projectId: blind.projectId, scope: "Blind", tagCount: 1 });
    printWithMode("tag", buildPrintFileName("SBTS_TAG", blind.tagNo));
  }

  if (detailQuery.isLoading || settingsQuery.isLoading) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Preparing tag...</div>;
  if (!blind) return <div className="sbts-card p-8 text-sm font-bold text-slate-500">Blind not found.</div>;

  return (
    <div className="space-y-6">
      <PrintStyles />
      <div className="no-print">
        <PageHeader
          eyebrow="Single Professional QR Tag"
          title={`${blind.tagNo} · Printable Field Tag`}
          description="Modern 11 × 7 cm field tag with large QR, ID, area, line, size, date, and punch-hole mark."
          actions={
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLocation(`/blinds/${blind.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Blind Details</button>
              <button onClick={printTag} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg"><Printer className="h-4 w-4" /> Print Tag</button>
            </div>
          }
        />
      </div>
      <section className="flex justify-center">
        <ProfessionalTagCard blind={blind} project={{ projectNo: blind.projectNo, areaCode: blind.areaCode }} settings={settings} corporate={corporate} />
      </section>
    </div>
  );
}
