import { useEffect, useRef, useState, type ReactNode } from "react";

export function CityScene({
  id,
  index,
  total,
  label,
  children,
  onNext,
}: {
  id: string;
  index: number;
  total: number;
  label: string;
  children: ReactNode;
  onNext?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(index === 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className="tour-scene px-6 py-20">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 grid-floor" />
      <div className="pointer-events-none absolute left-6 top-8 flex items-center gap-3">
        <span className="label-mono">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="h-px w-10 bg-primary/40" />
        <span className="label-mono">{label}</span>
      </div>

      <div
        className={`relative mx-auto w-full max-w-3xl scene-reveal ${visible ? "scene-visible" : ""}`}
      >
        {children}
      </div>

      {onNext && (
        <button
          onClick={onNext}
          className="absolute inset-x-0 bottom-8 mx-auto flex w-fit flex-col items-center gap-1.5 text-primary"
          aria-label="Go to next scene"
        >
          <span className="label-mono">continue</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 neon-edge">
            ↓
          </span>
        </button>
      )}
    </section>
  );
}

export default CityScene;
