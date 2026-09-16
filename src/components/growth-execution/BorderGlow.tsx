"use client";

/**
 * A card whose border lights up where the pointer approaches it. Adapted from
 * React Bits' <BorderGlow /> (reactbits.dev, MIT).
 *
 * Changed from the original, each for a reason:
 *   - TypeScript, and a CSS module instead of global `.border-glow-*` classes.
 *   - `backgroundColor` may be a CSS variable (`var(--tile)`), so the card takes
 *     its surface from the page and follows it into dark mode. The original only
 *     reads a hex colour to decide light or dark, so a variable would always
 *     draw the dark treatment on a white tile. `tone="theme"` makes that choice
 *     follow the viewer's theme instead.
 *   - `className` and `pressed` reach the outer card, because on this page the
 *     card IS the tile: its border carries the open and lit states.
 *   - The inner wrapper does not scroll. The original sets overflow:auto, which
 *     puts a scrollbar on any tile whose text runs a line long.
 */

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./BorderGlow.module.css";

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  /** "H S L", e.g. "228 100 60". */
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  /** Three colours for the mesh-gradient border. */
  colors?: string[];
  fillOpacity?: number;
  /** "auto" reads backgroundColor as hex; "theme" follows the page theme. */
  tone?: "auto" | "light" | "dark" | "theme";
}

function parseHSL(hsl: string) {
  const m = hsl.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!m) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars: Record<string, string> = {};
  opacities.forEach((o, i) => {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(o * intensity, 100)}%)`;
  });
  return vars;
}

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function isLightColor(color: string) {
  const v = color.trim().replace("#", "");
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(v)) return false;
  const hex = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 180;
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (v: number) => void;
  onEnd?: () => void;
}) {
  const t0 = performance.now() + delay;
  const tick = () => {
    const t = Math.min((performance.now() - t0) / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else onEnd?.();
  };
  setTimeout(() => requestAnimationFrame(tick), delay);
}

export function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "#120F17",
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  fillOpacity = 0.5,
  tone = "auto",
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const center = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2] as const;
  }, []);

  const edgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = center(el);
      const dx = x - cx;
      const dy = y - cy;
      const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
      const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [center]
  );

  const cursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = center(el);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;
      return deg;
    },
    [center]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--edge-proximity", (edgeProximity(card, x, y) * 100).toFixed(3));
      card.style.setProperty("--cursor-angle", `${cursorAngle(card, x, y).toFixed(3)}deg`);
    },
    [edgeProximity, cursorAngle]
  );

  useEffect(() => {
    if (!animated || !cardRef.current) return;
    const card = cardRef.current;
    const a0 = 110;
    const a1 = 465;
    card.classList.add(styles.sweep);
    card.style.setProperty("--cursor-angle", `${a0}deg`);
    animateValue({ duration: 500, onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`) });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (v) => card.style.setProperty("--cursor-angle", `${(a1 - a0) * (v / 100) + a0}deg`),
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (v) => card.style.setProperty("--cursor-angle", `${(a1 - a0) * (v / 100) + a0}deg`),
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`),
      onEnd: () => card.classList.remove(styles.sweep),
    });
  }, [animated]);

  const toneClass =
    tone === "theme"
      ? `${styles.light} ${styles.themed}`
      : tone === "light" || (tone === "auto" && isLightColor(backgroundColor))
        ? styles.light
        : "";

  const style = {
    "--card-bg": backgroundColor,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  } as CSSProperties;

  return (
    <div ref={cardRef} onPointerMove={onPointerMove} className={`${styles.card} ${toneClass} ${className}`} style={style}>
      <span className={styles.edgeLight} />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
