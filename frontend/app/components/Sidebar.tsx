"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  CheckSquare, 
  Puzzle,
  LifeBuoy,
  Settings
} from "lucide-react";
import { AiTaskModal } from "./AiTaskModal";
import { SettingsModal } from "./SettingsModal";

export function Sidebar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const navItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI 검토", href: "/ai-review", icon: BrainCircuit },
    { name: "작업 목록", href: "/tasks", icon: CheckSquare },
    { name: "연동 관리", href: "/integrations", icon: Puzzle },
  ];

  const bottomItems = [
    { name: "설정", action: () => setIsSettingsOpen(true), icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-indigo-900 flex items-center justify-center text-white font-bold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 transition-colors">Aigent Sync</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">AI 코파일럿</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1 transition-colors duration-300">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-indigo-900 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-800 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> 새 작업
        </button>
        {bottomItems.map((item) => {
          if (item.action) {
            return (
              <button
                key={item.name}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          }
          return (
            <Link
              key={item.name}
              href={item.href!}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <AiTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
}
