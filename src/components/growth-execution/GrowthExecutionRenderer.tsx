"use client";

/**
 * The Growth Execution Profile, as an owner reads it.
 *
 * Five sections in display order: 00 what they do, 1A market, 1B fit and
 * difference, 02 growth execution, 03 what we read. The generator builds them in
 * a different order (PMF first, intro last) because each informs the next, but
 * that is a research order and never a reading order.
 *
 * Three things here are instruments rather than text, because the ontology
 * already relates data the page was previously showing apart:
 *
 *   The lever board  Six tiles. Opening one shows where this business stands on
 *                    that lever, which market findings feed it, and which of the
 *                    exemplar companies actually pulled it. Those three facts
 *                    live in three different parts of the document.
 *   The probe cards  The same wiring in reverse: a finding lights every lever it
 *                    feeds.
 *   The ladder       Revenue against the exemplars, log scale. "38x" is the
 *                    growth distance stated once instead of implied by a table.
 *
 * Two rules from the ontology are load-bearing here and easy to break by
 * accident. An absence is never a sentence: an element with nothing behind it
 * renders as nothing, and the page never reports the status of our search. And
 * M2 is the one lever no outside reading can answer, so it says what happens on
 * the call rather than sitting empty.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import styles from "./growth-execution.module.css";
import { growthExecutionFontVars } from "./growth-execution-fonts";
import {
  HERO_CELLS,
  INNOVATION_ORDER,
  INTRO_ORDER,
  HORIZONTAL_LABEL,
  HORIZONTAL_ORDER,
  LEVER_KEYS,
  missingFields,
  LEVER_NAME,
  MODEL_LABEL,
  PMF_ORDER,
  WORKFLOW_MAP,
  hasAnnexure,
  hasGrowthExecution,
  isBlank,
  leverCodes,
  multiple,
  toCrore,
  type GrowthExecutionAnnexure,
  type GrowthExecutionContract,
  type GrowthExecutionExemplar,
  type GrowthExecutionHvt,
  type GrowthExecutionOpportunity,
  type GrowthExecutionResearchRow,
  type GrowthExecutionSacrifice,
  type GrowthExecutionSection,
  type GrowthExecutionWorkflow,
} from "./growth-execution-contract";

// The levers lead. Tarun, 3 September 2026.
//
// Until the Stage 7 amendment the cells opened with an instruction, so a reader who
// met them first met advice from somebody who had not looked, and Part One had to go
// ahead of them to earn the read. The amendment moved the recognition INSIDE each
// cell — every one now opens with what he built — so the section carries its own
// introduction and no longer needs one in front of it.
//
// What he came for is the six moves. Everything else is apparatus he reaches for when
// he wants to check us, and it stays one click away in the nav rather than in his way.
const BASE_SECTIONS = [
  { id: "s1A", num: "01", title: "Growth Levers" },
  { id: "s00", num: "02", title: "What they do" },
  { id: "s1B", num: "03", title: "Fit and difference" },
  { id: "s02", num: "04", title: "Growth execution" },
  { id: "s03", num: "05", title: "What we read" },
];

const ANNEXURE_SECTION = { id: "s04", num: "06", title: "Annexure" };

/* ── small pieces ─────────────────────────────────────────────────────── */

