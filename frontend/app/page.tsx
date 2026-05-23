"use client";

import { useState } from "react";
import { MetricsOverview } from "./components/MetricsOverview";
import { TaskRegistration } from "./components/TaskRegistration";
import { KanbanBoard } from "./components/KanbanBoard";
import { TaskList } from "./components/TaskList";
import { Task, TaskStatus } from "./types";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "./lib/utils";

// Mock initial data
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Update supply chain manifest for Q3",
    assignee: "Sarah Jenkins",
    deadline: "Today 5:00 PM",
    status: "in-progress",
    confidence: 98,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Vendor Risk Assessment: CloudFlare",
    assignee: "Marcus Thorne",
    deadline: "Tomorrow 12:00 PM",
    status: "pending",
    confidence: 92,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Review Security Protocols (Sec 4.2)",
    assignee: "Security Team",
    deadline: "Friday 12:00 PM",
    status: "done",
    confidence: 85,
    createdAt: new Date().toISOString(),
  }
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const handleRegisterTask = (newTask: Omit<Task, "id" | "createdAt" | "status">) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(7),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => 
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Derived metrics
  const activeTasksCount = tasks.filter(t => t.status !== "done").length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  
  // Simplified nearing/overdue logic for mock purposes
  const nearingDeadlinesCount = tasks.filter(t => t.deadline.toLowerCase().includes("today") && t.status !== "done").length;
  const overdueCount = tasks.filter(t => t.deadline.toLowerCase().includes("overdue") && t.status !== "done").length;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Global Orchestration</h1>
        <p className="text-slate-500">Real-time status of your AI-driven operational workflows.</p>
      </div>

      <MetricsOverview 
        activeTasks={activeTasksCount}
        completionRate={completionRate}
        nearingDeadlines={nearingDeadlinesCount}
        overdueTasks={overdueCount}
      />

      <TaskRegistration onRegisterTask={handleRegisterTask} />

      <div className="mt-12 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-500">Manage and track ongoing operations.</p>
        </div>
        
        <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === "kanban" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === "list" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
      ) : (
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
