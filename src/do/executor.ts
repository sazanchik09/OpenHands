import type { DoPlan, DoRun, Goal, PlanStep } from "./core";

export interface OpenHandsTask {
  goalId: string;
  instruction: string;
  stepId: string;
  stepTitle: string;
  stepDescription: string;
}

export interface OpenHandsExecutionResult {
  status: "queued" | "completed" | "failed";
  message: string;
  externalRunId?: string;
}

export interface OpenHandsExecutor {
  execute(task: OpenHandsTask): Promise<OpenHandsExecutionResult>;
}

export interface PlanDispatch {
  run: DoRun;
  tasks: OpenHandsTask[];
  blockedSteps: PlanStep[];
}

/**
 * Builds the execution boundary between DO and OpenHands.
 *
 * DO owns goals, plans and approval policy. OpenHands only receives concrete
 * execution tasks. No OpenHands SDK/API details leak into the DO domain.
 */
export function dispatchPlan(
  goal: Goal,
  plan: DoPlan,
  executor: OpenHandsExecutor,
  now = new Date().toISOString(),
): { dispatch: PlanDispatch; execute: () => Promise<OpenHandsExecutionResult[]> } {
  const executableSteps = plan.steps.filter((item) => !item.requiresApproval);
  const blockedSteps = plan.steps.filter((item) => item.requiresApproval);

  const run: DoRun = {
    id: crypto.randomUUID(),
    goalId: goal.id,
    status: executableSteps.length === 0 ? "waiting_for_approval" : "queued",
    startedAt: now,
    completedSteps: 0,
    totalSteps: plan.steps.length,
  };

  const tasks = executableSteps.map((item) => toOpenHandsTask(goal, item));

  return {
    dispatch: { run, tasks, blockedSteps },
    execute: async () => {
      if (tasks.length === 0) return [];

      const results: OpenHandsExecutionResult[] = [];
      for (const task of tasks) {
        results.push(await executor.execute(task));
      }
      return results;
    },
  };
}

export function toOpenHandsTask(goal: Goal, step: PlanStep): OpenHandsTask {
  return {
    goalId: goal.id,
    instruction: goal.instruction,
    stepId: step.id,
    stepTitle: step.title,
    stepDescription: step.description,
  };
}

/**
 * Minimal transport adapter for an OpenHands-compatible HTTP endpoint.
 * The URL and authentication stay outside DO and can be supplied by the app
 * runtime later.
 */
export function createOpenHandsHttpExecutor(input: {
  endpoint: string;
  headers?: Record<string, string>;
  fetcher?: typeof fetch;
}): OpenHandsExecutor {
  const fetcher = input.fetcher ?? fetch;

  return {
    async execute(task) {
      const response = await fetcher(input.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...input.headers,
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        return {
          status: "failed",
          message: `OpenHands request failed with HTTP ${response.status}.`,
        };
      }

      let body: { id?: string; message?: string } | undefined;
      try {
        body = (await response.json()) as { id?: string; message?: string };
      } catch {
        // Some execution gateways return an empty 2xx response.
      }

      return {
        status: "queued",
        message: body?.message ?? "Task accepted by OpenHands.",
        externalRunId: body?.id,
      };
    },
  };
}
