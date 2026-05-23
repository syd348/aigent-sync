"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { logout } from "@/app/lib/api";
import { getAuthUser } from "@/app/lib/auth";
import { cn } from "@/app/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = getAuthUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
      setOpen(false);
    }
  };

  const displayName = user?.displayName ?? "User";
  const subtitle = user?.teamName ?? user?.email ?? "Slack workspace";
  const avatarUrl = user?.avatarUrl;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">{displayName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{subtitle}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-slate-500" />
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 hidden sm:block transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      )}
    </div>
  );
}
