"use client";

import { Sparkles, Clock, User, Check, X, Edit2, AlertCircle } from "lucide-react";

interface AIReviewCardProps {
  originalTitle: string;
  originalInstruction: string;
  requester: string;
  requesterAvatar?: string;
  
  aiSummaryTitle: string;
  assignee: string;
  deadline: string;
  confidence: number;
}

export function AIReviewCard({
  originalTitle,
  originalInstruction,
  requester,
  requesterAvatar = "U",
  aiSummaryTitle,
  assignee,
  deadline,
  confidence,
}: AIReviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row">
        {/* Left Side: Original Request */}
        <div className="flex-1 p-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded-md">Original Request</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{originalTitle}</h3>
          <p className="text-sm text-slate-600 mb-6 bg-white p-4 border border-slate-200 rounded-lg whitespace-pre-wrap leading-relaxed shadow-inner">
            {originalInstruction}
          </p>
          
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {requesterAvatar}
            </div>
            <div>
              <p className="text-xs text-slate-500">Requested by</p>
              <p className="text-sm font-medium text-slate-900">{requester}</p>
            </div>
          </div>
        </div>

        {/* Right Side: AI Processed */}
        <div className="flex-1 p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">AI Extracted Task</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Confidence</span>
              <div className={`flex items-center gap-1 text-sm font-bold ${confidence >= 90 ? 'text-emerald-600' : confidence >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
                {confidence}%
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-6 leading-tight">{aiSummaryTitle}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Assignee</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{assignee}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Deadline</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{deadline}</p>
            </div>
          </div>
          
          {confidence < 80 && (
            <div className="mt-4 flex items-start gap-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">Confidence is low. Please review the extracted assignee and deadline carefully.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Footer */}
      <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 items-center">
        <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors">
          <X className="w-4 h-4" /> Discard
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm">
          <Edit2 className="w-4 h-4" /> Edit
        </button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
          <Check className="w-4 h-4" /> Approve & Sync
        </button>
      </div>
    </div>
  );
}
