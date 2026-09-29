/**
 * DO core domain primitives.
 *
 * This layer is UI- and provider-agnostic. It models the outcome-oriented
 * contract that sits above OpenHands execution.
 */

export type GoalStatus = "pending" | "planning" | "running" | "waiting" | "completed" | "failed";
export type AutonomyLevel = "ask" | "suggest" | "prepare" | "execute" | "autopilot";
export type RiskLevel = "low" | "medium" | "high";

export interface Goal {
  id: string;
  title: string;
  instruction: string;
  status: GoalStatus;
  autonomy: AutonomyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  risk: RiskLevel;
  requiresApproval: boolean;
  status: "pending" | "running" | "completed" | "blocked" | "failed";
}

export interface DoPlan {
  goalId: string;
  steps: PlanStep[];
}

export interface ApprovalRequest {
  id: string;
  goalId: string;
  stepId: string;
  reason: string;
  risk: RiskLevel;
  createdAt: string;
}

export interface DoRun {
  id: string;
  goalId: string;
  status: "queued" | "running" | "waiting_for_approval" | "completed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  completedSteps: number;
  totalSteps: number;
}

export interface DoResult {
  goalId: string;
  summary: string;
  completedActions: string[];
  pendingActions: string[];
  approvalsRequested: ApprovalRequest[];
  estimatedTimeSavedMinutes?: number;
}

export function createGoal(input: {
  title?: string;
  instruction: string;
  autonomy?: AutonomyLevel;
  now?: string;
}): Goal {
  const now = input.now ?? new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: input.title ?? input.instruction,
    instruction: input.instruction,
    status: "pending",
    autonomy: input.autonomy ?? "ask",
    createdAt: now,
    updatedAt: now,
  };
}
