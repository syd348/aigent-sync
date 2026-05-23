"use client";

import { useState, useEffect } from "react";
import { MetricsOverview } from "./components/MetricsOverview";
import { TaskRegistration } from "./components/TaskRegistration";
import { KanbanBoard } from "./components/KanbanBoard";
import { TaskList } from "./components/TaskList";
import { Task, TaskStatus } from "./types";
import { LayoutGrid, List, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "./lib/utils";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks from backend");
      const data = await res.json();
      
      const mappedTasks: Task[] = data.map((t: any) => ({
        id: String(t.task_id),
        title: t.description,
        assignee: t.assignee || "Unassigned",
        deadline: t.deadline || "TBD",
        status: t.status === "To-do" ? "pending" : (t.status === "In Progress" ? "in-progress" : "done"),
        confidence: t.confidence_score ? Math.round(t.confidence_score * 100) : 100,
        source: "slack",
        createdAt: new Date().toISOString()
      }));
      setTasks(mappedTasks);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Cannot connect to Backend API. Please check if the server is running on " + BACKEND_URL);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRegisterTask = async (newTask: Omit<Task, "id" | "createdAt" | "status">) => {
    try {
      setError("");
      // Format deadline to YYYY-MM-DD or null
      let formattedDeadline = null;
      if (newTask.deadline && newTask.deadline !== "TBD") {
        // Basic date parse check or keep it as string if backend parses it
        // Our backend expects YYYY-MM-DD
        const dateMatch = newTask.deadline.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          formattedDeadline = dateMatch[0];
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignee: newTask.assignee === "Unassigned" ? null : newTask.assignee,
          deadline: formattedDeadline,
          description: newTask.title,
          priority: "Medium",
          status: "To-do"
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to register task: ${errorText}`);
      }
      
      // Reload task list from backend
      await fetchTasks();
    } catch (err: any) {
      console.error(err);
      setError("Failed to register task. Details: " + err.message);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setError("");
      const backendStatus = newStatus === "pending" ? "To-do" : (newStatus === "in-progress" ? "In Progress" : "Done");
      
      const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: backendStatus
        })
      });
      
      if (!res.ok) throw new Error("Failed to update status on backend");
      
      // Optimistically update the UI status
      setTasks((prev) => 
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      console.error(err);
      setError("Failed to update task status on backend.");
      // Rollback to database state
      fetchTasks();
    }
  };

  // Derived metrics
  const activeTasksCount = tasks.filter(t => t.status !== "done").length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  
  // Simplified nearing/overdue logic
  const nearingDeadlinesCount = tasks.filter(t => t.deadline.toLowerCase().includes("today") && t.status !== "done").length;
  const overdueCount = tasks.filter(t => t.deadline.toLowerCase().includes("overdue") && t.status !== "done").length;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Global Orchestration</h1>
          <p className="text-slate-500">Real-time status of your AI-driven operational workflows.</p>
        </div>
        <button 
          onClick={fetchTasks} 
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-all font-medium"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Backend Connection Issue</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

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

      {isLoading && tasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading tasks from database...</p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
      ) : (
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}

