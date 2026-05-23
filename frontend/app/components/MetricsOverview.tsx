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
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Last updated: Just now</span>
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Active Tasks</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-indigo-900">{activeTasks.toLocaleString()}</span>
            <span className="flex items-center text-emerald-600 text-sm font-medium mb-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12.5% from yesterday
            </span>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center gap-6 shadow-sm">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-indigo-800"
              strokeWidth="4"
              strokeDasharray={`${completionRate}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-xl font-bold text-indigo-900">{completionRate}%</div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-900 font-bold text-lg leading-tight">Completion<br/>Rate</h3>
          <p className="text-sm text-slate-500">Target: 90%</p>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 self-start">
            ABOVE TARGET
          </span>
        </div>
      </div>

      {/* Nearing Deadlines */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <span className="text-xl leading-none">...</span>
          </button>
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Nearing Deadlines</h3>
          <div className="text-4xl font-bold text-orange-600 mb-2">{nearingDeadlines}</div>
          <p className="text-sm text-slate-500">Tasks due in &lt; 4 hours</p>
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
        <div className="p-2 bg-red-50 rounded-lg text-red-600 self-start mb-4">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Overdue</h3>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-bold text-red-600">{overdueTasks < 10 ? `0${overdueTasks}` : overdueTasks}</span>
          </div>
          <span className="flex items-center text-red-500 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1 transform rotate-180" />
            -3 from average
          </span>
        </div>
      </div>
    </div>
  );
}
