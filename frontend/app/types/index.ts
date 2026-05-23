export type TaskStatus = "pending" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
  confidence?: number;
  source?: "slack" | "email" | "manual";
  createdAt: string;
}

export interface AnalysisResponse {
  title: string;
  assignee: string;
  deadline: string;
  confidence: number;
}
