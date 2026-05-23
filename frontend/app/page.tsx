"use client";

import { useState, useEffect } from "react";
import { MetricsOverview } from "./components/MetricsOverview";
import { TaskRegistration } from "./components/TaskRegistration";
import { KanbanBoard } from "./components/KanbanBoard";
import { TaskList } from "./components/TaskList";
import { Task, TaskStatus } from "./types";
import { fetchTasks, createTask, updateTask } from "./lib/api";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "./lib/utils";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const fetchedTasks = await fetchTasks();
      // Sort so newest are likely first, or rely on backend
      setTasks(fetchedTasks.reverse());
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterTask = async (newTask: Omit<Task, "id" | "createdAt" | "status">) => {
    try {
      // Create via API
      const created = await createTask({
        title: newTask.title,
        assignee: newTask.assignee,
        deadline: newTask.deadline,
        status: "pending",
      });
      // Add to state
      setTasks((prev) => [created, ...prev]);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task.");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) => 
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert on failure
      loadTasks();
    }
  };

  // Derived metrics
  const activeTasksCount = tasks.filter(t => t.status !== "done").length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  
  // Real deadline logic parsing
  const nearingDeadlinesCount = tasks.filter(t => {
    if (t.status === "done") return false;
    if (!t.deadline || t.deadline === "TBD") return false;
    // Just a rough heuristic for demo (e.g. today, tomorrow, or a date close to now)
    const lowerDeadline = t.deadline.toLowerCase();
    return lowerDeadline.includes("today") || lowerDeadline.includes("tomorrow") || lowerDeadline.includes("urgent");
  }).length;
  
  const overdueCount = tasks.filter(t => t.status !== "done" && t.deadline?.toLowerCase().includes("overdue")).length;

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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        viewMode === "kanban" ? (
          <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
        ) : (
          <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
        )
      )}
    </div>
  );
}
