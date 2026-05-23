"use client";

import { ClipboardList, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface MetricsProps {
  activeTasks: number;
  completionRate: number;
  nearingDeadlines: number;
  overdueTasks: number;
}

export function MetricsOverview({ activeTasks, completionRate, nearingDeadlines, overdueTasks }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Active Tasks */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">마지막 업데이트: 방금 전</span>
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">총 진행 중인 작업</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-indigo-900 dark:text-indigo-100">{activeTasks.toLocaleString()}</span>
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              어제 대비 +12.5%
            </span>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-center gap-6 shadow-sm transition-colors duration-300">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100 dark:text-slate-700"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-indigo-800 dark:text-indigo-400"
              strokeWidth="4"
              strokeDasharray={`${completionRate}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-xl font-bold text-indigo-900 dark:text-indigo-100">{completionRate}%</div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight">완료율</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">목표: 90%</p>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 self-start">
            목표 달성
          </span>
        </div>
      </div>

      {/* Nearing Deadlines */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-50 dark:bg-orange-500/20 rounded-lg text-orange-600 dark:text-orange-400">
            <Clock className="w-5 h-5" />
          </div>
          <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <span className="text-xl leading-none">...</span>
          </button>
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">마감 임박 작업</h3>
          <div className="text-4xl font-bold text-orange-600 dark:text-orange-500 mb-2">{nearingDeadlines}</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">4시간 이내 마감 작업</p>
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm transition-colors duration-300">
        <div className="p-2 bg-red-50 dark:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400 self-start mb-4">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">기한 초과</h3>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-bold text-red-600 dark:text-red-500">{overdueTasks < 10 ? `0${overdueTasks}` : overdueTasks}</span>
          </div>
          <span className="flex items-center text-red-500 dark:text-red-400 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1 transform rotate-180" />
            평균 대비 -3건
          </span>
        </div>
      </div>
    </div>
  );
}
