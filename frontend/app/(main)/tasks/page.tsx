"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Task, TaskStatus, TaskPriority } from "@/app/types";
import { fetchTasks, updateTask, deleteTask } from "@/app/lib/api";
import {
  Download,
  Zap,
  ChevronDown,
  MessageSquare,
  Mail,
  Loader2,
  MoreVertical,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];
const STATUS_OPTIONS = [
  { label: "모든 상태", value: "" },
  { label: "할 일", value: "pending" },
  { label: "진행 중", value: "in-progress" },
  { label: "완료", value: "done" },
];
const TIMEFRAME_OPTIONS = [
  "최근 7일",
  "최근 30일",
  "최근 3달",
  "전체 기간",
];

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "할 일", className: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
    "in-progress": { label: "진행 중", className: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
    done: { label: "완료", className: "bg-orange-50 text-orange-500 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" },
    review: { label: "검토 중", className: "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" },
  };
  const { label, className } = config[status] ?? config.pending;
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors", className)}>
      {label}
    </span>
  );
}

function ChannelIcon({ source }: { source?: string }) {
  if (source === "email") {
    return (
      <div className="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 flex items-center justify-center transition-colors">
        <Mail className="w-4 h-4 text-red-400 dark:text-red-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors">
      <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" />
    </div>
  );
}

function AssigneeAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-blue-500",
    "bg-cyan-500", "bg-teal-500", "bg-emerald-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm", color)}>
      {initials}
    </div>
  );
}

