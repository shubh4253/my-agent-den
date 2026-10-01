import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function WarpTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [key, setKey] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setKey((k) => k + 1);
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 650);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      key={key}
      aria-hidden="true"
      className="warp-overlay pointer-events-none fixed inset-0 z-50"
      style={{ animation: "warp-flash 650ms ease-out forwards" }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-primary shadow-[0_0_40px_8px_var(--neon)]" />
    </div>
  );
}

export default WarpTransition;
