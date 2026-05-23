"use client";

import { useState, useEffect } from "react";
import { MetricsOverview } from "@/app/components/MetricsOverview";
import { LoadBalancingCard } from "@/app/components/LoadBalancingCard";
import { IntelligenceFeedCard } from "@/app/components/IntelligenceFeedCard";
import { fetchTasks } from "@/app/lib/api";
import { Task } from "@/app/types";
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nearingDeadlines = 0;
  let overdueTasks = 0;

  tasks.forEach(t => {
    if (t.status === "done" || !t.deadline || t.deadline === "TBD") return;
    
    // Fallback for mock strings
    const lowerDeadline = t.deadline.toLowerCase();
    if (lowerDeadline.includes("today") || lowerDeadline.includes("tomorrow") || lowerDeadline.includes("urgent")) {
      nearingDeadlines++;
      return;
    }
    if (lowerDeadline.includes("overdue")) {
      overdueTasks++;
      return;
    }

    // YYYY-MM-DD parsing
    const parts = t.deadline.split('-');
    if (parts.length === 3) {
      const taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const diffDays = (taskDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
      
      if (diffDays < 0) {
        overdueTasks++;
      } else if (diffDays >= 0 && diffDays <= 2) {
        nearingDeadlines++;
      }
    }
  });

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