function formatDeadline(deadline: string): string {
  if (!deadline || deadline === "TBD") return "미정";
  const parts = deadline.split("-");
  if (parts.length !== 3) return deadline;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function isWithinTimeframe(deadline: string, timeframe: string): boolean {
  if (timeframe === "전체 기간") return true;
  if (!deadline || deadline === "TBD") return true;
  const parts = deadline.split("-");
  if (parts.length !== 3) return true;
  const taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const now = new Date();
  const days = timeframe === "최근 7일" ? 7 : timeframe === "최근 30일" ? 30 : 90;
  const diff = Math.abs((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff <= days;
}

const POLL_INTERVAL_MS = 30_000;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskCount, setNewTaskCount] = useState(0);
  const prevTaskIdsRef = useRef<Set<string>>(new Set());

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [timeframe, setTimeframe] = useState("최근 7일");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks(true);

    // Background polling every 30s (no loading spinner after first load)
    const intervalId = setInterval(() => loadTasks(false), POLL_INTERVAL_MS);

    window.addEventListener("tasks-updated", () => loadTasks(false));
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("tasks-updated", () => loadTasks(false));
    };
  }, []);

  const loadTasks = async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true);
      const fetched = await fetchTasks();

      // Detect genuinely new tasks since last poll
      const validTasks = fetched.filter(t => t.status !== "review");
      const newIds = validTasks
        .map((t) => t.id)
        .filter((id) => !prevTaskIdsRef.current.has(id));
      if (newIds.length > 0 && prevTaskIdsRef.current.size > 0) {
        setNewTaskCount((c) => c + newIds.length);
      }
      prevTaskIdsRef.current = new Set(validTasks.map((t) => t.id));

      setTasks(validTasks);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateTask(taskId, { status: newStatus });
    } catch {
      loadTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch {
      loadTasks();
    }
    setActiveMenuId(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (!isWithinTimeframe(t.deadline, timeframe)) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, timeframe]);

  const uniqueAssignees = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t) => {
      if (seen.has(t.assignee)) return false;
      seen.add(t.assignee);
      return true;
    }).slice(0, 4);
  }, [tasks]);

  const extraAssigneeCount = Math.max(0, tasks.length - 4);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20 transition-colors">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight transition-colors">
              전체 작업 현황
            </h1>
            {newTaskCount > 0 && (
              <button
                onClick={() => setNewTaskCount(0)}
                className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-in zoom-in-75 duration-300 hover:bg-green-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                +{newTaskCount}개 새 항목
              </button>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 transition-colors">
            AI가 감지한 실행 작업과 교차 채널 워크플로우를 관리합니다.
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full animate-pulse" />
              실시간
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            내보내기
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-900 dark:bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors shadow-sm">
            <Zap className="w-4 h-4" />
            자동화 실행
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* STATUS */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative shadow-sm transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">상태</p>
          <button
            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowTimeMenu(false); setShowPriorityMenu(false); }}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "모든 상태"}
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setShowStatusMenu(false); }}
                  className={cn(
                     "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700",
                    statusFilter === opt.value ? "text-indigo-700 dark:text-indigo-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRIORITY */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative shadow-sm transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">우선순위</p>
          <button
            onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowStatusMenu(false); setShowTimeMenu(false); }}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {priorityFilter === "High" ? "높음" : priorityFilter === "Medium" ? "보통" : priorityFilter === "Low" ? "낮음" : "모든 우선순위"}
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
          {showPriorityMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => { setPriorityFilter(""); setShowPriorityMenu(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700",
                  priorityFilter === "" ? "text-indigo-700 dark:text-indigo-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                )}
              >
                모든 우선순위
              </button>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPriorityFilter(p); setShowPriorityMenu(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700",
                    priorityFilter === p ? "text-indigo-700 dark:text-indigo-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {p === "High" ? "높음" : p === "Medium" ? "보통" : "낮음"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ASSIGNEE */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">담당자</p>
          <div className="flex items-center gap-1">
            {uniqueAssignees.map((t) => (
              <AssigneeAvatar key={t.id} name={t.assignee} />
            ))}
            {extraAssigneeCount > 0 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                +{extraAssigneeCount}
              </div>
            )}
            {uniqueAssignees.length === 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">아직 배정된 담당자 없음</span>
            )}
          </div>
        </div>

        {/* TIMEFRAME */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative shadow-sm transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">조회 기간</p>
          <button
            onClick={() => { setShowTimeMenu(!showTimeMenu); setShowStatusMenu(false); setShowPriorityMenu(false); }}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {timeframe}
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
          {showTimeMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setTimeframe(opt); setShowTimeMenu(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700",
                    timeframe === opt ? "text-indigo-700 dark:text-indigo-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm mb-6 transition-colors overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {["작업 이름", "담당자", "중요도", "마감일", "상태", "채널"].map((h) => (
            <div key={h} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-10 h-10 mb-3 text-slate-200 dark:text-slate-600" />
            <p className="text-sm font-medium">필터와 일치하는 작업이 없습니다.</p>
            <p className="text-xs mt-1">위의 필터를 조정해 보세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-2 px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors items-center group relative"
              >
                {/* Task Name */}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2">
                    {task.title}
                  </p>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-2">
                  <AssigneeAvatar name={task.assignee} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">{task.assignee}</span>
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors",
                    task.priority === "High" ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" :
                    task.priority === "Medium" ? "bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" :
                    "bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                  )}>
                    {task.priority === "High" ? "높음" : task.priority === "Medium" ? "보통" : "낮음"}
                  </span>
                </div>

                {/* Deadline */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{formatDeadline(task.deadline)}</span>
                </div>

                {/* Status */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <StatusBadge status={task.status} />
                    <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </button>

                  {activeMenuId === task.id && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 w-32 overflow-hidden">
                      <button
                        onClick={() => { handleStatusChange(task.id, "pending"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        할 일로 표시
                      </button>
                      <button
                        onClick={() => { handleStatusChange(task.id, "in-progress"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        진행 중으로 표시
                      </button>
                      <button
                        onClick={() => { handleStatusChange(task.id, "done"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        완료로 표시
                      </button>
                      <hr className="border-slate-100 dark:border-slate-700" />
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="w-full text-left px-4 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {/* Channel */}
                <ChannelIcon source={task.source} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Optimization Alert */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm flex items-start gap-5 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-indigo-900 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-white dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-base mb-1">워크플로우 최적화 알림</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Aigent Sync가{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">슬랙 작업의 34%</span>에 마감일
            매개변수가 누락된 것을 감지했습니다. 모든 대기 중인 항목에 AI가 예측한 마감일을 적용하시겠습니까?
          </p>
          <div className="flex gap-3 mt-4">
            <button className="px-5 py-2 bg-indigo-900 dark:bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors">
              모두 적용
            </button>
            <button className="px-5 py-2 text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              상세 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
