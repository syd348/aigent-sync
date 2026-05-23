"use client";

import { Bell, HelpCircle, History, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchTasks } from "@/app/lib/api";
import { Task } from "@/app/types";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/app/components/UserMenu";

export function Header() {
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [seenTaskIds, setSeenTaskIds] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const initFetch = async () => {
      try {
        const tasks = await fetchTasks("review");
        setSeenTaskIds(new Set(tasks.map((t) => t.id)));
      } catch {
        /* ignore */
      }
    };
    initFetch();

    const interval = setInterval(async () => {
      try {
        const tasks = await fetchTasks("review");
        setSeenTaskIds((prevSeen) => {
          const newNotifications: Task[] = [];
          const updatedSeen = new Set(prevSeen);

          tasks.forEach((t) => {
            if (!updatedSeen.has(t.id)) {
              updatedSeen.add(t.id);
              newNotifications.push(t);
            }
          });

          if (newNotifications.length > 0) {
            setNotifications((prev) => [...newNotifications, ...prev].slice(0, 10));
          }
          return updatedSeen;
        });
      } catch {
        /* ignore */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setIsDropdownOpen(false);
    setNotifications([]);
    router.push("/ai-review");
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end px-8 sticky top-0 z-10 w-full transition-colors duration-300">
      <div className="flex items-center gap-6 ml-8">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors relative flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">알림</h3>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    새로운 알림이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {notifications.map((task) => (
                      <div
                        key={task.id}
                        onClick={handleNotificationClick}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex gap-3 group"
                      >
                        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 transition-colors">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1">
                            AI가 새 작업을 추출했습니다
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            &quot;{task.title}&quot;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                onClick={() => {
                  setIsDropdownOpen(false);
                  router.push("/ai-review");
                }}
                className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50"
              >
                AI 검토 큐로 이동
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <History className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <UserMenu />
      </div>
    </header>
  );
}
