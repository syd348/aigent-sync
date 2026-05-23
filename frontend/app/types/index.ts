export type TaskStatus = "review" | "pending" | "in-progress" | "done";
export type TaskPriority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
  priority?: TaskPriority;
  confidence?: number;
  source?: "slack" | "email" | "manual";
  createdAt: string;
}

export interface SlackConnectionStatus {
  connected: boolean;
  oauth_configured: boolean;
  bot_token_configured: boolean;
  connection_type?: "oauth" | "bot_token" | null;
  team_id?: string | null;
  team_name?: string | null;
  oauth_login_url?: string | null;
}

export interface AnalysisResponse {
  title: string;
  assignee: string;
  deadline: string;
  confidence: number;
}
