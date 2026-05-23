"use client";

import { useState, useEffect } from "react";
import { MetricsOverview } from "../components/MetricsOverview";
import { LoadBalancingCard } from "../components/LoadBalancingCard";
import { IntelligenceFeedCard } from "../components/IntelligenceFeedCard";
import { fetchTasks } from "../lib/api";
import { Task } from "../types";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedTasks = await fetchTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to load tasks for dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute metrics dynamically
  const activeTasks = tasks.filter(t => t.status !== "done").length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  
  const nearingDeadlines = tasks.filter(t => {
    if (t.status === "done" || !t.deadline) return false;
    const ld = t.deadline.toLowerCase();
    return ld.includes("today") || ld.includes("tomorrow") || ld.includes("urgent");
  }).length;
  
  const overdueTasks = tasks.filter(t => t.status !== "done" && t.deadline?.toLowerCase().includes("overdue")).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-500">Real-time overview of your team's performance and AI insights.</p>
      </div>

      <MetricsOverview 
        activeTasks={activeTasks}
        completionRate={completionRate}
        nearingDeadlines={nearingDeadlines}
        overdueTasks={overdueTasks}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <LoadBalancingCard tasks={tasks} />
        <IntelligenceFeedCard />
      </div>
    </div>
  );
}
