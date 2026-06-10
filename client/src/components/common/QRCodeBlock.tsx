import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";

type QRCodeBlockProps = {
  value: string;
  label?: string;
  size?: number;
  className?: string;
};

export function QRCodeBlock({ value, label, size = 168, className = "" }: QRCodeBlockProps) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: size,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then(dataUrl => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
        style={{ width: size + 18, height: size + 18 }}
      >
        {src ? (
          <img src={src} alt={label ? `${label} QR code` : "QR code"} width={size} height={size} className="h-auto w-auto" />
        ) : (
          <QrCode className="h-16 w-16 text-slate-300" />
        )}
      </div>
      {label && <div className="max-w-[12rem] truncate text-center text-[11px] font-black text-slate-700">{label}</div>}
    </div>
  );
}

export function buildBlindQrValue(blindId: string, tagNo?: string) {
  if (typeof window === "undefined") return `/blinds/${blindId}`;
  const url = new URL(`/blinds/${blindId}`, window.location.origin);
  if (tagNo) url.searchParams.set("tag", tagNo);
  return url.toString();
}
