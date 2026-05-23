"use client";

import { Users, MoreHorizontal } from "lucide-react";
import { Task } from "@/app/types";

interface LoadBalancingCardProps {
  tasks: Task[];
}

// Predefined visuals for common users, fallback for others
const userVisuals: Record<string, { role: string, avatar: string, color: string, barColor: string }> = {
  "Sarah Jenkins": { role: "Product Manager", avatar: "SJ", color: "bg-blue-100 text-blue-700", barColor: "bg-blue-500" },
  "Marcus Thorne": { role: "Developer", avatar: "MT", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" },
  "Alex Chen": { role: "Designer", avatar: "AC", color: "bg-purple-100 text-purple-700", barColor: "bg-purple-500" },
  "Emily Watson": { role: "QA Engineer", avatar: "EW", color: "bg-orange-100 text-orange-700", barColor: "bg-orange-500" },
  "Security Team": { role: "Security", avatar: "ST", color: "bg-red-100 text-red-700", barColor: "bg-red-500" },
  "Sarah Miller": { role: "Operations", avatar: "SM", color: "bg-blue-100 text-blue-700", barColor: "bg-blue-500" },
  "Alex Martinez": { role: "Developer", avatar: "AM", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" },
  "David Wu": { role: "Engineer", avatar: "DW", color: "bg-purple-100 text-purple-700", barColor: "bg-purple-500" },
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
}

export function LoadBalancingCard({ tasks }: LoadBalancingCardProps) {
  // Aggregate tasks by assignee
  const assigneeStats = tasks.reduce((acc, task) => {
    if (task.status === "done") return acc; // Only count active tasks for load balancing
    
    const name = task.assignee || "Unassigned";
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name]++;
    return acc;
  }, {} as Record<string, number>);

  // Build array for rendering
  const teamMembers = Object.entries(assigneeStats)
    .sort((a, b) => b[1] - a[1]) // sort by load
    .map(([name, count]) => {
      const visuals = userVisuals[name] || {
        role: "Team Member",
        avatar: getInitials(name) || "?",
        color: "bg-slate-100 text-slate-700",
        barColor: "bg-slate-500"
      };

      // Mock a total capacity of 10 tasks max per person
      const totalCapacity = 10;
      
      return {
        name,
        role: visuals.role,
        tasks: count,
        total: totalCapacity,
        avatar: visuals.avatar,
        color: visuals.color,
        barColor: visuals.barColor
      };
    });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Team Load Balancing</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6">Real-time active task distribution among team members.</p>
      
      <div className="space-y-6 flex-1">
        {teamMembers.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">No active tasks assigned to anyone.</div>
        ) : (
          teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.color}`}>
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">{member.tasks}</span>
                  <span className="text-sm text-slate-500"> / {member.total} cap</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div 
                  className={`h-2.5 rounded-full ${member.barColor} transition-all duration-1000 ease-in-out`}
                  style={{ width: `${Math.min((member.tasks / member.total) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
