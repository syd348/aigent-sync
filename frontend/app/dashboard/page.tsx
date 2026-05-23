"use client";

import { MetricsOverview } from "../components/MetricsOverview";
import { LoadBalancingCard } from "../components/LoadBalancingCard";
import { IntelligenceFeedCard } from "../components/IntelligenceFeedCard";

export default function DashboardPage() {
  // Mock data for metrics
  const activeTasks = 42;
  const completionRate = 78;
  const nearingDeadlines = 5;
  const overdueTasks = 2;

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
        <LoadBalancingCard />
        <IntelligenceFeedCard />
      </div>
    </div>
  );
}
