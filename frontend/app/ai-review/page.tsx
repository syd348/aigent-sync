"use client";

import { AIReviewCard } from "../components/AIReviewCard";

export default function AIReviewPage() {
  const pendingTasks = [
    {
      id: "1",
      originalTitle: "Update supply chain manifest",
      originalInstruction: "Please update the Q3 supply chain manifest and ensure all vendor details are verified. It's crucial for the upcoming audit. Sarah needs to handle this by end of day today.",
      requester: "Operations Team",
      requesterAvatar: "O",
      aiSummaryTitle: "Update supply chain manifest for Q3",
      assignee: "Sarah Jenkins",
      deadline: "Today 5:00 PM",
      confidence: 98,
    },
    {
      id: "2",
      originalTitle: "Vendor Risk Assessment",
      originalInstruction: "Marcus, we need a complete risk assessment for CloudFlare by tomorrow noon. Make sure to cover sections 4.1 to 4.5 thoroughly.",
      requester: "Security Lead",
      requesterAvatar: "S",
      aiSummaryTitle: "Vendor Risk Assessment: CloudFlare",
      assignee: "Marcus Thorne",
      deadline: "Tomorrow 12:00 PM",
      confidence: 92,
    },
    {
      id: "3",
      originalTitle: "Security Protocols Review",
      originalInstruction: "Can someone from the security team review the new protocols for section 4.2? Need this done by Friday.",
      requester: "Compliance Office",
      requesterAvatar: "C",
      aiSummaryTitle: "Review Security Protocols (Sec 4.2)",
      assignee: "Security Team",
      deadline: "Friday 12:00 PM",
      confidence: 75,
    }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">AI Review</h1>
        <p className="text-slate-500">Review, edit, and approve tasks automatically extracted by AI from unstructured inputs.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">Pending AI Task Processing</h2>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{pendingTasks.length}</span>
        </div>
        <div className="flex gap-2">
          <button className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-indigo-50">Approve All</button>
        </div>
      </div>

      <div className="space-y-6">
        {pendingTasks.map((task) => (
          <AIReviewCard
            key={task.id}
            originalTitle={task.originalTitle}
            originalInstruction={task.originalInstruction}
            requester={task.requester}
            requesterAvatar={task.requesterAvatar}
            aiSummaryTitle={task.aiSummaryTitle}
            assignee={task.assignee}
            deadline={task.deadline}
            confidence={task.confidence}
          />
        ))}
      </div>
    </div>
  );
}