function Field({ label, value }: { label: string; value?: string }) {
  if (isBlank(value)) return null;
  return (
    <div className={styles.f}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Element({ label, value }: { label: string; value?: string }) {
  if (isBlank(value)) return null;
  return (
    <div className={styles.el}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** What the buyer gives up to keep choosing, with the tier read as a sentence. */
function SacrificeMeter({ sacrifice }: { sacrifice?: GrowthExecutionSacrifice }) {
  if (!sacrifice || isBlank(sacrifice.text)) return null;
  const tier = String(sacrifice.tier ?? "").toUpperCase();
  const filled = tier === "A" ? 3 : tier === "B" ? 2 : tier === "C" ? 1 : 0;
  const reading =
    tier === "A"
      ? "The buyer gives up a great deal to stay."
      : tier === "B"
        ? "The buyer gives up something real to stay."
        : "The buyer gives up little to stay.";
  return (
    <div className={styles.el}>
      <dt>what the buyer gives up to keep choosing</dt>
      <dd>
        {sacrifice.text}
        <div className={styles.meter}>
          <div className={styles.meterTop}>
            <span className={styles.meterLab}>Paid in</span>
            <span className={styles.meterCur}>
              {isBlank(sacrifice.currency) ? "—" : sacrifice.currency}
            </span>
          </div>
          <div className={styles.meterBars}>
            {[0, 1, 2].map((i) => (
              <i key={i} className={i < filled ? styles.meterOn : undefined} />
            ))}
          </div>
          {tier ? (
            <p className={styles.meterNote}>
              Tier {tier} of A to C. {reading}
            </p>
          ) : null}
        </div>
      </dd>
    </div>
  );
}

function RecordTable({ rows }: { rows?: GrowthExecutionResearchRow[] }) {
  if (!rows || !rows.length) return null;
  const anySource = rows.some((r) => !isBlank(r.source));
  return (
    <div className={styles.scroll}>
      <table>
        <thead>
          <tr>
            <th style={{ width: "30%" }}>What</th>
            <th style={{ width: "34%" }}>Value</th>
            {anySource ? (
              <>
                <th>Source</th>
                <th>As of</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                {r.fact}
                {r.derived ? <span className={styles.derived}>derived</span> : null}
              </td>
              <td className={styles.big}>{r.value}</td>
              {anySource ? (
                <>
                  <td className={styles.src}>{r.source ?? ""}</td>
                  <td className={styles.asof}>{r.asOf ?? ""}</td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── section 2, growth execution ───────────────────────────────────────── */

/**
 * The workflow map. A horizontal with no published rate cannot host a
 * constraint, so it is shown as a step we could not price from outside. The
 * page never says a rate is missing; it shows the ones we have and marks the
 * rest as a step whose number comes from the business.
 */
function WorkflowMap({ workflows }: { workflows?: Record<string, GrowthExecutionWorkflow> }) {
  if (!workflows) return null;
  const rows = HORIZONTAL_ORDER.map((k) => [k, workflows[k]] as const).filter(([, w]) => w);
  if (!rows.length) return null;
  return (
    <div className={styles.ge2}>
      <h3>How the work moves</h3>
      <div className={styles.wf}>
        {rows.map(([k, w]) => {
          const priced = !isBlank(w?.rateValue);
          return (
            <div key={k} className={priced ? styles.wfRow : `${styles.wfRow} ${styles.wfOpen}`}>
              <div className={styles.wfLab}>{HORIZONTAL_LABEL[k] ?? k}</div>
              <div className={styles.wfBody}>
                {!isBlank(w?.step) ? <p className={styles.wfStep}>{w?.step}</p> : null}
                {w?.artefacts?.length ? (
                  <ul className={styles.wfArt}>
                    {w.artefacts.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : null}
                <div className={styles.wfRate}>
                  <span>{w?.rate}</span>
                  {priced ? <b>{w?.rateValue}</b> : <em>comes from your numbers</em>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The value condition. Filling capacity is not the same as earning the cost of
 * capital, so the arithmetic is stated and each term is marked as ours or
 * theirs. The terms only they hold are the reason for the conversation.
 */
function ValueCondition({ vc }: { vc?: GrowthExecutionSection["valueCondition"] }) {
  if (!vc || isBlank(vc.expression)) return null;
  return (
    <div className={styles.ge2}>
      <h3>What decides whether this creates value</h3>
      {!isBlank(vc.why) ? <p className={styles.wfStep}>{vc.why}</p> : null}
      <div className={styles.vcExpr}>{vc.expression}</div>
      {vc.terms?.length ? (
        <div className={styles.vcTerms}>
          {vc.terms.map((t, i) => {
            const ours = !isBlank(t.known);
            return (
              <div key={i} className={ours ? styles.vcTerm : `${styles.vcTerm} ${styles.vcYours}`}>
                <b>{t.term}</b>
                <span>{t.meaning}</span>
                {ours ? <i>{t.known}</i> : <em>you hold this</em>}
              </div>
            );
          })}
        </div>
      ) : null}
      {!isBlank(vc.reading) ? <p className={styles.vcRead}>{vc.reading}</p> : null}
      {!isBlank(vc.counterEvidence) ? <p className={styles.vcCounter}>{vc.counterEvidence}</p> : null}
    </div>
  );
}

/** Constraints as stored EBITDA. The binding one leads and says so. */
function Opportunities({ items }: { items?: GrowthExecutionOpportunity[] }) {
  if (!items || !items.length) return null;
  const ordered = [...items].sort((a, b) => Number(Boolean(b.binding)) - Number(Boolean(a.binding)));
  return (
    <div className={styles.ge2}>
      <h3>Where the EBITDA is stored</h3>
      {ordered.map((o, i) => (
        <div key={o.id ?? i} className={o.binding ? `${styles.opp} ${styles.oppBind}` : styles.opp}>
          <div className={styles.oppTop}>
            <span className={styles.oppId}>{o.id}</span>
            <span className={styles.oppFam}>{o.family}</span>
            {o.binding ? <span className={styles.oppTag}>binding</span> : null}
            {!isBlank(o.lever) ? <span className={styles.oppLever}>{o.lever}</span> : null}
          </div>
          {!isBlank(o.constraint) ? <p className={styles.oppCon}>{o.constraint}</p> : null}
          {!isBlank(o.ebitdaTerm) ? (
            <div className={styles.oppTerm}>
              <span>Moves</span>
              <b>{o.ebitdaTerm}</b>
            </div>
          ) : null}
          {!isBlank(o.arithmetic) ? <p className={styles.oppMath}>{o.arithmetic}</p> : null}
          {!isBlank(o.reliefCost) ? (
            <p className={styles.oppCost}>
              <span>What relief costs</span> {o.reliefCost}
            </p>
          ) : null}
          {!isBlank(o.lede) ? <p className={styles.oppLede}>{o.lede}</p> : null}
        </div>
      ))}
    </div>
  );
}

/** One test per opportunity: a bound, a metric, and the rule that decides next. */
function Tests({ items }: { items?: GrowthExecutionHvt[] }) {
  if (!items || !items.length) return null;
  return (
    <div className={styles.ge2}>
      <h3>How to find out cheaply</h3>
      <div className={styles.hvts}>
        {items.map((h, i) => (
          <div key={i} className={styles.hvt}>
            <div className={styles.hvtTop}>
              <b>{h.class}</b>
              {!isBlank(h.forOpportunity) ? <span>{h.forOpportunity}</span> : null}
            </div>
            <Field label="Bound" value={h.bound} />
            <Field label="Metric" value={h.metric} />
            <Field label="Decision rule" value={h.decisionRule} />
            <Field label="Reads out" value={h.readsOut} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── section 4, the annexure ───────────────────────────────────────────── */

/**
 * An appendix answering what one reader asked. Outside the ontology, so it
 * carries no gates and states its sources inline rather than relying on
 * section 03.
 */
function Annexure({ annexure }: { annexure?: GrowthExecutionAnnexure }) {
  if (!hasAnnexure(annexure)) return null;
  const a = annexure as GrowthExecutionAnnexure;
  return (
    <section id="s04" className={styles.section}>
      <div className={styles.head}>
        <span className={styles.num}>06</span>
        <h2>{isBlank(a.title) ? "Annexure" : a.title}</h2>
      </div>
      {!isBlank(a.preface) ? <p className={styles.sub}>{a.preface}</p> : null}
      {a.blocks?.map((b, i) => (
        <div key={i} className={styles.anx}>
          {!isBlank(b.heading) ? <h3>{b.heading}</h3> : null}
          {!isBlank(b.body)
            ? String(b.body)
                .split(/\n{2,}/)
                .map((para, j) => <p key={j}>{para}</p>)
            : null}
          <RecordTable rows={b.rows} />
        </div>
      ))}
    </section>
  );
}

/* ── the renderer ─────────────────────────────────────────────────────── */

export function GrowthExecutionRenderer({ profile }: { profile: GrowthExecutionContract }) {
  const intro = profile.intro ?? {};
  // Memoised for the same reason partTwo below is: a fresh {} on every render
  // makes every useMemo that depends on it recompute every time.
  const partOne = useMemo(() => intro.partOne ?? {}, [intro.partOne]);
  const partTwo = useMemo(
    () => (intro.partTwo ?? []).filter((r) => !isBlank(r.company)),
    [intro.partTwo]
  );
  const market = profile.market ?? {};
  const levers = market.levers ?? {};
  const probes = useMemo(() => market.probes ?? {}, [market.probes]);
  const record = profile.researchRecord ?? {};
  const ge = profile.growthExecution;
  const showGe = hasGrowthExecution(ge);
  const showAnnexure = hasAnnexure(profile.annexure);
  const sections = useMemo(
    () => (showAnnexure ? [...BASE_SECTIONS, ANNEXURE_SECTION] : BASE_SECTIONS),
    [showAnnexure],
  );

  const [openLever, setOpenLever] = useState<string | null>(null);
  const [litProbe, setLitProbe] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [barsIn, setBarsIn] = useState(false);
  const ladderRef = useRef<HTMLDivElement | null>(null);

  /* Lever -> the probe findings that feed it, and the exemplars that pulled it.
     This is the cross-link the document already implied and never showed. */
  const feedsBy = useMemo(() => {
    const m: Record<string, { name: string; finding?: string }[]> = {};
    for (const [name, p] of Object.entries(probes)) {
      for (const c of leverCodes(p.feeds)) (m[c] ||= []).push({ name, finding: p.finding });
    }
    return m;
  }, [probes]);

  const pulledBy = useMemo(() => {
    const m: Record<string, GrowthExecutionExemplar[]> = {};
    for (const r of partTwo) {
      for (const c of leverCodes(r["growth levers"])) (m[c] ||= []).push(r);
    }
    return m;
  }, [partTwo]);

  /* The ladder: this business against the companies ahead of it. */
  const selfSize = toCrore(partOne["financial snapshot"]);
  const rungs = useMemo(() => {
    const rows = [
      {
        name: profile.company ?? "This business",
        self: true,
        val: partOne["financial snapshot"],
        size: selfSize,
        commands: undefined as string | undefined,
      },
      ...partTwo.map((r) => ({
        name: r.company as string,
        self: false,
        val: r.revenue,
        size: toCrore(r.revenue),
        commands: r["what commands the revenue"],
      })),
    ];
    return rows.filter((r) => r.size);
  }, [profile.company, partOne, partTwo, selfSize]);

  const maxSize = Math.max(...rungs.map((r) => r.size as number), 1);
  const widthOf = (s: number) =>
    Math.max(3, Math.round((Math.log10(s + 1) / Math.log10(maxSize + 1)) * 100));

  // Bars grow when the ladder comes into view. Where IntersectionObserver does
  // not exist — an old browser, a server render, a test environment — they are
  // simply drawn at full length. The growth distance is the point; the animation
  // is not, and it must never be the reason a profile fails to render.
  useEffect(() => {
    const el = ladderRef.current;
    if (!el || barsIn) return;
    if (typeof IntersectionObserver === "undefined") {
      setBarsIn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setBarsIn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [barsIn]);

  // Which section the reader is in.
  useEffect(() => {
    const onScroll = () => {
      let cur = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) cur = i;
      });
      setActiveSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const heroCells = HERO_CELLS.filter((k) => !isBlank(partOne[k]));
  const introCells = INTRO_ORDER.filter(
    (k) => !isBlank(partOne[k]) && !HERO_CELLS.includes(k as (typeof HERO_CELLS)[number])
  );
  const probeEntries = Object.entries(probes).filter(([, p]) => !isBlank(p.finding));

  const recordBlocks: [string, GrowthExecutionResearchRow[] | undefined][] = [
    ["Company", record.company],
    ["Market", record.market],
    ["Regulation", record.regulation],
    ["Exemplar companies", record.exemplars],
    ["Derived by us", record.derived],
  ];

  // Volume first or margin first. Declared in the record by the generator, which holds
  // the filed figures; absent means volume, the order every profile shipped with.
  const [gapsOpen, setGapsOpen] = useState(false);
  const gaps = useMemo(() => missingFields(profile), [profile]);

  const ROWS = useMemo(() => {
    const volume = { label: "Volume", hint: "sell more", keys: LEVER_KEYS.slice(0, 3) };
    const margin = { label: "Margin", hint: "keep more", keys: LEVER_KEYS.slice(3) };
    return market.leadWith === "margin" ? [margin, volume] : [volume, margin];
  }, [market.leadWith]);

  const openLeverData = openLever ? levers[openLever.toLowerCase()] ?? {} : null;
  // M2 is on the call because of what M2 IS, not because of what the data says.
  // A lower variable cost is located by mapping the workflow, which cannot be done
  // from outside, so the answer is the same for every company whether or not the
  // generator remembered to write it. Reading this off the status text left 53 of
  // 144 profiles showing "Nothing read from outside on this one" against M2, which
  // states an absence — the one thing the page must never do.
  const openIsCall = openLever === "M2" ||
    String(openLeverData?.status ?? "").trim().toLowerCase() === WORKFLOW_MAP;

  return (
    <div className={`${styles.root} ${growthExecutionFontVars}`}>
      <header className={styles.hero}>
        <div className={styles.heroIn}>
          <p className={styles.eyebrow}>
            Growth Execution Profile
            {market.model ? ` · ${MODEL_LABEL[market.model] ?? market.model}` : ""}
          </p>
          <h1>{profile.company}</h1>
          {!isBlank(intro.frame) ? <p className={styles.frame}>{intro.frame}</p> : null}
          <div className={styles.heroRule} />
          {heroCells.length ? (
            <dl className={styles.snap}>
              {heroCells.map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{partOne[k]}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      <nav className={styles.nav}>
        <div className={styles.navIn}>
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={i === activeSection ? styles.navOn : undefined}
            >
              <b>{s.num}</b>
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <main className={styles.main}>
        {/* ── 1A ── */}
        <section id="s1A" className={styles.section}>
          <div className={styles.head}>
            <span className={styles.num}>01</span>
            <h2>Growth Levers</h2>
          </div>
          <p className={styles.sub}>
            Six moves, each built on something this business already holds. Open one to see what
            it is worth here, the dated fact behind it, and the company that pulled it.
          </p>

          <p className={styles.part}>
            <span>The lever board</span>
            <em className={styles.partHint}>Click a lever</em>
          </p>
          <div className={styles.board}>
            {/* The leading half is printed first. Which one leads is a fact about this
                business, declared in the record: see LeverLead. A company earning below
                its cost of capital is told to fix margin before it buys more volume. */}
            {ROWS.map((row) => (
              <Fragment key={row.label}>
                <div className={styles.rowlab}>
                  <b>{row.label}</b>
                  {row.hint}
                </div>
                {row.keys.map((k) => (
                  <LeverTile
                    key={k}
                    code={k.toUpperCase()}
                    lever={levers[k]}
                    feeds={feedsBy[k.toUpperCase()]?.length ?? 0}
                    open={openLever === k.toUpperCase()}
                    lit={
                      !!litProbe &&
                      leverCodes(probes[litProbe]?.feeds).includes(k.toUpperCase())
                    }
                    onToggle={() =>
                      setOpenLever((cur) => (cur === k.toUpperCase() ? null : k.toUpperCase()))
                    }
                  />
                ))}
              </Fragment>
            ))}
          </div>

          {openLever ? (
            <div className={styles.drawer} role="region" aria-live="polite">
              <div className={styles.drawerTop}>
                <span className={styles.drawerK}>{openLever}</span>
                <h3>{LEVER_NAME[openLever]}</h3>
              </div>
              {!isBlank(openLeverData?.inThisModel) ? (
                <p className={styles.drawerIn}>{openLeverData?.inThisModel}</p>
              ) : null}
              {/* The move leads. Everything under it is the evidence for it. */}
              {!isBlank(openLeverData?.move) ? (
                <div className={styles.moveBlock}>
                  <p className={styles.move}>{openLeverData?.move}</p>
                  {!isBlank(openLeverData?.why) ? (
                    <p className={styles.why}>{openLeverData?.why}</p>
                  ) : null}
                </div>
              ) : null}
              <div className={styles.drawerGrid}>
                {openIsCall || !isBlank(openLeverData?.status) ? (
                  <div className={styles.dg}>
                    <h5>Where this business stands</h5>
                    {openIsCall ? (
                      <p className={styles.pending}>
                        Found by mapping the workflow, on the call
                      </p>
                    ) : (
                      <p>{openLeverData?.status}</p>
                    )}
                  </div>
                ) : null}
                <div className={styles.dg}>
                  <h5>What the market says</h5>
                  {(feedsBy[openLever] ?? []).length ? (
                    feedsBy[openLever].map((f) => (
                      <p key={f.name}>
                        <span className={styles.who}>{f.name}</span>
                        {f.finding}
                      </p>
                    ))
                  ) : null}
                </div>
                <div className={styles.dg}>
                  <h5>Who pulled it</h5>
                  {(pulledBy[openLever] ?? []).length ? (
                    pulledBy[openLever].map((r, i) => (
                      <p key={`${r.company}-${i}`}>
                        <span className={styles.who}>{r.company}</span>
                        {r["what commands the revenue"]}
                      </p>
                    ))
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {probeEntries.length ? (
            <>
              <p className={styles.part}>
                <span>What the market shows</span>
                <em className={styles.partHint}>
                  Click a finding to light the levers it feeds
                </em>
              </p>
              <div className={styles.probes}>
                {probeEntries.map(([name, p]) => {
                  const codes = leverCodes(p.feeds);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={styles.probe}
                      aria-pressed={litProbe === name}
                      onClick={() => setLitProbe((cur) => (cur === name ? null : name))}
                    >
                      <h4>{name}</h4>
                      <p>{p.finding}</p>
                      {codes.length ? (
                        <p className={styles.feeds}>
                          Feeds<b>{codes.join(" · ")}</b>
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>

        {/* ── 00 ── */}
        <section id="s00" className={styles.section}>
          <div className={styles.head}>
            <span className={styles.num}>02</span>
            <h2>What they do</h2>
          </div>
          <p className={styles.sub}>
            The business in its own terms, then how far the companies ahead of it have gone.
          </p>

          {introCells.length ? (
            <>
              <p className={styles.part}>
                <span>The business</span>
              </p>
              <dl className={styles.fields}>
                {introCells.map((k) => (
                  <Field key={k} label={k} value={partOne[k]} />
                ))}
              </dl>
            </>
          ) : null}

          {rungs.length > 1 ? (
            <>
              <p className={styles.part}>
                <span>How far this game goes</span>
                <em className={styles.partHint}>Companies that started from the same place</em>
              </p>
              <div className={styles.ladder} ref={ladderRef}>
                {rungs.map((r, i) => {
                  const gap = r.self ? null : multiple(selfSize, r.size);
                  return (
                    <div
                      key={`${r.name}-${i}`}
                      className={`${styles.rung} ${r.self ? styles.rungSelf : ""}`}
                    >
                      <div className={styles.rungName}>
                        {r.name}
                        {r.self ? (
                          <small>This business</small>
                        ) : !isBlank(r.commands) ? (
                          <small>{String(r.commands).slice(0, 46)}</small>
                        ) : null}
                      </div>
                      <div className={styles.rungTrack}>
                        <span
                          className={styles.rungBar}
                          style={{
                            width: barsIn ? `${widthOf(r.size as number)}%` : "0%",
                            transitionDelay: `${i * 70}ms`,
                          }}
                        />
                        <span className={styles.rungVal}>{r.val}</span>
                        {gap ? <span className={styles.rungGap}>{gap}</span> : null}
                      </div>
                    </div>
                  );
                })}
                <p className={styles.axis}>
                  Bar length is a log scale on revenue. Figures across currencies are placed at
                  round approximate rates, so the bars are for distance only. Every figure printed
                  is the one in the source.
                </p>
              </div>
            </>
          ) : null}
        </section>

        {/* ── 1B ── */}
        <section id="s1B" className={styles.section}>
          <div className={styles.head}>
            <span className={styles.num}>03</span>
            <h2>Fit and difference</h2>
          </div>
          <p className={styles.sub}>
            Why the buyer keeps choosing them, and what about them does not get copied.
          </p>
          <div className={styles.halves}>
            <div className={styles.half}>
              <div className={styles.halfH}>
                <span>Half one</span>
                <b>Product market fit</b>
              </div>
              <dl className={styles.halfB}>
                {PMF_ORDER.map((k) =>
                  k === "sacrifice" ? (
                    <SacrificeMeter key={k} sacrifice={profile.pmf?.elements?.sacrifice} />
                  ) : (
                    <Element
                      key={k}
                      label={k}
                      value={
                        profile.pmf?.elements?.[
                          k as Exclude<(typeof PMF_ORDER)[number], "sacrifice">
                        ]
                      }
                    />
                  )
                )}
              </dl>
            </div>
            <div className={styles.half}>
              <div className={styles.halfH}>
                <span>Half two</span>
                <b>Innovation</b>
              </div>
              <dl className={styles.halfB}>
                {INNOVATION_ORDER.map((k) => (
                  <Element key={k} label={k} value={profile.innovation?.elements?.[k]} />
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── 02 ── */}
        <section id="s02" className={styles.section}>
          <div className={styles.head}>
            <span className={styles.num}>04</span>
            <h2>Growth execution</h2>
          </div>
          <p className={styles.sub}>This section is written with you, not about you.</p>
          {showGe ? (
            <>
              <WorkflowMap workflows={ge?.workflows} />
              <ValueCondition vc={ge?.valueCondition} />
              <Opportunities items={ge?.opportunities} />
              <Tests items={ge?.highVelocityTests} />
              <div className={styles.next}>
                <h3>What we do on the call</h3>
                <p className={styles.nextLead}>
                  Everything above was read from the outside. The terms marked as yours are the
                  ones that turn each opportunity into a decision, and they are the reason to put
                  an hour in the diary.
                </p>
              </div>
            </>
          ) : (
            <div className={styles.next}>
              <h3>What we do on the call</h3>
              <p className={styles.nextLead}>
                Everything above was read from the outside. The execution work needs what only you
                can see: how the work actually moves through the business, and where it stops.
              </p>
              <ol>
                <li>Map the workflow end to end, which is the one place M2 can be answered.</li>
                <li>Name the constraint, and show its arithmetic against one EBITDA term.</li>
                <li>Design the test: a bound, a metric, and the rule that decides what happens next.</li>
              </ol>
            </div>
          )}
          {!isBlank(intro.close) ? <p className={styles.close}>{intro.close}</p> : null}
        </section>

        {/* ── 03 ── */}
        <section id="s03" className={styles.section}>
          <div className={styles.head}>
            <span className={styles.num}>05</span>
            <h2>What we read</h2>
          </div>
          <p className={styles.sub}>
            Every figure on this page, with where it came from and when it was true.
          </p>
          {recordBlocks.map(([label, rows]) =>
            rows && rows.length ? (
              <div key={label}>
                <h4 className={styles.recH}>{label}</h4>
                <RecordTable rows={rows} />
              </div>
            ) : null
          )}
        </section>

        {/* ── 04, only when a reader asked for one ── */}
        <Annexure annexure={profile.annexure} />

        {/* WHAT WE LOOKED FOR AND DID NOT FIND.
            
            Every gap on this page is dropped rather than printed as "unknown" —
            gates 18 and 26 forbid absence vocabulary anywhere a reader can see,
            and a hole in the middle of the page undoes the thing the page exists
            to do. But dropping it silently means an owner reading a short section
            cannot tell whether we looked.
            
            So the gaps are collected once, at the end, behind a control he opens
            only if he wants it. Closed by default: this is apparatus, not the
            document. */}
        {gaps.length ? (
          <section className={styles.gaps}>
            <button
              type="button"
              className={styles.gapsToggle}
              aria-expanded={gapsOpen}
              onClick={() => setGapsOpen((v) => !v)}
            >
              What we looked for and did not find
              <span className={styles.gapsCount}>{gaps.length}</span>
            </button>
            {gapsOpen ? (
              <div className={styles.gapsBody}>
                <p>
                  These are the things we went looking for on {profile.company} and could not
                  source from outside. They are left out above rather than guessed at. If any of
                  them matters, it is a question for the call.
                </p>
                <ul>
                  {gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className={styles.footer}>
          <span>{profile.segmentRef}</span>
          <span>DeepThought · PDGMS</span>
        </footer>
      </main>
    </div>
  );
}

function LeverTile({
  code,
  lever,
  feeds,
  open,
  lit,
  onToggle,
}: {
  code: string;
  lever?: { inThisModel?: string; status?: string };
  feeds: number;
  open: boolean;
  lit: boolean;
  onToggle: () => void;
}) {
  // Same rule as the drawer: M2 is on the call by identity, not by data.
  const isCall =
    code === "M2" || String(lever?.status ?? "").trim().toLowerCase() === WORKFLOW_MAP;
  return (
    <button
      type="button"
      className={`${styles.tile} ${lit ? styles.tileLit : ""}`}
      aria-expanded={open}
      onClick={onToggle}
    >
      <span className={styles.tileCode}>{code}</span>
      <span className={styles.tileName}>{LEVER_NAME[code]}</span>
      {feeds ? <span className={styles.tileFeed}>{feeds}</span> : null}
      <span className={styles.tileState}>
        <i className={`${styles.dot} ${isCall ? styles.dotCall : ""}`} />
        {isCall ? "On the call" : "Read from outside"}
      </span>
    </button>
  );
}
