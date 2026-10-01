import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { CityScene } from "@/components/city/CityScene";
import { CitySkyline } from "@/components/city/CitySkyline";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Persona AI — A story in five scenes" },
      {
        name: "description",
        content:
          "Enter a cinematic story where your AI companions learn the details that make you, you.",
      },
      { property: "og:title", content: "My Persona AI — A story in five scenes" },
      {
        property: "og:description",
        content: "A cinematic journey through the lives of your AI companions.",
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
    const target = track.querySelector<HTMLElement>(
      `#scene-${SCENES[Math.min(i, SCENES.length - 1)]}`,
    );
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
        <span className="film-kicker pointer-events-auto">MY PERSONA AI · A FILM</span>
        <button
          onClick={() => goTo(SCENES.length - 1)}
          className="film-kicker pointer-events-auto rounded-md border border-border px-3 py-2 transition hover:border-primary/60"
        >
          skip tour
        </button>
      </nav>

      {/* 01 — Approach */}
      <CityScene id="scene-approach" index={0} total={5} label="approach" onNext={() => goTo(1)}>
        <div className="text-center">
          <p className="film-kicker">ACT I · THE CITY AT NIGHT</p>
          <h1 className="film-title mt-5 text-5xl leading-[1.05] font-normal text-balance sm:text-7xl">
            A city built from <span className="neon-text">your memories</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Every light holds a piece of your story. Somewhere in this city, your circle is waiting.
          </p>
        </div>
      </CityScene>

      {/* 02 — Descent */}
      <CityScene id="scene-descent" index={1} total={5} label="descent" onNext={() => goTo(2)}>
        <div className="relative z-10">
          <div className="relative z-10 text-center">
            <h2 className="film-title text-3xl font-normal sm:text-5xl">The city remembers</h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Some things are easier to say when the world grows quiet.
            </p>
          </div>
        </div>
        <CitySkyline />
      </CityScene>

      {/* 03 — The circle */}
      <CityScene id="scene-circle" index={2} total={5} label="the circle" onNext={() => goTo(3)}>
        <div className="relative z-10 text-center">
          <h2 className="film-title text-3xl font-normal sm:text-5xl">
            A cast of lives. One story.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <article
                key={r.l}
                className="cast-card relative flex flex-col items-center gap-2 overflow-hidden px-3 py-6"
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
          <h2 className="film-title mt-10 text-3xl font-normal sm:text-5xl">
            The story beneath the story
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            The details you trust them with become the compass for every conversation.
          </p>
        </div>
      </CityScene>

      {/* 05 — Arrival */}
      <CityScene id="scene-arrival" index={4} total={5} label="arrival">
        <div className="relative z-10 text-center">
          <p className="film-kicker">ACT V · THE FIRST HELLO</p>
          <h2 className="film-title mt-5 text-4xl font-normal sm:text-6xl">Enter your story</h2>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
            Private by design — only you can see your memories.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link
              to="/auth"
              className="gradient-primary inline-flex items-center justify-center rounded-md px-10 py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              Get started
            </Link>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="film-kicker rounded-md border border-border px-5 py-2.5 transition hover:border-primary/60"
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
