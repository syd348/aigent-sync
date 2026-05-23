"use client";

import { Task, TaskStatus } from "@/app/types";
import { Clock, User } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "pending", label: "대기 중", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "in-progress", label: "진행 중", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "done", label: "완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        
        return (
          <div key={column.id} className="flex-1 min-w-[320px] bg-slate-50/50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", column.color)}>
                  {column.label}
                </span>
                <span className="text-slate-400 text-sm font-medium">{columnTasks.length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                    {task.confidence && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        AI {task.confidence}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                      {task.assignee}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock className="w-3 h-3" />
                      {task.deadline}
                    </div>
                    
                    <select 
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <option value="pending">대기 중</option>
                      <option value="in-progress">진행 중</option>
                      <option value="done">완료</option>
                    </select>
                  </div>
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-lg">
                  여기에 작업이 없습니다.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
