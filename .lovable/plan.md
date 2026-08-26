# Cinematic Futuristic City Tour

Turn the public and entry screens into a scroll- and click-driven "flight through a neon city" experience, while chat and the Memory Vault stay calm and readable.

## Look

Cyan Grid palette: near-black space blue `#03060f`, deep city blue `#0a1830`, neon cyan `#22d3ee`, ice highlight `#7dd3fc`. Thin, wide-tracked uppercase type for labels; large display headlines. Glass panels with cyan hairline borders and soft glow instead of the current warm cards. The existing cyan particle canvas becomes part of the atmosphere (parallax dust between skyline layers).

## Screens in scope

**Landing — the tour (5 scenes, full-screen each)**
1. Approach — city silhouette far below, title fades up out of the haze.
2. Descent — parallax skyline layers slide past at different speeds.
3. The circle — the six companion roles appear as holographic capsules on a grid floor.
4. Memory core — an abstract pulsing core representing the personal memory manual.
5. Arrival — the call to action, landing pad framing "Enter the city".

Scroll advances scenes with snap; each scene also has a "next" control, and the CTA can warp straight to sign-in. Scrollbar-free, keyboard (arrow/space) friendly, and a skip-to-end control so nobody is trapped in the animation.

**Auth** — arrival gate: the city keeps drifting behind a glass terminal panel; form fields glow on focus, sign-in triggers a short warp-out transition.

**Agents dashboard** — role cards become holographic console tiles on a grid floor, staggering in on load with a subtle hover lift and scanline sheen. Buttons keep their exact current behaviour (Train / Start Chat).

**Route transitions** — a shared warp/fade overlay plays between these screens so navigation feels like a cut in a film.

**Untouched** — Memory Vault and chat keep their current layout and behaviour, only inheriting the new colour tokens so nothing looks out of place.

## Accessibility and performance

Everything respects `prefers-reduced-motion`: scenes then appear instantly with plain fades, particles slow to near-still. Animation is CSS transform/opacity plus scroll observers — no heavy 3D library. Mobile keeps the same scenes with fewer parallax layers.

## Technical notes

- Retheme tokens in `src/styles.css` (dark cyan palette, new glass/glow utilities, keep light/dark token structure intact).
- New components: `CityScene` (full-viewport scene wrapper with intersection-based reveal), `CitySkyline` (layered SVG parallax), `WarpTransition` (route-change overlay mounted in `__root.tsx`), plus reuse of `SciFiParticles`.
- Rewrite `src/routes/index.tsx` as the scene sequence; restyle `src/routes/auth.tsx` and `src/routes/_authenticated/agents.tsx` presentation only.
- Animation via CSS keyframes/`IntersectionObserver` and CSS scroll-snap; no new dependency unless a motion library proves necessary, in which case `motion` for React.
- Update head metadata on the retouched routes to match the new positioning.
- No changes to data, auth logic, server functions, or the chat brain.
