"use client";

import { useState, useEffect } from "react";
import { 
  Bot, 
  Loader2, 
  Sparkles, 
  X, 
  CheckCircle, 
  Calendar, 
  User, 
  AlertCircle, 
  MessageSquare,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { createTask } from "@/app/lib/api";
import { TaskPriority } from "@/app/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ExtractedData {
  title: string;
  assignee: string;
  deadline: string;
  confidence: number;
}

interface AiTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Confidence Gauge
// ─────────────────────────────────────────────
function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 85 ? "#4f46e5" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36" cy="36" r={radius}
          fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6"
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
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase -mt-1">
        신뢰도
      </span>
    </div>
  );
}

export function AiTaskModal({ isOpen, onClose }: AiTaskModalProps) {
  const [stage, setStage] = useState<"input" | "review" | "success">("input");
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  
  // Extracted details
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [confidence, setConfidence] = useState(70);
  const [priority, setPriority] = useState<TaskPriority>("Medium");

  // Keep body scroll locked when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset modal state on close or open
  useEffect(() => {
    if (isOpen) {
      setStage("input");
      setText("");
      setIsAnalyzing(false);
      setIsRegistering(false);
      setError("");
      setTitle("");
      setAssignee("");
      setDeadline("");
      setConfidence(70);
      setPriority("Medium");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze text");
      }

      const data = await response.json();
      
      // Load details into state
      setTitle(data.title || "제목 없는 작업");
      setAssignee(data.assignee && data.assignee !== "Unassigned" ? data.assignee : "");
      setDeadline(data.deadline && data.deadline !== "TBD" ? data.deadline : "");
      setConfidence(data.confidence ?? 75);
      setPriority("Medium"); // Default priority
      setStage("review");
    } catch (err: any) {
      console.error(err);
      setError("AI 분석에 실패했습니다. 다시 시도하거나 세부 사항을 명확히 적어주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegister = async () => {
    if (!title.trim()) {
      setError("작업 제목은 필수 항목입니다.");
      return;
    }
    setIsRegistering(true);
    setError("");

    try {
      await createTask({
        title,
        assignee: assignee.trim() || "Unassigned",
        deadline: deadline.trim() || "TBD",
        priority,
        status: "pending",
        source: "manual"
      });

      // Dispatch custom event to notify lists to refresh
      window.dispatchEvent(new CustomEvent("tasks-updated"));

      setStage("success");
      // Auto close after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError("데이터베이스에 작업을 생성하지 못했습니다.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative z-10 transform transition-colors duration-300 animate-in fade-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-900 dark:text-indigo-400 transition-colors">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 transition-colors">AI 작업 어시스턴트</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 transition-colors">자연어 처리를 통해 자동으로 작업 추출</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Stages */}
        <div className="p-6">
          {stage === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-900 dark:text-indigo-400" />
                  커뮤니케이션 내용 또는 요청 사항 붙여넣기
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="슬랙 메시지, 이메일 스레드, 회의록을 붙여넣거나 다음과 같이 간략하게 입력해보세요: 'Sadie는 2026-06-05까지 분기 보고서를 완료해야 함'"
                  className="w-full h-36 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 dark:focus:border-indigo-500 transition-colors duration-200"
                />
              </div>

              {error && (
               <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg text-xs font-semibold transition-colors">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !text.trim()}
                  className="flex items-center gap-2 bg-indigo-900 dark:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 dark:hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      텍스트 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 분석 시작
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="space-y-6">
              
              {/* AI Badge & Confidence */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded tracking-wider uppercase transition-colors">
                    AI 추천 추출 정보
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[360px] leading-relaxed transition-colors">
                    작업 목록에 추가하기 전에 AI가 분석한 세부 정보를 검토하고 확인하세요.
                  </p>
                </div>
                <ConfidenceGauge value={confidence} />
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">
                    작업 제목 / 설명
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 dark:focus:border-indigo-500 transition-colors"
                    placeholder="어떤 작업을 해야 하나요?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 transition-colors">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 담당자
                    </label>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 dark:focus:border-indigo-500 transition-colors"
                      placeholder="미배정"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 마감일 (YYYY-MM-DD)
                    </label>
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 dark:focus:border-indigo-500 transition-colors"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">
                    우선순위
                  </label>
                  <div className="flex gap-3">
                    {(["High", "Medium", "Low"] as TaskPriority[]).map((p) => {
                      const isActive = priority === p;
                      const activeClasses = {
                        High: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-100 dark:shadow-red-900/20",
                        Medium: "bg-yellow-400 text-white border-yellow-400 shadow-sm shadow-yellow-100 dark:shadow-yellow-900/20",
                        Low: "bg-green-500 text-white border-green-500 shadow-sm shadow-green-100 dark:shadow-green-900/20",
                      };
                      const inactiveClasses = {
                        High: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400",
                        Medium: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-800 hover:text-yellow-500 dark:hover:text-yellow-400",
                        Low: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-800 hover:text-green-500 dark:hover:text-green-400",
                      };

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 text-center",
                            isActive ? activeClasses[p] : inactiveClasses[p]
                          )}
                        >
                          {p === "High" ? "높음" : p === "Medium" ? "보통" : "낮음"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg text-xs font-semibold transition-colors">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-5 mt-4 transition-colors">
                <button
                  onClick={() => setStage("input")}
                  className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전으로
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStage("input")}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    삭제
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="flex items-center gap-2 bg-indigo-900 dark:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 dark:hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        작업 저장 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        승인 및 등록
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {stage === "success" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center border border-green-200 dark:border-green-500/30 animate-bounce transition-colors">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors">작업 동기화 완료!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">AI가 작업을 등록하고 데이터베이스 동기화를 마쳤습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
