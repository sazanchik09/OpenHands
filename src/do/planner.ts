import type { DoPlan, Goal, PlanStep } from "./core";

function step(
  goalId: string,
  index: number,
  title: string,
  description: string,
  risk: PlanStep["risk"] = "low",
  requiresApproval = false,
): PlanStep {
  return {
    id: `${goalId}-step-${index}`,
    title,
    description,
    risk,
    requiresApproval,
    status: "pending",
  };
}

/**
 * Deterministic first-pass planner.
 *
 * This deliberately has no provider dependency. Later, an LLM planner can
 * produce the same DoPlan contract and the execution layer can stay unchanged.
 */
export function createPlan(goal: Goal): DoPlan {
  const instruction = goal.instruction.toLowerCase();

  if (/(inbox|email|emails|mail)/.test(instruction)) {
    return {
      goalId: goal.id,
      steps: [
        step(goal.id, 1, "Inspect inbox", "Read recent messages and collect the context needed to act."),
        step(goal.id, 2, "Classify messages", "Group messages into actionable, informational, waiting, and low-priority items."),
        step(goal.id, 3, "Identify action items", "Extract deadlines, requests, follow-ups, and other tasks from relevant messages."),
        step(goal.id, 4, "Draft replies", "Prepare concise replies for messages that need a response; do not send them."),
        step(
          goal.id,
          5,
          "Prepare calendar actions",
          "Identify meeting requests and scheduling needs, then prepare suggested calendar actions.",
          "medium",
          true,
        ),
      ],
    };
  }

  if (/(day|today|schedule|calendar|meetings)/.test(instruction)) {
    return {
      goalId: goal.id,
      steps: [
        step(goal.id, 1, "Inspect calendar", "Review today's events, gaps, and scheduling constraints."),
        step(goal.id, 2, "Review priorities", "Identify urgent tasks and commitments from the available context."),
        step(goal.id, 3, "Prepare daily plan", "Create a focused sequence of work and suggested time blocks."),
        step(
          goal.id,
          4,
          "Prepare calendar changes",
          "Prepare suggested event changes without applying them.",
          "medium",
          true,
        ),
      ],
    };
  }

  if (/(customer|customers|lead|leads|prospect|prospects|sales)/.test(instruction)) {
    return {
      goalId: goal.id,
      steps: [
        step(goal.id, 1, "Define target profile", "Extract the audience, geography, industry, and other constraints from the request."),
        step(goal.id, 2, "Research prospects", "Find candidate companies or people matching the target profile."),
        step(goal.id, 3, "Score opportunities", "Rank candidates against the requested criteria and capture supporting evidence."),
        step(goal.id, 4, "Prepare outreach", "Draft personalized outreach for the strongest candidates; do not send it."),
      ],
    };
  }

  if (/(research|researching|investigate|analyze|analysis)/.test(instruction)) {
    return {
      goalId: goal.id,
      steps: [
        step(goal.id, 1, "Clarify research objective", "Turn the requested outcome into concrete questions and constraints."),
        step(goal.id, 2, "Gather sources", "Collect relevant sources and evidence for the research objective."),
        step(goal.id, 3, "Analyze findings", "Compare evidence, identify patterns, and note important uncertainty."),
        step(goal.id, 4, "Prepare result", "Produce a concise answer with sources, findings, and open questions."),
      ],
    };
  }

  return {
    goalId: goal.id,
    steps: [
      step(goal.id, 1, "Understand the outcome", "Break the request into a concrete, verifiable objective."),
      step(goal.id, 2, "Gather context", "Identify the information, tools, and permissions needed to complete the objective."),
      step(goal.id, 3, "Prepare actions", "Turn the objective into executable actions while keeping consequential changes gated."),
      step(
        goal.id,
        4,
        "Execute approved work",
        "Run the prepared actions through the execution layer.",
        "medium",
        true,
      ),
    ],
  };
}
