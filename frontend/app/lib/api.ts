import { Task, TaskStatus } from "../types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Helper to map backend status to frontend status
function mapStatusToFrontend(backendStatus: string): TaskStatus {
  switch (backendStatus) {
    case "To-do": return "pending";
    case "In Progress": return "in-progress";
    case "Done": return "done";
    default: return "pending";
  }
}

// Helper to map frontend status to backend status
function mapStatusToBackend(frontendStatus: TaskStatus): string {
  switch (frontendStatus) {
    case "pending": return "To-do";
    case "in-progress": return "In Progress";
    case "done": return "Done";
    default: return "To-do";
  }
}

// Map backend TaskResponse to frontend Task
function mapTaskToFrontend(backendTask: any): Task {
  return {
    id: backendTask.task_id.toString(),
    title: backendTask.description,
    assignee: backendTask.assignee || "Unassigned",
    deadline: backendTask.deadline || "TBD",
    status: mapStatusToFrontend(backendTask.status),
    priority: backendTask.priority || "Medium",
    confidence: undefined, // confidence is not stored in DB
    createdAt: new Date().toISOString(), // Mocking createdAt
  };
}

export async function fetchTasks(statusFilter?: string, assigneeFilter?: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.append("status_filter", mapStatusToBackend(statusFilter as TaskStatus));
  if (assigneeFilter) params.append("assignee_filter", assigneeFilter);

  const url = `${BACKEND_URL}/api/tasks` + (params.toString() ? `?${params.toString()}` : "");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data.map(mapTaskToFrontend);
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const payload: any = {
    assignee: task.assignee,
    description: task.title,
    priority: task.priority || "Medium",
    status: mapStatusToBackend(task.status || "pending"),
    deadline: null,
  };

  // Backend expects YYYY-MM-DD for dates.
  if (task.deadline && task.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
    payload.deadline = task.deadline;
  }

  const res = await fetch(`${BACKEND_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create task: ${errText}`);
  }
  const data = await res.json();
  return mapTaskToFrontend(data);
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const payload: any = {};
  if (updates.title !== undefined) payload.description = updates.title;
  if (updates.assignee !== undefined) payload.assignee = updates.assignee;
  if (updates.status !== undefined) payload.status = mapStatusToBackend(updates.status);
  if (updates.deadline !== undefined) {
    if (updates.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
      payload.deadline = updates.deadline;
    } else {
      payload.deadline = null;
    }
  }

  const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update task: ${errText}`);
  }
  const data = await res.json();
  return mapTaskToFrontend(data);
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return true;
}
