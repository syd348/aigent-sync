"use client";

import { Task, TaskStatus } from "@/app/types";
import { User, Clock, CheckCircle2, Circle, ArrowRightCircle, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  "pending": { icon: Circle, color: "text-slate-400" },
  "in-progress": { icon: ArrowRightCircle, color: "text-blue-500" },
  "done": { icon: CheckCircle2, color: "text-emerald-500" },
  "review": { icon: Sparkles, color: "text-purple-500" },
};

export function TaskList({ tasks, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 font-medium shadow-sm">
        작업을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
            <th className="px-6 py-4">상태</th>
            <th className="px-6 py-4">작업 이름</th>
            <th className="px-6 py-4">담당자</th>
            <th className="px-6 py-4">마감일</th>
            <th className="px-6 py-4 text-right">신뢰도</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const StatusIcon = statusConfig[task.status].icon;
            return (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3 relative">
                    <StatusIcon className={cn("w-5 h-5", statusConfig[task.status].color)} />
                    <select 
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-8"
                    >
                      <option value="pending">대기 중</option>
                      <option value="in-progress">진행 중</option>
                      <option value="done">완료</option>
                      <option value="review">검토 중</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 text-sm">{task.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                    {task.assignee}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {task.deadline}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {task.confidence ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {task.confidence}%
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
