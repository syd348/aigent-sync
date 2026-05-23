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

export function Sidebar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI 검토", href: "/ai-review", icon: BrainCircuit },
    { name: "작업 목록", href: "/tasks", icon: CheckSquare },
    { name: "연동 관리", href: "#", icon: Puzzle },
  ];

  const bottomItems = [
    { name: "고객 지원", href: "#", icon: LifeBuoy },
    { name: "설정", href: "#", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-indigo-900 flex items-center justify-center text-white font-bold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-slate-900">Aigent Sync</h1>
          <p className="text-xs text-slate-500">AI 코파일럿</p>
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
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-indigo-900 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-800 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> 새 작업
        </button>
        {bottomItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </div>

      <AiTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}
