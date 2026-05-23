"use client";

import { useState } from "react";
import { AIReviewCard } from "../components/AIReviewCard";
import { MessageSquare, Bot, Loader2 } from "lucide-react";
import { createTask } from "../lib/api";
import { AnalysisResponse } from "../types";

export default function AIReviewPage() {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Start with empty pending queue
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error("Failed to analyze text");

      const data: AnalysisResponse = await response.json();
      
      const newTask = {
        id: Math.random().toString(36).substring(7), // temporary id for the queue
        originalTitle: "Unstructured Request",
        originalInstruction: inputText,
        requester: "System User", // or could be extracted
        requesterAvatar: "U",
        aiSummaryTitle: data.title,
        assignee: data.assignee,
        deadline: data.deadline,
        confidence: data.confidence,
      };

      setPendingTasks(prev => [newTask, ...prev]);
      setInputText(""); // clear input
    } catch (err) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async (id: string, finalData: any) => {
    try {
      await createTask({
        title: finalData.title,
        assignee: finalData.assignee,
        deadline: finalData.deadline,
        status: "pending",
      });
      // Remove from pending queue on success
      setPendingTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to approve task", error);
      alert("Failed to sync task. Please check server.");
    }
  };

  const handleDiscard = (id: string) => {
    setPendingTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleApproveAll = async () => {
    for (const task of pendingTasks) {
      await handleApprove(task.id, {
        title: task.aiSummaryTitle,
        assignee: task.assignee,
        deadline: task.deadline,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">AI Review</h1>
        <p className="text-slate-500">Review, edit, and approve tasks automatically extracted by AI from unstructured inputs.</p>
      </div>

      {/* Input Area for new unstructured text */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          New Communication
        </h2>
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste Slack message, email, or meeting notes here..."
            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700"
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
                Extracting...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">Pending AI Task Processing</h2>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{pendingTasks.length}</span>
        </div>
        {pendingTasks.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleApproveAll}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-indigo-50"
            >
              Approve All
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {pendingTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            No pending tasks. Paste a message above to extract tasks!
          </div>
        ) : (
          pendingTasks.map((task) => (
            <AIReviewCard
              key={task.id}
              id={task.id}
              originalTitle={task.originalTitle}
              originalInstruction={task.originalInstruction}
              requester={task.requester}
              requesterAvatar={task.requesterAvatar}
              aiSummaryTitle={task.aiSummaryTitle}
              assignee={task.assignee}
              deadline={task.deadline}
              confidence={task.confidence}
              onApprove={handleApprove}
              onDiscard={handleDiscard}
            />
          ))
        )}
      </div>
    </div>
  );
}
