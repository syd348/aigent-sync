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
      setError("Analysis failed. Please try again or enter manually.");
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">AI Task Registration</h2>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full ml-auto">
          Slack / Email
        </span>
      </div>
      
      <div className="p-6">
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste Slack or Email message here..."
            className="w-full h-32 pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="flex items-center gap-2 bg-indigo-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                AI Analysis Request
              </>
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        {extractedData && (
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Proposed Extract</span>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={cn("stroke-current", extractedData.confidence >= 90 ? "text-indigo-600" : "text-orange-500")}
                      strokeWidth="3"
                      strokeDasharray={`${extractedData.confidence}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold">{extractedData.confidence}%</span>
                </div>
                <span className="text-xs text-slate-500">Confidence</span>
              </div>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Task Title</label>
                    <input 
                      type="text" 
                      value={extractedData.title}
                      onChange={(e) => setExtractedData({...extractedData, title: e.target.value})}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                      <input 
                        type="text" 
                        value={extractedData.assignee}
                        onChange={(e) => setExtractedData({...extractedData, assignee: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Deadline</label>
                      <input 
                        type="text" 
                        value={extractedData.deadline}
                        onChange={(e) => setExtractedData({...extractedData, deadline: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">{extractedData.title}</h3>
                  <div className="flex items-center gap-12">
                    <div>
                      <span className="text-xs font-medium text-slate-400 block mb-1 uppercase">Assignee</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{extractedData.assignee}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400 block mb-1 uppercase">Deadline</span>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">{extractedData.deadline}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button 
                onClick={handleDiscard}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" /> Discard
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" /> {isEditing ? "Done Editing" : "Edit Details"}
                </button>
                <button 
                  onClick={handleApprove}
                  className="flex items-center gap-2 bg-indigo-900 text-white px-6 py-2 rounded-lg hover:bg-indigo-800 transition-colors text-sm font-medium shadow-sm"
                >
                  <Check className="w-4 h-4" /> Approve & Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
