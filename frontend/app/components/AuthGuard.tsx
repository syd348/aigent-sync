"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { bootstrapAuthSession, fetchMe } from "@/app/lib/api";
import {
  clearStoredSession,
  getSessionToken,
  isLoggedIn,
  setStoredSession,
} from "@/app/lib/auth";

function stripAuthQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("session");
  url.searchParams.delete("slack");
  url.searchParams.delete("message");
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get("session");

      if (urlSession) {
        try {
          await bootstrapAuthSession(urlSession);
        } catch {
          clearStoredSession();
          if (!cancelled) router.replace("/?slack=error&message=session_invalid");
          return;
        }
        stripAuthQueryParams();
      } else if (isLoggedIn()) {
        try {
          const user = await fetchMe();
          const token = getSessionToken();
          if (token) setStoredSession({ token, user });
        } catch {
          clearStoredSession();
          if (!cancelled) router.replace("/");
          return;
        }
      } else {
        if (!cancelled) router.replace("/");
        return;
      }

      if (!cancelled) setReady(true);
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
