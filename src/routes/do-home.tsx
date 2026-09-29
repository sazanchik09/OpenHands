import { Form, useNavigation } from "react-router";
import { useState } from "react";
import { ArrowUp, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { createGoal, type AutonomyLevel } from "#/do";

const QUICK_STARTS = [
  "Take care of my inbox",
  "Prepare my day",
  "Find potential customers",
  "Research something for me",
];

export default function DoHome() {
  const navigation = useNavigation();
  const [instruction, setInstruction] = useState("");
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("prepare");
  const [createdGoal, setCreatedGoal] = useState<ReturnType<typeof createGoal> | null>(null);

  const submit = () => {
    if (!instruction.trim()) return;
    setCreatedGoal(createGoal({ instruction: instruction.trim(), autonomy }));
  };

  const busy = navigation.state !== "idle";

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
              {busy ? "Planning..." : "Start"}
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

        {createdGoal ? (
          <section className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-success" size={20} />
              <div>
                <p className="font-medium text-content-2">Goal created</p>
                <p className="mt-1 text-sm text-text-secondary">{createdGoal.instruction}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Status</p>
                <p className="mt-1 text-sm capitalize">{createdGoal.status}</p>
              </div>
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Autonomy</p>
                <p className="mt-1 text-sm capitalize">{createdGoal.autonomy}</p>
              </div>
              <div className="rounded-xl bg-surface-raised p-3">
                <p className="text-xs text-text-dim">Next</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Clock3 size={14} />
                  Planning
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-text-dim">
              This first slice creates the durable DO goal. The next layer will turn it into
              an executable plan and dispatch it to OpenHands.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
