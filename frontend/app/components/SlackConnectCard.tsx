"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { isLoggedIn } from "@/app/lib/auth";
import {
  disconnectSlack,
  fetchSlackConnectionStatus,
  getSlackOAuthLoginUrl,
} from "@/app/lib/api";
import { SlackConnectionStatus } from "@/app/types";
import { cn } from "@/app/lib/utils";

type OAuthNotice = { type: "success" | "error"; message: string } | null;

function readOAuthNotice(): OAuthNotice {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const slack = params.get("slack");
  if (slack === "connected") {
    return { type: "success", message: "Slack workspace connected successfully." };
  }
  if (slack === "error") {
    const detail = params.get("message");
    return {
      type: "error",
      message: detail
        ? `Slack connection failed: ${detail}`
        : "Slack connection failed. Please try again.",
    };
  }
  return null;
}

function clearOAuthQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("slack");
  url.searchParams.delete("message");
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function SlackConnectCard() {
  const [status, setStatus] = useState<SlackConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [notice, setNotice] = useState<OAuthNotice>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const next = await fetchSlackConnectionStatus();
      setStatus(next);
      setActionError(null);
    } catch {
      setActionError("Could not reach the backend. Is the API server running on port 8000?");
      setStatus({
        connected: false,
        oauth_configured: false,
        bot_token_configured: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const oauthNotice = readOAuthNotice();
    if (oauthNotice) {
      setNotice(oauthNotice);
      clearOAuthQueryParams();
    }
    loadStatus();
  }, [loadStatus]);

  const handleConnect = () => {
    setActionError(null);

    const loginUrl = status?.oauth_login_url ?? getSlackOAuthLoginUrl();
    if (!status?.oauth_configured) {
      setActionError(
        "Slack 계정 연동을 위해 backend/.env에 SLACK_CLIENT_ID와 SLACK_CLIENT_SECRET이 필요합니다. " +
          "api.slack.com/apps 에서 앱을 만든 뒤 OAuth Redirect URL에 " +
          "http://127.0.0.1:8000/api/slack/oauth/callback 을 등록하세요.",
      );
      return;
    }

    setIsConnecting(true);
    window.location.href = loginUrl;
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setActionError(null);
    try {
      await disconnectSlack();
      await loadStatus();
      setNotice({ type: "success", message: "Slack workspace disconnected." });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to disconnect Slack.",
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = status?.connected === true;
  const canUseOAuth = status?.oauth_configured === true;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-[#f4f2f6] flex items-center justify-center mb-6 relative">
          <MessageSquare
            className="w-8 h-8 text-[#4a154b]"
            fill="currentColor"
            strokeWidth={0}
          />
          {isConnected && !isLoading && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-2xl font-bold text-slate-900">Slack</h2>
          {isConnected && !isLoading && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              Connected
            </span>
          )}
        </div>
        <p className="text-slate-500 leading-relaxed">
          {isConnected && status?.team_name
            ? `Connected to ${status.team_name}. AI will ingest channel messages and create tasks automatically.`
            : "Connect your team channels. AI will automatically summarize key decisions and flag urgent requests in real-time."}
        </p>

        {notice && (
          <p
            className={cn(
              "mt-4 text-sm rounded-lg px-3 py-2",
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800",
            )}
          >
            {notice.message}
          </p>
        )}

        {actionError && (
          <p className="mt-4 text-sm rounded-lg px-3 py-2 bg-amber-50 text-amber-900">
            {actionError}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {isLoading ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 bg-slate-200 text-slate-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking connection…
          </button>
        ) : isConnected ? (
          <>
            {isLoggedIn() ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Continue to dashboard →
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black disabled:opacity-60 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isConnecting ? "Redirecting…" : "Sign in with Slack →"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-60"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </button>
            {canUseOAuth && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="text-sm text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline disabled:opacity-60"
              >
                {isConnecting ? "Redirecting…" : "Reconnect a different workspace"}
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="self-start inline-flex items-center gap-2 bg-[#111827] hover:bg-black disabled:opacity-60 text-white px-6 py-3 rounded-lg font-medium transition-colors group-hover:px-8 duration-300 ease-out"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                Sign in with Slack
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
