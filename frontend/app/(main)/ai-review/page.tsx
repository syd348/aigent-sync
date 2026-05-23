"use client";

import { useState } from "react";
import {
  Sparkles,
  ClipboardList,
  MessageSquare,
  Mail,
  User,
  Calendar,
  Trash2,
  Pencil,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Bot,
  Loader2,
} from "lucide-react";
import { createTask } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface PendingTask {
  id: string;
  channel: string;
  channelType: "slack" | "email";
  originalMessage: string;
  requester: string;
  requesterInitials: string;
  requesterColor: string;
  sentAgo: string;
  aiTitle: string;
  assignee: string;
  deadline: string;
  confidence: number; // 0–1
}

// ─────────────────────────────────────────────
// Circular Confidence Gauge
// ─────────────────────────────────────────────
function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 85 ? "#1e3a8a" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36" cy="36" r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth="6"
        />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="36" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {pct}%
        </text>
      </svg>
      <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
        Confidence
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Channel Icon
// ─────────────────────────────────────────────
function ChannelBadge({ type, label }: { type: "slack" | "email"; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          type === "slack" ? "bg-purple-100" : "bg-blue-100"
        )}
      >
        {type === "slack" ? (
          <MessageSquare className="w-4 h-4 text-purple-700" />
        ) : (
          <Mail className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <span className="font-semibold text-slate-800 text-sm">{label}</span>
      <span className="text-xs text-slate-400">
        {type === "slack" ? "Slack Message" : "Email Thread"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Review Card
// ─────────────────────────────────────────────
function ReviewCard({
  task,
  onApprove,
  onDiscard,
}: {
  task: PendingTask;
  onApprove: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  const isLowConfidence = task.confidence < 0.6;
  const badgeLabel = isLowConfidence ? "LOW CONFIDENCE" : "AI PROPOSED";
  const badgeClass = isLowConfidence
    ? "bg-red-100 text-red-600 border border-red-200"
    : "bg-indigo-50 text-indigo-700 border border-indigo-200";

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border overflow-hidden shadow-sm flex",
        isLowConfidence ? "border-l-4 border-l-red-400 border-t-slate-200 border-r-slate-200 border-b-slate-200" : "border-slate-200"
      )}
    >
      {/* Left: Original Message */}
      <div className="w-[42%] shrink-0 border-r border-slate-100 p-6 flex flex-col">
        <ChannelBadge type={task.channelType} label={task.channel} />

        {/* Quotation */}
        <div className="relative flex-1">
          <span className="absolute -top-1 -left-1 text-4xl text-slate-200 font-serif leading-none select-none">
            "
          </span>
          <p className="text-slate-600 text-sm leading-relaxed italic pl-5 pr-2 pt-3">
            {task.originalMessage}
          </p>
        </div>

        {/* Requester */}
        <div className="flex items-center gap-2 mt-4">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold",
              task.requesterColor
            )}
          >
            {task.requesterInitials}
          </div>
          <span className="text-sm font-medium text-slate-700">{task.requester}</span>
          <span className="text-xs text-slate-400">{task.sentAgo}</span>
        </div>
      </div>

      {/* Right: AI Extracted Task */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          {/* Badge + Title + Gauge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-2 tracking-wider uppercase", badgeClass)}>
                {badgeLabel}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {task.aiTitle}
              </h3>
            </div>
            <ConfidenceGauge value={task.confidence} />
          </div>

          {/* Assignee + Deadline */}
          <div className="flex gap-6 border-t border-slate-100 pt-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assignee</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isLowConfidence ? "text-slate-400 italic" : "text-slate-800"
                  )}
                >
                  {task.assignee}
                </p>
                {isLowConfidence && (
                  <p className="text-[10px] text-slate-400">Manual assign required</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</p>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-line">
                  {task.deadline}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => onDiscard(task.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Discard
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            {isLowConfidence ? "Edit Details" : "Edit"}
          </button>
          <button
            onClick={() => !isLowConfidence && onApprove(task.id)}
            className={cn(
              "flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold ml-auto transition-colors",
              isLowConfidence
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-900 text-white hover:bg-indigo-800"
            )}
          >
            {isLowConfidence ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                Fix to Approve
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Approve & Sync
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Input Panel
// ─────────────────────────────────────────────
function InputPanel({
  onAnalyzed,
}: {
  onAnalyzed: (task: PendingTask) => void;
}) {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handle = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const newTask: PendingTask = {
        id: Math.random().toString(36).slice(2),
        channel: "#manual-input",
        channelType: "slack",
        originalMessage: text,
        requester: "You",
        requesterInitials: "YU",
        requesterColor: "bg-indigo-500",
        sentAgo: "Just now",
        aiTitle: data.description || "Untitled Task",
        assignee: data.assignee || "Unclear – Manual assign required",
        deadline: data.deadline
          ? new Date(data.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              weekday: "long",
            }) + " · 5:00 PM"
          : "Not specified",
        confidence: data.confidence_score ?? 0.7,
      };
      onAnalyzed(newTask);
      setText("");
    } catch {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        Paste a new communication to extract tasks
      </h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste Slack message, email, or meeting notes here..."
        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handle}
          disabled={isAnalyzing || !text.trim()}
          className="flex items-center gap-2 bg-indigo-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
          ) : (
            <><Bot className="w-4 h-4" /> Analyze with AI</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEMO data (shown until real items arrive)
// ─────────────────────────────────────────────
const DEMO_TASKS: PendingTask[] = [
  {
    id: "demo-1",
    channel: "#product-ops",
    channelType: "slack",
    originalMessage:
      '"Hey @Sarah, can you make sure to update the Q3 roadmap deck with the new agentic workflows by EOD Thursday? We need it for the board meeting."',
    requester: "John Doe",
    requesterInitials: "JD",
    requesterColor: "bg-blue-600",
    sentAgo: "Sent 2h ago",
    aiTitle: "Update Q3 Roadmap Deck",
    assignee: "Sarah Miller",
    deadline: "Aug 24 (Thursday)\n5:00 PM",
    confidence: 0.94,
  },
  {
    id: "demo-2",
    channel: "External Partner",
    channelType: "email",
    originalMessage:
      '"Regarding the API integration—we\'ve finished the documentation. Could you review the security protocols in section 4.2 by Friday noon?"',
    requester: "Alex Martinez",
    requesterInitials: "AM",
    requesterColor: "bg-orange-500",
    sentAgo: "Sent 4h ago",
    aiTitle: "Review Security Protocols (Sec 4.2)",
    assignee: "Security Team",
    deadline: "Aug 25 (Friday)\n12:00 PM",
    confidence: 0.72,
  },
  {
    id: "demo-3",
    channel: "#dev-channel",
    channelType: "slack",
    originalMessage:
      '"Someone needs to look at the latency issues on the staging environment. Maybe sometime this week?"',
    requester: "Max Lee",
    requesterInitials: "ML",
    requesterColor: "bg-teal-600",
    sentAgo: "Sent 1h ago",
    aiTitle: "Investigate Staging Latency",
    assignee: "Unclear – Manual assign required",
    deadline: "Aug 27 (Sunday)\n11:59 PM",
    confidence: 0.45,
  },
];

const ITEMS_PER_PAGE = 3;

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AIReviewPage() {
  const [tasks, setTasks] = useState<PendingTask[]>(DEMO_TASKS);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
  const paginated = tasks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const avgConfidence =
    tasks.length === 0
      ? 0
      : tasks.reduce((acc, t) => acc + t.confidence, 0) / tasks.length;

  const handleApprove = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await createTask({
        title: task.aiTitle,
        assignee: task.assignee,
        status: "pending",
      });
    } catch {
      // Proceed anyway for demo
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDiscard = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAnalyzed = (newTask: PendingTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <span>Intelligence</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-indigo-700 font-semibold">Extraction Review</span>
      </div>

      {/* Header Row */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            AI Review Queue
          </h1>
          <p className="text-slate-500 text-sm">
            Validate tasks extracted from your workspace conversations.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="flex gap-4 shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Avg. Confidence
              </p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {(avgConfidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Pending Items
              </p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Input Panel */}
      <InputPanel onAnalyzed={handleAnalyzed} />

      {/* Cards */}
      <div className="space-y-5">
        {paginated.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="font-medium">Queue is empty. Paste a message above to extract tasks.</p>
          </div>
        ) : (
          paginated.map((task) => (
            <ReviewCard
              key={task.id}
              task={task}
              onApprove={handleApprove}
              onDiscard={handleDiscard}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-500">
            Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, tasks.length)}–
            {Math.min(page * ITEMS_PER_PAGE, tasks.length)} of {tasks.length} pending extractions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "w-8 h-8 rounded-full text-sm font-semibold transition",
                  n === page
                    ? "bg-indigo-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
