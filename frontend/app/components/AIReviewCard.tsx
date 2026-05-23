"use client";

import { useState } from "react";
import { Sparkles, Clock, User, Check, X, Edit2, AlertCircle } from "lucide-react";

export interface AIReviewCardProps {
  id?: string;
  originalTitle: string;
  originalInstruction: string;
  requester: string;
  requesterAvatar?: string;
  
  aiSummaryTitle: string;
  assignee: string;
  deadline: string;
  confidence: number;

  onApprove?: (id: string, finalData: any) => void;
  onDiscard?: (id: string) => void;
}

export function AIReviewCard({
  id = "",
  originalTitle,
  originalInstruction,
  requester,
  requesterAvatar = "U",
  aiSummaryTitle,
  assignee,
  deadline,
  confidence,
  onApprove,
  onDiscard,
}: AIReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(aiSummaryTitle);
  const [editedAssignee, setEditedAssignee] = useState(assignee);
  const [editedDeadline, setEditedDeadline] = useState(deadline);

  const handleApprove = () => {
    if (onApprove) {
      onApprove(id, {
        title: editedTitle,
        assignee: editedAssignee,
        deadline: editedDeadline,
        confidence,
      });
    }
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard(id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row">
        {/* Left Side: Original Request */}
        <div className="flex-1 p-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded-md">원본 요청</span>
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
              <p className="text-xs text-slate-500">요청자</p>
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
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">AI 분석 작업</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">신뢰도</span>
              <div className={`flex items-center gap-1 text-sm font-bold ${confidence >= 90 ? 'text-emerald-600' : confidence >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
                {confidence}%
              </div>
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">작업 제목</label>
                <input 
                  type="text" 
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">담당자</label>
                  <input 
                    type="text" 
                    value={editedAssignee}
                    onChange={(e) => setEditedAssignee(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">마감일</label>
                  <input 
                    type="text" 
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-900 mb-6 leading-tight">{editedTitle}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">담당자</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{editedAssignee}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">마감일</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{editedDeadline}</p>
                </div>
              </div>
            </>
          )}
          
          {confidence < 80 && !isEditing && (
            <div className="mt-4 flex items-start gap-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">분석 신뢰도가 낮습니다. 추출된 담당자와 마감일을 주의 깊게 검토해 주세요.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Footer */}
      <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 items-center">
        <button 
          onClick={handleDiscard}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <X className="w-4 h-4" /> 삭제
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit2 className="w-4 h-4" /> {isEditing ? "수정 완료" : "수정"}
        </button>
        <button 
          onClick={handleApprove}
          className="flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Check className="w-4 h-4" /> 승인 및 동기화
        </button>
      </div>
    </div>
  );
}
