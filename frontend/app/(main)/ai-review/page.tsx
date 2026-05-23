"use client";

import { useState, useEffect, useRef } from "react";
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
import { createTask, fetchTasks, updateTask, deleteTask } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";

const POLL_INTERVAL_MS = 30_000;

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
        신뢰도
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
        {type === "slack" ? "슬랙 메시지" : "이메일 스레드"}
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
  const badgeLabel = isLowConfidence ? "신뢰도 낮음" : "AI 분석 완료";
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">담당자</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isLowConfidence ? "text-slate-400 italic" : "text-slate-800"
                  )}
                >
                  {task.assignee}
                </p>
                {isLowConfidence && (
                  <p className="text-[10px] text-slate-400">수동 배정 필요</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">마감일</p>
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
            삭제
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            {isLowConfidence ? "세부 정보 수정" : "수정"}
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
                수정 후 승인
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                승인 및 동기화
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
        sentAgo: "방금 전",
        aiTitle: data.description || "Untitled Task",
        assignee: data.assignee || "불확실 – 수동 배정 필요",
        deadline: data.deadline
          ? new Date(data.deadline).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              weekday: "long",
            }) + " · 오후 5:00"
          : "지정되지 않음",
        confidence: data.confidence_score ?? 0.7,
      };
      onAnalyzed(newTask);
      setText("");
    } catch {
      alert("분석에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        작업을 추출할 새로운 커뮤니케이션 내용 붙여넣기
      </h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="여기에 슬랙 메시지, 이메일, 회의록을 붙여넣으세요..."
        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handle}
          disabled={isAnalyzing || !text.trim()}
          className="flex items-center gap-2 bg-indigo-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 추출 중...</>
          ) : (
            <><Bot className="w-4 h-4" /> AI 분석 시작</>
          )}
        </button>
      </div>
    </div>
  );
}



const ITEMS_PER_PAGE = 3;

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AIReviewPage() {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [page, setPage] = useState(1);
  const [newSlackCount, setNewSlackCount] = useState(0);
  const seenTaskIdsRef = useRef<Set<string>>(new Set());

  // ── Poll backend DB every 30s for newly saved pending tasks (from Slack)
  useEffect(() => {
    const pollNewTasks = async () => {
      try {
        const dbTasks = await fetchTasks("review");
        const incoming: PendingTask[] = [];

        for (const t of dbTasks) {
          if (seenTaskIdsRef.current.has(t.id)) continue;
          seenTaskIdsRef.current.add(t.id);

          incoming.push({
            id: t.id,
            channel: t.source === "slack" ? "#slack" : "#manual",
            channelType: t.source === "slack" ? "slack" : "email",
            originalMessage: t.title,
            requester: t.assignee || "Unknown",
            requesterInitials: (t.assignee || "?").slice(0, 2).toUpperCase(),
            requesterColor: "bg-purple-500",
            sentAgo: "방금 전",
            aiTitle: t.title,
            assignee: t.assignee || "미배정",
            deadline: t.deadline || "지정되지 않음",
            confidence: t.confidence ?? 0.75,
          });
        }

        if (incoming.length > 0) {
          setTasks((prev) => [...incoming, ...prev]);
          setNewSlackCount((c) => c + incoming.length);
          setPage(1);
        }
      } catch {
        // silent — polling should never crash the UI
      }
    };

    pollNewTasks(); // run once on mount
    const id = setInterval(pollNewTasks, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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
      await updateTask(id, {
        status: "pending",
      });
    } catch {
      // Proceed anyway for demo
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDiscard = async (id: string) => {
    try {
      await deleteTask(id);
    } catch {
      // Proceed anyway
    }
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
        <span>인텔리전스</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-indigo-700 font-semibold">추출 정보 검토</span>
      </div>

      {/* Header Row */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              AI 검토 대기열
            </h1>
            {newSlackCount > 0 && (
              <button
                onClick={() => setNewSlackCount(0)}
                className="flex items-center gap-1.5 bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-in zoom-in-75 duration-300 hover:bg-purple-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                +{newSlackCount}개 슬랙 연동 항목
              </button>
            )}
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            워크스페이스 대화에서 추출된 작업을 검토하고 승인하세요.
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              실시간
            </span>
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
                평균 신뢰도
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
                대기 중인 항목
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
            <p className="font-medium">검토 대기열이 비어 있습니다. 위에 메시지를 붙여넣어 작업을 추출해 보세요.</p>
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
            대기 중인 추출 항목 {tasks.length}개 중 {Math.min((page - 1) * ITEMS_PER_PAGE + 1, tasks.length)}–
            {Math.min(page * ITEMS_PER_PAGE, tasks.length)} 표시 중
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
