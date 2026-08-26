import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { CityScene } from "@/components/city/CityScene";
import { CitySkyline } from "@/components/city/CitySkyline";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Persona AI — A neon city of companions" },
      {
        name: "description",
        content:
          "Take the tour: a cinematic flight through a neon city where your AI companions — best friend, study guide, mother, father, sister, mentor — live and learn your world.",
      },
      { property: "og:title", content: "My Persona AI — A neon city of companions" },
      {
        property: "og:description",
        content: "A scroll-driven tour through the city where your AI companions live.",
      },
    ],
  }),
  component: Landing,
});

const SCENES = ["approach", "descent", "circle", "core", "arrival"] as const;

const ROLES = [
  { e: "🐣", l: "Best Friend" },
  { e: "🦉", l: "Study Guide" },
  { e: "🐰", l: "Mother" },
  { e: "🐻‍❄️", l: "Father" },
  { e: "🦊", l: "Sister" },
  { e: "🦄", l: "Mentor" },
];

function Landing() {
  const trackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`#scene-${SCENES[Math.min(i, SCENES.length - 1)]}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onKey(e: KeyboardEvent) {
      if (!track) return;
      const step = track.clientHeight;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        track.scrollBy({ top: step, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        track.scrollBy({ top: -step, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main ref={trackRef} className="tour-track relative">
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5">
        <span className="label-mono pointer-events-auto">My Persona AI</span>
        <button
          onClick={() => goTo(SCENES.length - 1)}
          className="label-mono pointer-events-auto rounded-full border border-primary/40 px-3 py-1.5"
        >
          skip tour
        </button>
      </nav>

      {/* 01 — Approach */}
      <CityScene id="scene-approach" index={0} total={5} label="approach" onNext={() => goTo(1)}>
        <div className="text-center">
          <p className="label-mono">sector 01 · night flight</p>
          <h1 className="mt-5 text-5xl leading-[1.05] font-semibold text-balance sm:text-7xl">
            A city built from <span className="neon-text">your memories</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Descend into the district where your companions live. Scroll, or take the elevator.
          </p>
        </div>
      </CityScene>

      {/* 02 — Descent */}
      <CityScene id="scene-descent" index={1} total={5} label="descent" onNext={() => goTo(2)}>
        <div className="relative">
          <div className="text-center">
            <h2 className="text-3xl font-semibold sm:text-5xl">Descending through the haze</h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Towers of everything you've ever told them, lit from the inside.
            </p>
          </div>
        </div>
        <CitySkyline />
      </CityScene>

      {/* 03 — The circle */}
      <CityScene id="scene-circle" index={2} total={5} label="the circle" onNext={() => goTo(3)}>
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-5xl">Six residents. One circle.</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <article
                key={r.l}
                className="glass-panel relative flex flex-col items-center gap-2 overflow-hidden px-3 py-6"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span
                  className="animate-scan pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-primary/12 to-transparent"
                  style={{ animationDelay: `${i * 400}ms` }}
                />
                <span className="text-3xl">{r.e}</span>
                <span className="label-mono">{r.l}</span>
              </article>
            ))}
          </div>
        </div>
      </CityScene>

      {/* 04 — Memory core */}
      <CityScene id="scene-core" index={3} total={5} label="memory core" onNext={() => goTo(4)}>
        <div className="flex flex-col items-center text-center">
          <div className="animate-core relative grid h-48 w-48 place-items-center rounded-full neon-edge">
            <div className="absolute inset-4 rounded-full border border-primary/30" />
            <div className="absolute inset-10 rounded-full border border-primary/20" />
            <div className="h-16 w-16 rounded-full bg-primary/70 blur-[2px]" />
          </div>
          <h2 className="mt-10 text-3xl font-semibold sm:text-5xl">The memory core</h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Your manual — who you are, how you work, what a hard day looks like. Everything they say
            is drawn from it.
          </p>
        </div>
      </CityScene>

      {/* 05 — Arrival */}
      <CityScene id="scene-arrival" index={4} total={5} label="arrival">
        <div className="text-center">
          <p className="label-mono">landing pad · sector 05</p>
          <h2 className="mt-5 text-4xl font-semibold sm:text-6xl">Enter the city</h2>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
            Private by design — only you can see your memories.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link
              to="/auth"
              className="gradient-primary inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              Get started
            </Link>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="label-mono rounded-full border border-primary/40 px-5 py-2.5"
            >
              I already have an account
            </button>
          </div>
        </div>
        <CitySkyline />
      </CityScene>
    </main>
  );
}
