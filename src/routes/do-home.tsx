import { useState } from "react";
import { ArrowUp, CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import {
  createGoal,
  createPlan,
  dispatchPlan,
  createOpenHandsHttpExecutor,
  type AutonomyLevel,
  type DoPlan,
  type OpenHandsExecutionResult,
  type OpenHandsTask,
} from "#/do";

const QUICK_STARTS = [
  "Take care of my inbox",
  "Prepare my day",
  "Find potential customers",
  "Research something for me",
];

type RunState = "idle" | "running" | "queued" | "completed" | "waiting" | "failed";

const configuredExecutorEndpoint = import.meta.env.VITE_DO_OPENHANDS_ENDPOINT as string | undefined;

const localExecutor = {
  async execute(): Promise<OpenHandsExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return {
      status: "completed",
      message: "Step completed in the local execution preview.",
    };
  },
};

export default function DoHome() {
  const [instruction, setInstruction] = useState("");
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("prepare");
  const [createdGoal, setCreatedGoal] = useState<ReturnType<typeof createGoal> | null>(null);
  const [plan, setPlan] = useState<DoPlan | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [results, setResults] = useState<OpenHandsExecutionResult[]>([]);

  const submit = () => {
    if (!instruction.trim()) return;
    const goal = createGoal({ instruction: instruction.trim(), autonomy });
    setCreatedGoal(goal);
    setPlan(createPlan(goal));
    setRunState("idle");
    setCompletedSteps(0);
    setResults([]);
  };

  const runPlan = async () => {
    if (!createdGoal || !plan || runState === "running") return;

    const executor = configuredExecutorEndpoint
      ? createOpenHandsHttpExecutor({ endpoint: configuredExecutorEndpoint })
      : localExecutor;
    const { dispatch, execute } = dispatchPlan(createdGoal, plan, executor);

    if (dispatch.tasks.length === 0) {
      setRunState("waiting");
      return;
    }

    setRunState("running");
    setCompletedSteps(0);
    setResults([]);

    const nextResults: OpenHandsExecutionResult[] = [];
    for (let index = 0; index < dispatch.tasks.length; index += 1) {
      const [result] = await Promise.all([executeStep(dispatch.tasks[index]), Promise.resolve()]);
      nextResults.push(result);
      setResults([...nextResults]);
      if (result.status === "failed") {
        setRunState("failed");
        return;
      }
      setCompletedSteps(index + 1);
    }

    setRunState(nextResults.some((result) => result.status === "queued") ? "queued" : "completed");
  };

  const executeStep = async (task: OpenHandsTask) =>
    (configuredExecutorEndpoint
      ? createOpenHandsHttpExecutor({ endpoint: configuredExecutorEndpoint }).execute(task)
      : localExecutor.execute(task));

  const busy = runState === "running";

  return (
    <main className="min-h-full bg-base text-content px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="pt-4">
          <div className="mb-5 flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="text-sm font-medium tracking-wide">DO</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-content-2 md:text-5xl">
            Give AI a job.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-content">
            Tell DO the outcome you want. It will plan the work, prepare actions,
            and keep you in control of anything that needs approval.
          </p>
        </header>

        <section className="rounded-2xl border border-[var(--oh-border-subtle)] bg-surface p-4 shadow-sm">
          <label htmlFor="do-goal" className="sr-only">
            What do you want to get done?
          </label>
          <textarea
            id="do-goal"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit();
            }}
            placeholder="What do you want to get done?"
            rows={4}
            className="w-full resize-none bg-transparent px-2 py-2 text-lg text-content-2 outline-none placeholder:text-text-dim"
          />
          <div className="mt-3 flex flex-col gap-3 border-t border-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["ask", "prepare", "execute", "autopilot"] as AutonomyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAutonomy(level)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs capitalize transition",
                    autonomy === level
                      ? "bg-primary text-on-primary"
                      : "bg-tertiary text-text-secondary hover:bg-interactive-hover",
                  ].join(" ")}
                >
                  {level}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!instruction.trim() || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start
              <ArrowUp size={16} />
            </button>
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm text-text-secondary">Try one</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_STARTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setInstruction(item)}
                className="rounded-xl border border-border-subtle bg-surface px-4 py-4 text-left text-sm text-content transition hover:border-border hover:bg-surface-raised"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {createdGoal && plan ? (
          <section className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-success" size={20} />
              <div>
                <p className="font-medium text-content-2">
                  {runState === "completed" ? "Run completed" : runState === "queued" ? "Run queued" : runState === "failed" ? "Run failed" : "Plan ready"}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{createdGoal.instruction}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {plan.steps.map((item, index) => {
                const isCompleted =
                  !item.requiresApproval &&
                  index < completedSteps;
                const isRunning =
                  !item.requiresApproval &&
                  runState === "running" &&
                  index === completedSteps;

                return (
                  <div key={item.id} className="flex gap-3 rounded-xl bg-surface-raised p-4">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-medium">
                      {isCompleted ? <CheckCircle2 size={15} /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-content-2">{item.title}</p>
                        {item.requiresApproval ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                            <ShieldCheck size={12} />
                            Approval
                          </span>
                        ) : null}
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                            <Loader2 className="animate-spin" size={12} />
                            Running
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-content-2">
                  {runState === "waiting"
                    ? "Approval required"
                    : runState === "running"
                      ? "DO is working"
                      : runState === "completed"
                        ? `${completedSteps} steps completed`
                        : "Ready to run"}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {runState === "waiting"
                    ? "Some actions are blocked until you approve them."
                    : configuredExecutorEndpoint
                      ? "Connected to the configured OpenHands gateway endpoint."
                      : "Local execution preview. Set VITE_DO_OPENHANDS_ENDPOINT to send tasks to an OpenHands gateway."}
                </p>
              </div>
              <button
                type="button"
                onClick={runPlan}
                disabled={busy || runState === "completed" || runState === "waiting"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Running..." : "Run plan"}
                {busy ? <Loader2 className="animate-spin" size={16} /> : <ArrowUp size={16} />}
              </button>
            </div>

            {results.length > 0 ? (
              <div className="mt-4 space-y-2">
                {results.map((result, index) => (
                  <div key={`${result.message}-${index}`} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="text-success" size={15} />
                    Step {index + 1}: {result.message}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Goal</p>
                <p className="mt-1 text-sm capitalize">{createdGoal.status}</p>
              </div>
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Autonomy</p>
                <p className="mt-1 text-sm capitalize">{createdGoal.autonomy}</p>
              </div>
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Run</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Clock3 size={14} />
                  {runState === "idle" ? "Not started" : runState}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
