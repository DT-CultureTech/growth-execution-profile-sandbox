"use client";

/**
 * The financial snapshot, drawn.
 *
 * Three tiles in a bento row under the company card: the revenue as one large
 * figure with its growth, the margins and returns as rings, and how much of the
 * revenue reaches EBITDA and profit as bars. Under them, the sentence exactly as
 * the profile states it, which is the record the drawing is read from.
 *
 * Two rules keep the drawing honest, and both are enforced in
 * financial-snapshot.ts rather than here:
 *   - Every number printed is the substring the sentence carries. Nothing is
 *     reformatted, rounded or computed. Ring and bar LENGTHS are proportions of
 *     those numbers and print nothing.
 *   - A figure the reader cannot place plainly (a band, a ceiling, a quarter,
 *     another year, another entity) is not drawn. When too little is readable,
 *     the caller keeps the plain sentence instead of this component.
 */

import { useEffect, useRef, useState } from "react";
import styles from "./FinancialSnapshot.module.css";
import type { Amount, Percent, SnapshotReading } from "./financial-snapshot";

const RINGS = 3;

function Money({ a, size = "lg" }: { a: Amount; size?: "lg" | "sm" }) {
  return (
    <span className={size === "lg" ? styles.moneyLg : styles.moneySm}>
      <span className={styles.cur}>{a.currency}</span>
      <span className={styles.fig}>{a.number}</span>
      {a.unit ? <span className={styles.unit}>{a.unit}</span> : null}
    </span>
  );
}

const plain = (a: Amount) => `${a.currency} ${a.number}${a.unit ? ` ${a.unit}` : ""}`;

/** Grows its children in when the snapshot first comes into view. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return { ref, shown };
}

function Rings({ items, shown }: { items: Percent[]; shown: boolean }) {
  const size = 132;
  const stroke = 11;
  const gap = 3;
  return (
    <svg
      className={styles.rings}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={items.map((p) => `${p.label} ${p.number}%`).join(", ")}
    >
      {items.map((p, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + gap);
        const c = 2 * Math.PI * r;
        const pct = Math.max(0, Math.min(100, p.value));
        return (
          <g key={p.label} className={styles[`ring${i + 1}` as "ring1"]}>
            <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
            <circle
              className={styles.arc}
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={shown ? c * (1 - pct / 100) : c}
              style={{ transitionDelay: `${i * 120}ms` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function FinancialSnapshot({ reading, sentence }: { reading: SnapshotReading; sentence: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const r = reading;

  const ringable = r.percents.filter((p) => p.value >= 0 && p.value <= 100).slice(0, RINGS);
  const rest = r.percents.filter((p) => !ringable.includes(p));
  const bars = r.revenue
    ? [
        { key: "Revenue", a: r.revenue, cls: styles.barRev },
        r.ebitda ? { key: "EBITDA", a: r.ebitda, cls: styles.barEbitda } : null,
        r.pat ? { key: "Profit after tax", a: r.pat, cls: styles.barPat } : null,
      ].filter(Boolean) as { key: string; a: Amount; cls: string }[]
    : [];
  const showBars = bars.length > 1;
  const extras = [
    r.netDebt ? { k: "Net debt", v: plain(r.netDebt), tone: "" } : null,
    r.loss ? { k: "Loss", v: plain(r.loss), tone: styles.neg } : null,
    ...rest.map((p) => ({ k: p.label, v: `${p.number}%`, tone: p.value < 0 ? styles.neg : "" })),
  ].filter(Boolean) as { k: string; v: string; tone: string }[];

  const drawn = (r.revenue ? 1 : 0) + (ringable.length ? 1 : 0) + (showBars ? 1 : 0);
  // One drawn tile alone across the full width reads as an empty panel. The
  // sentence then takes the second tile beside it, as the record, instead of
  // sitting as a footnote under it.
  const recordAsTile = drawn === 1;
  const tiles = recordAsTile ? 2 : drawn;
  const label = r.revenueLabel
    ? r.revenueLabel.charAt(0).toUpperCase() + r.revenueLabel.slice(1)
    : "Revenue";

  return (
    <div ref={ref} className={`${styles.wrap} ${shown ? styles.shown : ""}`} role="group" aria-label="Financial snapshot">
      {/* The heading row carries the figures that are not drawn (net debt, a
          loss, a fourth ratio) as quiet stats, so none of them sits alone. */}
      <div className={styles.head}>
        <span className={styles.eyebrow}>Financial snapshot</span>
        <div className={styles.headRight}>
          {extras.length ? (
            <ul className={styles.extras}>
              {extras.map((x) => (
                <li key={x.k} className={x.tone}>
                  <span>{x.k}</span>
                  <b>{x.v}</b>
                </li>
              ))}
            </ul>
          ) : null}
          {r.period && !r.revenue ? <span className={styles.period}>{r.period}</span> : null}
        </div>
      </div>

      <div className={styles.grid} data-tiles={tiles}>
        {r.revenue ? (
          <div className={`${styles.tile} ${styles.tileNight}`}>
            <div className={styles.tileTop}>
              <span className={styles.tileLabel}>{label}</span>
              {r.period ? <span className={styles.periodNight}>{r.period}</span> : null}
            </div>
            <div className={styles.hero}>
              <Money a={r.revenue} />
            </div>
            {r.growth ? (
              <span
                className={r.growth.direction === "up" ? styles.chipUp : styles.chipDown}
                aria-label={`${r.growth.direction} ${r.growth.number}%`}
              >
                <svg viewBox="0 0 10 10" aria-hidden className={styles.chipArrow}>
                  <path d={r.growth.direction === "up" ? "M5 1.5 9 8.5H1z" : "M5 8.5 1 1.5h8z"} />
                </svg>
                {r.growth.number}%
              </span>
            ) : null}
          </div>
        ) : null}

        {ringable.length ? (
          <div className={styles.tile}>
            <span className={styles.tileLabel}>{ringable.length > 1 ? "Margins and returns" : ringable[0].label}</span>
            <div className={styles.ringsRow}>
              <Rings items={ringable} shown={shown} />
              <ul className={styles.legend}>
                {ringable.map((p, i) => (
                  <li key={p.label}>
                    <i className={styles[`dot${i + 1}` as "dot1"]} aria-hidden />
                    <span className={styles.legendK}>{p.label}</span>
                    <b className={styles.legendV}>{p.number}%</b>
                    {p.prior ? <span className={styles.prior}>{p.prior}% the year before</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {showBars ? (
          <div className={styles.tile}>
            <span className={styles.tileLabel}>From revenue to profit</span>
            <ul className={styles.bars}>
              {bars.map((b, i) => {
                const pct = Math.max(1.5, Math.min(100, (b.a.value / r.revenue!.value) * 100));
                return (
                  <li key={b.key}>
                    <div className={styles.barTop}>
                      <span className={styles.barK}>{b.key}</span>
                      <Money a={b.a} size="sm" />
                    </div>
                    <div className={styles.barTrack} aria-hidden>
                      <span
                        className={`${styles.bar} ${b.cls}`}
                        style={{ width: shown ? `${pct}%` : "0%", transitionDelay: `${i * 110}ms` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {recordAsTile ? (
          <div className={`${styles.tile} ${styles.recordTile}`}>
            <span className={styles.tileLabel}>As reported</span>
            <p>{sentence}</p>
          </div>
        ) : null}
      </div>

      {recordAsTile ? null : (
        <p className={styles.record}>
          <span>As reported</span>
          {sentence}
        </p>
      )}
    </div>
  );
}
