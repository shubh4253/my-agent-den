import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Persona AI — Companions who actually know you" },
      {
        name: "description",
        content:
          "Build your own circle of AI companions: best friend, study guide, mother, father, sister or mentor — each trained on your personal memory manual.",
      },
      { property: "og:title", content: "My Persona AI — Companions who actually know you" },
      {
        property: "og:description",
        content: "Warm, emoji-friendly AI companions trained on your own life manual.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Persona AI</p>
        <h1 className="mt-4 text-4xl leading-tight font-semibold text-balance">
          A little circle of people who really get you 💛
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Pick a role — best friend, study guide, mum, dad, sister, mentor — teach them your world,
          and chat any time.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { e: "🐣", l: "Best Friend" },
            { e: "🦉", l: "Study Guide" },
            { e: "🐰", l: "Mother" },
            { e: "🐻‍❄️", l: "Father" },
            { e: "🦊", l: "Sister" },
            { e: "🦄", l: "Mentor" },
          ].map((r) => (
            <div key={r.l} className="surface-card flex flex-col items-center gap-1 px-2 py-4">
              <span className="text-2xl">{r.e}</span>
              <span className="text-[11px] font-semibold text-muted-foreground">{r.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <Link
          to="/auth"
          className="gradient-primary flex w-full items-center justify-center rounded-full py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
        >
          Get started ✨
        </Link>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Private by design — only you can see your memories.
        </p>
      </div>
    </main>
  );
}
