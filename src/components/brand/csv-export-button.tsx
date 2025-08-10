"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toFaDigits } from "@/lib/format";

/**
 * Client-side CSV download button. Triggers a fetch to the given URL
 * (which returns a text/csv response) and downloads it as a blob.
 */
export function CsvExportButton({
  url,
  label = "خروجی CSV",
  filename,
  className,
  variant = "outline",
  size = "sm",
}: {
  url: string;
  label?: string;
  filename?: string;
  className?: string;
  variant?: "outline" | "ghost" | "default" | "secondary" | "destructive" | "link";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        toast.error("دانلود ناموفق بود.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      const name =
        filename ??
        disposition?.match(/filename="?([^"]+)"?/)?.[1] ??
        `export-${Date.now()}.csv`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      toast.success("فایل دانلود شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={downloading}
      className={className}
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
