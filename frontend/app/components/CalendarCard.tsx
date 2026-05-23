"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
} from "lucide-react";
import { Task } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface CalendarCardProps {
  tasks: Task[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr === "TBD") return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const priorityDotColors: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-amber-400",
  Low: "bg-emerald-400",
};

export function CalendarCard({ tasks }: CalendarCardProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build map: "YYYY-MM-DD" → Task[]
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      const d = parseDate(t.deadline);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month - 1, d) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
  }
  // Fill remaining to complete grid
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) });
  }

  const getTasksForDate = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDate[key] || [];
  };

  // Upcoming deadlines (next 7 days, max 4)
  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);

    return tasks
      .filter((t) => {
        if (t.status === "done") return false;
        const d = parseDate(t.deadline);
        if (!d) return false;
        return d >= now && d <= weekLater;
      })
      .sort((a, b) => {
        const da = parseDate(a.deadline)!;
        const db = parseDate(b.deadline)!;
        return da.getTime() - db.getTime();
      })
      .slice(0, 4);
  }, [tasks]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col h-full transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">캘린더</h3>
        </div>
        <button
          onClick={goToday}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
        >
          오늘
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {year}년 {month + 1}월
        </h4>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 flex-1">
        {cells.map((cell, idx) => {
          const cellTasks = getTasksForDate(cell.date);
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const hasHigh = cellTasks.some((t) => t.priority === "High");
          const hasMed = cellTasks.some((t) => t.priority === "Medium");
          const hasLow = cellTasks.some(
            (t) => t.priority === "Low" || (!t.priority || (t.priority !== "High" && t.priority !== "Medium"))
          );

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(cell.date)}
              className={cn(
                "relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-all duration-200",
                cell.isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600",
                isToday && !isSelected && "bg-indigo-50 dark:bg-indigo-500/20 font-bold text-indigo-700 dark:text-indigo-400",
                isSelected && "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900",
                !isToday && !isSelected && cell.isCurrentMonth && "hover:bg-slate-50 dark:hover:bg-slate-700/50",
              )}
            >
              <span className="text-xs leading-none">{cell.day}</span>
              {/* Task dots */}
              {cellTasks.length > 0 && cell.isCurrentMonth && (
                <div className="flex gap-[3px] mt-1">
                  {hasHigh && (
                    <span
                      className={cn(
                        "w-[5px] h-[5px] rounded-full",
                        isSelected ? "bg-white/80" : "bg-red-500"
                      )}
                    />
                  )}
                  {hasMed && (
                    <span
                      className={cn(
                        "w-[5px] h-[5px] rounded-full",
                        isSelected ? "bg-white/80" : "bg-amber-400"
                      )}
                    />
                  )}
                  {hasLow && (
                    <span
                      className={cn(
                        "w-[5px] h-[5px] rounded-full",
                        isSelected ? "bg-white/80" : "bg-emerald-400"
                      )}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-700 my-4 transition-colors" />

      {/* Selected day tasks OR Upcoming deadlines */}
      {selectedDate && selectedTasks.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-3">
            {selectedDate.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} — {selectedTasks.length}개의 작업
          </p>
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {selectedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    priorityDotColors[t.priority ?? ""] || "bg-slate-300 dark:bg-slate-500"
                  )}
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                  {t.title}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  {t.assignee}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-3">
            다가오는 마감 작업
          </p>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">이번 주에 예정된 마감 작업이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((t) => {
                const d = parseDate(t.deadline)!;
                const isTaskToday = isSameDay(d, today);
                const diffDays = Math.round(
                  (d.getTime() - today.getTime()) / (1000 * 3600 * 24)
                );
                const label = isTaskToday
                  ? "오늘"
                  : diffDays === 1
                  ? "내일"
                  : `${diffDays}일 후`;

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 transition-colors"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        priorityDotColors[t.priority ?? ""] || "bg-slate-300 dark:bg-slate-500"
                      )}
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                      {t.title}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0",
                        isTaskToday
                          ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                          : diffDays <= 2
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
