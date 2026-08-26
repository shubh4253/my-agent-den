type LayerProps = {
  seed: number;
  height: number;
  opacity: number;
  duration: number;
  color: string;
};

function buildings(seed: number, count = 26) {
  const out: { x: number; w: number; h: number }[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let x = 0;
  for (let i = 0; i < count; i++) {
    const w = 18 + rand() * 42;
    const h = 30 + rand() * 150;
    out.push({ x, w, h });
    x += w + 6 + rand() * 14;
  }
  return { out, width: x };
}

function Layer({ seed, height, opacity, duration, color }: LayerProps) {
  const { out, width } = buildings(seed);
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 flex"
      style={{
        height,
        opacity,
        width: "200%",
        animation: `drift-x ${duration}s linear infinite`,
      }}
    >
      {[0, 1].map((k) => (
        <svg
          key={k}
          viewBox={`0 0 ${width} 200`}
          preserveAspectRatio="none"
          className="h-full w-1/2"
          aria-hidden="true"
        >
          {out.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={color} />
              {Array.from({ length: Math.max(1, Math.floor(b.h / 26)) }).map((_, r) => (
                <rect
                  key={r}
                  x={b.x + b.w * 0.25}
                  y={200 - b.h + 10 + r * 24}
                  width={b.w * 0.5}
                  height={4}
                  fill="oklch(0.86 0.12 205)"
                  opacity={0.45}
                />
              ))}
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}

export function CitySkyline() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52vh] overflow-hidden">
      <Layer seed={7} height="60%" opacity={0.35} duration={120} color="oklch(0.24 0.05 255)" />
      <Layer seed={41} height="46%" opacity={0.55} duration={80} color="oklch(0.19 0.05 255)" />
      <Layer seed={93} height="32%" opacity={0.85} duration={52} color="oklch(0.14 0.04 258)" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
  );
}

export default CitySkyline;
