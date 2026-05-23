"use client";

import { useState } from "react";
import { Bot, User, Calendar, Check, X, Edit2, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { AnalysisResponse, Task } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface TaskRegistrationProps {
  onRegisterTask: (task: Omit<Task, "id" | "createdAt" | "status">) => void;
}

export function TaskRegistration({ onRegisterTask }: TaskRegistrationProps) {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalysisResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setError("");
    setExtractedData(null);
    setIsEditing(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error("Failed to analyze text");

      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError("분석에 실패했습니다. 다시 시도하거나 수동으로 입력해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = () => {
    if (!extractedData) return;
    onRegisterTask({
      title: extractedData.title,
      assignee: extractedData.assignee,
      deadline: extractedData.deadline,
      confidence: extractedData.confidence,
      source: "slack", // defaulting to slack for demo
    });
    
    // Reset form
    setInputText("");
    setExtractedData(null);
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setExtractedData(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden transition-colors">
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4 px-6 flex items-center gap-3 transition-colors">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors">AI 작업 등록</h2>
        <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded-full ml-auto transition-colors">
          슬랙 / 이메일
        </span>
      </div>
      
      <div className="p-6">
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 w-5 h-5 transition-colors" />
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="여기에 슬랙 메시지 또는 이메일 내용을 붙여넣으세요..."
            className="w-full h-32 pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 dark:text-slate-300 transition-colors"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="flex items-center gap-2 bg-indigo-900 dark:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                AI 분석 요청
              </>
            )}
          </button>
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3 transition-colors">{error}</p>}

        {extractedData && (
          <div className="mt-8 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">AI 추천 추출 정보</span>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-700 transition-colors"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={cn("stroke-current transition-colors", extractedData.confidence >= 90 ? "text-indigo-600 dark:text-indigo-500" : "text-orange-500 dark:text-orange-400")}
                      strokeWidth="3"
                      strokeDasharray={`${extractedData.confidence}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors">{extractedData.confidence}%</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors">신뢰도</span>
              </div>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 transition-colors">작업 제목</label>
                    <input 
                      type="text" 
                      value={extractedData.title}
                      onChange={(e) => setExtractedData({...extractedData, title: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 transition-colors">담당자</label>
                      <input 
                        type="text" 
                        value={extractedData.assignee}
                        onChange={(e) => setExtractedData({...extractedData, assignee: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 transition-colors">마감일</label>
                      <input 
                        type="text" 
                        value={extractedData.deadline}
                        onChange={(e) => setExtractedData({...extractedData, deadline: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 transition-colors">{extractedData.title}</h3>
                  <div className="flex items-center gap-12">
                    <div>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1 uppercase transition-colors">담당자</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">{extractedData.assignee}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1 uppercase transition-colors">마감일</span>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors" />
                        <span className="text-sm font-medium">{extractedData.deadline}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
              <button 
                onClick={handleDiscard}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" /> 삭제
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" /> {isEditing ? "수정 완료" : "세부 정보 수정"}
                </button>
                <button 
                  onClick={handleApprove}
                  className="flex items-center gap-2 bg-indigo-900 dark:bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Check className="w-4 h-4" /> 승인 및 등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
