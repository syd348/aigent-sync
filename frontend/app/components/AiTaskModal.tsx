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
      setTitle(data.title || "Untitled Task");
      setAssignee(data.assignee && data.assignee !== "Unassigned" ? data.assignee : "");
      setDeadline(data.deadline && data.deadline !== "TBD" ? data.deadline : "");
      setConfidence(data.confidence ?? 75);
      setPriority("Medium"); // Default priority
      setStage("review");
    } catch (err: any) {
      console.error(err);
      setError("AI analysis failed. Please try again or specify details clearly.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegister = async () => {
    if (!title.trim()) {
      setError("Task title is required.");
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
      setError("Failed to create task in the database.");
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
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-900">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Task Assistant</h2>
              <p className="text-[11px] text-slate-500">Auto-extract items using NLP</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Stages */}
        <div className="p-6">
          {stage === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-900" />
                  Paste Communication or Request
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste a Slack message, email thread, meeting transcript, or simply write a description like: 'Sadie needs to complete the quarterly report by 2026-06-05'"
                  className="w-full h-36 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 transition-all duration-200"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !text.trim()}
                  className="flex items-center gap-2 bg-indigo-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="space-y-6">
              
              {/* AI Badge & Confidence */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded tracking-wider uppercase">
                    AI Proposed Extract
                  </span>
                  <p className="text-xs text-slate-500 max-w-[360px] leading-relaxed">
                    Review and verify details extracted by the AI before adding to the task queue.
                  </p>
                </div>
                <ConfidenceGauge value={confidence} />
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Task Title / Description
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 transition-all"
                    placeholder="What needs to be done?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Assignee
                    </label>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 transition-all"
                      placeholder="Unassigned"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline (YYYY-MM-DD)
                    </label>
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-900 transition-all"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Priority Level
                  </label>
                  <div className="flex gap-3">
                    {(["High", "Medium", "Low"] as TaskPriority[]).map((p) => {
                      const isActive = priority === p;
                      const activeClasses = {
                        High: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-100",
                        Medium: "bg-yellow-400 text-white border-yellow-400 shadow-sm shadow-yellow-100",
                        Low: "bg-green-500 text-white border-green-500 shadow-sm shadow-green-100",
                      };
                      const inactiveClasses = {
                        High: "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-500",
                        Medium: "bg-white text-slate-600 border-slate-200 hover:border-yellow-300 hover:text-yellow-500",
                        Low: "bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-500",
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
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4">
                <button
                  onClick={() => setStage("input")}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Text
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStage("input")}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="flex items-center gap-2 bg-indigo-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-800 transition shadow-sm disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Task...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve & Register
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {stage === "success" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Task Sync Completed!</h3>
                <p className="text-sm text-slate-500 mt-1">AI registered task and successfully synced database.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
