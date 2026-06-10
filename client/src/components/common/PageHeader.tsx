import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

function cleanEyebrow(value?: string) {
  if (!value) return value;
  const cleaned = value
    .replace(/Sprint\s*\d+(?:\.\d+)?\s*\/?\s*/gi, "")
    .replace(/SBTS\s*Sprint\s*\d+(?:\.\d+)?\s*\/?\s*/gi, "")
    .replace(/^\s*[\/\-–—]+\s*/g, "")
    .trim();
  return cleaned || undefined;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  const displayEyebrow = cleanEyebrow(eyebrow);
  return (
    <header className="sbts-page-header relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 px-5 py-5 shadow-[0_18px_45px_rgba(15,39,56,0.08)] backdrop-blur sm:px-6 sm:py-6">
      <div className="sbts-page-header-glow pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-cyan-50/80 to-transparent" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-4xl">
          {displayEyebrow && (
            <div className="sbts-eyebrow mb-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-cyan-700 ring-1 ring-cyan-100">
              {displayEyebrow}
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
