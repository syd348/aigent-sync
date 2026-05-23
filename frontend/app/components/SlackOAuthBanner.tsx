"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/app/lib/utils";

type Banner = { type: "success" | "error"; message: string } | null;

function readSlackBanner(): Banner {
  const params = new URLSearchParams(window.location.search);
  const slack = params.get("slack");
  if (slack === "connected") {
    return {
      type: "success",
      message: "Slack is connected. New messages will be parsed into tasks automatically.",
    };
  }
  if (slack === "error") {
    const detail = params.get("message");
    return {
      type: "error",
      message: detail
        ? `Slack connection failed: ${detail}`
        : "Slack connection failed. Check Slack app OAuth settings and try again.",
    };
  }
  return null;
}

export function SlackOAuthBanner() {
  const [banner, setBanner] = useState<Banner>(null);

  useEffect(() => {
    const next = readSlackBanner();
    if (!next) return;
    setBanner(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("slack");
    url.searchParams.delete("message");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  if (!banner) return null;

  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        banner.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900",
      )}
    >
      {banner.type === "success" ? (
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <p className="flex-1">{banner.message}</p>
      <button
        type="button"
        onClick={() => setBanner(null)}
        className="shrink-0 rounded p-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
