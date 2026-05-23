"use client";

import { Bell, HelpCircle, History, Search } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="작업, 에이전트, 검토 항목 검색..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-8">
        <button className="text-slate-500 hover:text-slate-700">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <History className="w-5 h-5" />
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">Alex Chen</p>
            <p className="text-xs text-slate-500">운영 관리자</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
            <img 
              src="https://i.pravatar.cc/150?u=alex" 
              alt="Alex Chen" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
