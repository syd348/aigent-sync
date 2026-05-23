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
  { label: "All Statuses", value: "" },
  { label: "To-do", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];
const TIMEFRAME_OPTIONS = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 3 Months",
  "All Time",
];

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    pending: { label: "To-do", className: "bg-slate-100 text-slate-600 border border-slate-200" },
    "in-progress": { label: "In-progress", className: "bg-blue-50 text-blue-600 border border-blue-200" },
    done: { label: "Done", className: "bg-orange-50 text-orange-500 border border-orange-200" },
  };
  const { label, className } = config[status] ?? config.pending;
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", className)}>
      {label}
    </span>
  );
}

function PriorityChip({ priority, selected, onClick }: { priority: string; selected: boolean; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    High: selected ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-500",
    Medium: selected ? "bg-yellow-400 text-white border-yellow-400" : "bg-white text-slate-600 border-slate-200 hover:border-yellow-300 hover:text-yellow-500",
    Low: selected ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-500",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-md text-xs font-semibold border transition-all duration-150",
        colorMap[priority]
      )}
    >
      {priority === "Medium" ? "Med" : priority}
    </button>
  );
}

function ConfidenceBar({ value }: { value?: number }) {
  if (value === undefined || value === null) {
    return <span className="text-slate-400 text-xs">N/A</span>;
  }
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "bg-blue-600" : pct >= 70 ? "bg-blue-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", pct >= 70 ? "text-blue-600" : "text-slate-400")}>
        {pct}%
      </span>
    </div>
  );
}

function ChannelIcon({ source }: { source?: string }) {
  if (source === "email") {
    return (
      <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center">
        <Mail className="w-4 h-4 text-red-400" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
      <MessageSquare className="w-4 h-4 text-slate-400" />
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
    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold", color)}>
      {initials}
    </div>
  );
}

function formatDeadline(deadline: string): string {
  if (!deadline || deadline === "TBD") return "TBD";
  const parts = deadline.split("-");
  if (parts.length !== 3) return deadline;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isWithinTimeframe(deadline: string, timeframe: string): boolean {
  if (timeframe === "All Time") return true;
  if (!deadline || deadline === "TBD") return true;
  const parts = deadline.split("-");
  if (parts.length !== 3) return true;
  const taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const now = new Date();
  const days = timeframe === "Last 7 Days" ? 7 : timeframe === "Last 30 Days" ? 30 : 90;
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
  const [timeframe, setTimeframe] = useState("Last 7 Days");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
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
      const newIds = fetched
        .map((t) => t.id)
        .filter((id) => !prevTaskIdsRef.current.has(id));
      if (newIds.length > 0 && prevTaskIdsRef.current.size > 0) {
        setNewTaskCount((c) => c + newIds.length);
      }
      prevTaskIdsRef.current = new Set(fetched.map((t) => t.id));

      setTasks(fetched);
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
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">
              Task Orchestration
            </h1>
            {newTaskCount > 0 && (
              <button
                onClick={() => setNewTaskCount(0)}
                className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-in zoom-in-75 duration-300 hover:bg-green-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                +{newTaskCount} New
              </button>
            )}
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            Manage AI-detected action items and cross-channel workflows.
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-900 text-white text-sm font-medium hover:bg-indigo-800 transition-colors shadow-sm">
            <Zap className="w-4 h-4" />
            Run Automation
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* STATUS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Status</p>
          <button
            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowTimeMenu(false); }}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "All Statuses"}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setShowStatusMenu(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50",
                    statusFilter === opt.value ? "text-indigo-700 font-semibold" : "text-slate-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRIORITY */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Priority</p>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <PriorityChip
                key={p}
                priority={p}
                selected={priorityFilter === p}
                onClick={() => setPriorityFilter(priorityFilter === p ? "" : p)}
              />
            ))}
          </div>
        </div>

        {/* ASSIGNEE */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Assignee</p>
          <div className="flex items-center gap-1">
            {uniqueAssignees.map((t) => (
              <AssigneeAvatar key={t.id} name={t.assignee} />
            ))}
            {extraAssigneeCount > 0 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                +{extraAssigneeCount}
              </div>
            )}
            {uniqueAssignees.length === 0 && (
              <span className="text-xs text-slate-400">No assignees yet</span>
            )}
          </div>
        </div>

        {/* TIMEFRAME */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 relative shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Timeframe</p>
          <button
            onClick={() => { setShowTimeMenu(!showTimeMenu); setShowStatusMenu(false); }}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            {timeframe}
            <Calendar className="w-4 h-4 text-slate-400" />
          </button>
          {showTimeMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setTimeframe(opt); setShowTimeMenu(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50",
                    timeframe === opt ? "text-indigo-700 font-semibold" : "text-slate-700"
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_100px] gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
          {["Task Name", "Assignee", "Confidence", "Deadline", "Status", "Channel", "Actions"].map((h) => (
            <div key={h} className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CheckCircle2 className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-medium">No tasks match your filters.</p>
            <p className="text-xs mt-1">Try adjusting the filters above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_100px] gap-2 px-6 py-4 hover:bg-slate-50/60 transition-colors items-center group relative"
              >
                {/* Task Name */}
                <div>
                  <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
                    {task.title}
                  </p>
                  {task.priority === "High" && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      High priority
                    </p>
                  )}
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-2">
                  <AssigneeAvatar name={task.assignee} />
                  <span className="text-xs text-slate-600 font-medium truncate">{task.assignee}</span>
                </div>

                {/* Confidence */}
                <ConfidenceBar value={task.confidence} />

                {/* Deadline */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="text-xs text-slate-600">{formatDeadline(task.deadline)}</span>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={task.status} />
                </div>

                {/* Channel */}
                <ChannelIcon source={task.source} />

                {/* Actions */}
                <div className="flex items-center gap-2 relative">
                  {task.status !== "in-progress" && task.status !== "done" && (
                    <button
                      onClick={() => handleStatusChange(task.id, "in-progress")}
                      className="text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      Start
                    </button>
                  )}
                  {task.status === "in-progress" && (
                    <button
                      onClick={() => handleStatusChange(task.id, "done")}
                      className="text-[11px] text-green-600 font-semibold hover:underline"
                    >
                      Done
                    </button>
                  )}
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>

                  {activeMenuId === task.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 w-36 overflow-hidden">
                      <button
                        onClick={() => { handleStatusChange(task.id, "pending"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Mark To-do
                      </button>
                      <button
                        onClick={() => { handleStatusChange(task.id, "in-progress"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => { handleStatusChange(task.id, "done"); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Mark Done
                      </button>
                      <hr className="border-slate-100" />
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Optimization Alert */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-start gap-5">
        <div className="w-12 h-12 rounded-xl bg-indigo-900 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-indigo-900 text-base mb-1">Workflow Optimization Alert</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Aigent Sync detected that{" "}
            <span className="font-semibold text-slate-800">34% of Slack tasks</span> are missing
            deadline parameters. Apply AI-estimated deadlines to all pending entries?
          </p>
          <div className="flex gap-3 mt-4">
            <button className="px-5 py-2 bg-indigo-900 text-white text-sm font-semibold rounded-lg hover:bg-indigo-800 transition-colors">
              Apply to All
            </button>
            <button className="px-5 py-2 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
