// The Growth Execution Profile, as the generator writes it.
//
// Mirrors the JSON emitted by the generator in the AI Shell repo
// (programs/dt-ICP-publicprofile/generator/lib/batch.js) and validated there by
// a 32-test suite before it is ever stored. This file is the shape the renderer
// consumes, and it is deliberately tolerant: every field is optional, because a
// profile is allowed to have nothing behind an element and the page must render
// what exists rather than announce what does not.
//
// The keys are English phrases with spaces because the ontology names them that
// way, and keeping the ontology's own words in the data means the renderer never
// has to hold a translation table between what was researched and what is shown.

/** A row in the exemplar table: a company that already reached a position. */
export interface GrowthExecutionExemplar {
  company?: string;
  "proof the market is there"?: string;
  revenue?: string;
  "started as"?: string;
  "what commands the revenue"?: string;
  /** "V1, M3" or ["V1","M3"] — the EBITDA levers that move it. */
  "growth levers"?: string | string[];
  /** Home country. Two of a profile's exemplars must be outside India. */
  country?: string;
}

/** One of the six EBITDA levers, read against this business. */
export interface GrowthExecutionLever {
  /** What this lever means for this business model. */
  inThisModel?: string;
  /**
   * What was found. M2 carries the literal phrase "workflow map": a lower
   * variable cost is located by mapping the workflow, which happens on the call,
   * so it is the one lever no outside reading can answer.
   */
  status?: string;
  /**
   * What to do. The point of the cell, added 2026-09-01.
   *
   * Until then a lever carried only `inThisModel` and `status`, both of which
   * describe. There was nowhere to put an answer, so every lever read as an
   * observation the owner already had. `move` names an instrument at the
   * granularity a decision is taken at: what is done, to what.
   */
  move?: string;
  /** Why that move produces business. Somebody else's number, not our opinion. */
  why?: string;
  /** The research-record row the move rests on. No precondition, no move. */
  precondition?: string;
}

export interface GrowthExecutionProbe {
  finding?: string;
  /** Which levers this finding feeds. */
  feeds?: string[];
}

/** What the buyer gives up to keep choosing. Tier A is the strongest. */
export interface GrowthExecutionSacrifice {
  text?: string;
  /** Money, time, future optionality, leverage, flexibility, effort, reputation. */
  currency?: string;
  tier?: string;
}

export interface GrowthExecutionResearchRow {
  fact?: string;
  value?: string;
  source?: string;
  asOf?: string;
  /** True on a figure we computed from two sourced numbers. */
  derived?: boolean;
}

export interface GrowthExecutionContract {
  company?: string;
  segmentRef?: string;

  intro?: {
    /** Fixed opening sentence, reproduced verbatim by the generator. */
    frame?: string;
    /** Nine named cells: financial snapshot, capacity, capability, offer, buyer,
     *  monetization, pricing power, position, growth initiatives. */
    partOne?: Record<string, string>;
    partTwo?: GrowthExecutionExemplar[];
    /** Fixed closing ask. */
    close?: string;
  };

  market?: {
    /** b2c | b2b_finished | b2b_deep_chain | b2b_services. */
    model?: string;
    /** Which half of the board leads. See LeverLead. Absent means volume. */
    leadWith?: LeverLead;
    levers?: Record<string, GrowthExecutionLever>;
    /** Six probes, named by the business model. */
    probes?: Record<string, GrowthExecutionProbe>;
  };

  pmf?: {
    elements?: {
      "buyer set"?: string;
      job?: string;
      alternative?: string;
      offer?: string;
      sacrifice?: GrowthExecutionSacrifice;
      direction?: string;
    };
  };

  innovation?: {
    elements?: {
      locus?: string;
      "the difference"?: string;
      "the contrast"?: string;
      "the moat"?: string;
      evidence?: string;
      magnitude?: string;
    };
  };

  researchRecord?: {
    company?: GrowthExecutionResearchRow[];
    market?: GrowthExecutionResearchRow[];
    regulation?: GrowthExecutionResearchRow[];
    exemplars?: GrowthExecutionResearchRow[];
    derived?: GrowthExecutionResearchRow[];
  };

  /**
   * Section 2, Growth Execution. Absent on every profile generated before
   * 2026-08, which is why it is optional and why section 02 keeps its
   * what-happens-on-the-call copy as the fallback.
   */
  growthExecution?: GrowthExecutionSection;

  /**
   * An optional appendix answering questions a specific reader asked. It is not
   * part of the ontology and carries no gates, so it renders last and says
   * where each figure came from.
   */
  annexure?: GrowthExecutionAnnexure;
}

/**
 * One horizontal of the workflow map. A step with no published rate cannot host
 * a constraint (ontology 2.1), so it is marked generic and the page shows it as
 * a step we could not price from outside rather than a finding.
 */
export interface GrowthExecutionWorkflow {
  step?: string;
  artefacts?: string[];
  priceSetBy?: string;
  /** The name of the rate this step is measured by. */
  rate?: string;
  /** The rate itself, where it is public. Empty means no constraint may sit here. */
  rateValue?: string;
  stepsTier?: string;
  flags?: { generic?: boolean };
}

/** A constraint stated as stored EBITDA (ontology 2.2). */
export interface GrowthExecutionOpportunity {
  id?: string;
  binding?: boolean;
  family?: string;
  /** margin | velocity, for the renderer and the directory filters. */
  lever?: string;
  constraint?: string;
  /** Which of the four EBITDA terms relief moves. */
  ebitdaTerm?: string;
  arithmetic?: string;
  reliefCost?: string;
  lede?: string;
}

/** One test per opportunity, with the bound, the metric and the decision rule. */
export interface GrowthExecutionHvt {
  forOpportunity?: string;
  class?: string;
  bound?: string;
  metric?: string;
  decisionRule?: string;
  readsOut?: string;
}

/** One term of the value condition, and who holds it. */
export interface GrowthExecutionValueTerm {
  term?: string;
  meaning?: string;
  /** The value where it is public. Empty means the company holds it. */
  known?: string;
  held_by?: string;
}

/**
 * The arithmetic that decides whether growth here creates value. Filling
 * capacity is not the same as earning the cost of capital, so the page states
 * the condition and names which terms only the company can supply.
 */
export interface GrowthExecutionValueCondition {
  why?: string;
  expression?: string;
  terms?: GrowthExecutionValueTerm[];
  reading?: string;
  counterEvidence?: string;
}

export interface GrowthExecutionSection {
  workflows?: Record<string, GrowthExecutionWorkflow>;
  opportunities?: GrowthExecutionOpportunity[];
  highVelocityTests?: GrowthExecutionHvt[];
  valueCondition?: GrowthExecutionValueCondition;
}

/** A block of the annexure: a heading, prose, and optional rows. */
export interface GrowthExecutionAnnexureBlock {
  heading?: string;
  body?: string;
  rows?: GrowthExecutionResearchRow[];
}

export interface GrowthExecutionAnnexure {
  title?: string;
  /** Who asked, and what for. Renders as the standfirst. */
  preface?: string;
  blocks?: GrowthExecutionAnnexureBlock[];
}

/** Display order of the nine intro cells. */
export const INTRO_ORDER = [
  "financial snapshot",
  "capacity",
  "capability",
  "offer",
  "buyer",
  "monetization",
  "pricing power",
  "position",
  "growth initiatives",
] as const;

/** The three the hero carries: what they earn, what they run, what protects it. */
export const HERO_CELLS = ["financial snapshot", "capacity", "position"] as const;

export const PMF_ORDER = [
  "buyer set",
  "job",
  "alternative",
  "offer",
  "sacrifice",
  "direction",
] as const;

export const INNOVATION_ORDER = [
  "locus",
  "the difference",
  "the contrast",
  "the moat",
  "evidence",
  "magnitude",
] as const;

/** The five rows every exemplar must carry, beside its name. */
export const EXEMPLAR_ROWS = [
  "proof the market is there",
  "revenue",
  "started as",
  "what commands the revenue",
  "growth levers",
] as const;

/**
 * What we looked for on this company and did not find.
 *
 * Tarun, 2026-09-04. A missing value is dropped from the page rather than
 * printed as "unknown" — that rule is older than this and enforced by gates 18
 * and 26, which forbid absence vocabulary anywhere a reader can see. The effect
 * was that a gap became invisible, and an owner reading a short section could
 * not tell whether we had looked.
 *
 * So the gaps are collected here and offered at the end, once, behind a control
 * he opens if he wants it. Never beside the field, which would put a hole in the
 * middle of a page that is meant to show we understood his business.
 *
 * Derived, not declared. Every section it walks is a FIXED enumeration the
 * contract mandates in full: nine intro cells, six PMF elements, six innovation
 * elements, five rows per exemplar. A key absent from one of those is absent
 * because nothing was found, not because it did not apply — which is what makes
 * the list honest without the generator having to write it down.
 */
export function missingFields(p: GrowthExecutionContract): string[] {
  const gaps: string[] = [];
  const intro = p.intro ?? {};
  const partOne = intro.partOne ?? {};
  for (const k of INTRO_ORDER) if (isBlank(partOne[k])) gaps.push(`What they do — ${k}`);

  const pmf = p.pmf?.elements ?? {};
  for (const k of PMF_ORDER) {
    const v = pmf[k as keyof typeof pmf];
    // `sacrifice` is an object carrying its own text; blank means no text in it.
    const empty = k === "sacrifice"
      ? isBlank((v as GrowthExecutionSacrifice | undefined)?.text)
      : isBlank(v as string | undefined);
    if (empty) gaps.push(`Fit — ${k}`);
  }

  const inn = p.innovation?.elements ?? {};
  for (const k of INNOVATION_ORDER) {
    if (isBlank(inn[k as keyof typeof inn] as string | undefined)) gaps.push(`Difference — ${k}`);
  }

  for (const x of intro.partTwo ?? []) {
    if (isBlank(x?.company)) continue;
    for (const k of EXEMPLAR_ROWS) {
      if (isBlank(x[k as keyof typeof x] as string | undefined)) gaps.push(`${x.company} — ${k}`);
    }
  }
  return gaps;
}

export const LEVER_KEYS = ["v1", "v2", "v3", "m1", "m2", "m3"] as const;

/**
 * Which half of the board leads: volume (V1-V3) or margin (M1-M3).
 *
 * The levers are not equal, and which one matters is a fact about THIS business.
 * Volume creates value only when the incremental rupee earns above its cost of
 * capital, and every V lever consumes capital before it pays: stock bought ahead,
 * units in the field, bid deposits. The M levers move margin on capital already
 * employed. So for a business earning below its cost of capital the M levers ARE
 * the value levers, and opening on "more buyers" tells that owner to spend more
 * money worse.
 *
 * BEW is the case that forced this: revenue up 38% while EBITDA halved, ROCE 4.43%,
 * and its section still led with V1.
 *
 * Declared by the generator, which holds the filed figures, rather than guessed here
 * out of prose. Absent means volume, which is the order every profile shipped with.
 */
export type LeverLead = "volume" | "margin";

export const LEVER_NAME: Record<string, string> = {
  V1: "More buyers",
  V2: "More share of each buyer",
  V3: "More applications per buyer",
  M1: "A higher price",
  M2: "A lower variable cost",
  M3: "A better mix",
};

export const MODEL_LABEL: Record<string, string> = {
  b2c: "Consumer",
  b2b_finished: "Business, finished product",
  b2b_deep_chain: "Business, inside the chain",
  b2b_services: "Business, services",
};

/** M2 is answered by mapping the workflow, which only happens on the call. */
export const WORKFLOW_MAP = "workflow map";

/** Display order of the five workflow horizontals, top of the funnel last. */
export const HORIZONTAL_ORDER = [
  "h5_offers",
  "h4_capability",
  "h3_capacity",
  "h2_customer_experience",
  "h1_orders",
] as const;

export const HORIZONTAL_LABEL: Record<string, string> = {
  h5_offers: "H5 Offers",
  h4_capability: "H4 Capability",
  h3_capacity: "H3 Capacity",
  h2_customer_experience: "H2 Customer experience",
  h1_orders: "H1 Orders",
};

/** Does section 2 carry anything worth rendering? */
export function hasGrowthExecution(s?: GrowthExecutionSection): boolean {
  if (!s) return false;
  return Boolean(
    (s.opportunities && s.opportunities.length) ||
      (s.highVelocityTests && s.highVelocityTests.length) ||
      (s.workflows && Object.keys(s.workflows).length) ||
      (s.valueCondition && !isBlank(s.valueCondition.expression)),
  );
}

/** Does the annexure carry anything worth rendering? */
export function hasAnnexure(a?: GrowthExecutionAnnexure): boolean {
  return Boolean(a && a.blocks && a.blocks.some((b) => !isBlank(b.heading) || !isBlank(b.body) || (b.rows && b.rows.length)));
}

export const isBlank = (v: unknown): boolean =>
  v === null || v === undefined || String(v).trim() === "";

/** The lever codes inside a value, however the generator wrote them. */
export function leverCodes(v: string | string[] | undefined): string[] {
  const parts = Array.isArray(v) ? v : String(v ?? "").split(/[,\s]+/);
  return parts
    .map((c) => String(c).trim().toUpperCase())
    .filter((c) => /^[VM][123]$/.test(c));
}

/* ── revenue to a comparable size ──────────────────────────────────────────
 * The original string is always what is printed; this only sets bar length,
 * and the axis says the rates are approximate.
 *
 * A snapshot sentence carries several figures and they are not interchangeable.
 * "Rs 4,571 cr revenue ... market capitalisation Rs 19,845 cr" must read as
 * 4,571: taking the largest put market cap on the chart and shrank the very gap
 * the chart exists to show. So each figure is judged by the words before it. */
/*
 * A currency missing from this table is not ignored, it is silently read as
 * rupees, and the bar and the multiple are then wrong by roughly the exchange
 * rate. Bystronic's CHF 613.2 million rendered as Rs 61 crore and told a Rs 50
 * crore reader that a Swiss machine builder was 1.2 times his size. Alfa Laval
 * in kronor and Croda in pounds went the same way.
 *
 * So the exemplar set decides this list: any currency an exemplar reports in has
 * to be here before that exemplar can go on a page.
 */
export const FX: Record<string, number> = {
  inr: 1,
  rmb: 12,
  eur: 95,
  usd: 84,
  gbp: 112,
  chf: 100,
  sek: 8.8,
  jpy: 0.57,
  // NT$ carries a dollar sign, so it must be tested before USD or every Taiwanese
  // figure lands on the dollar rate and reads about thirty times too large.
  twd: 2.7,
  // The won runs about a thousand to the rupee's sixty, so an unlisted won reads
  // as rupees and draws a Korean food group at sixteen times its real size.
  krw: 0.061,
};
const WANT = /(revenue|turnover|sales|output value|top ?line)[^.]{0,26}$/i;
/*
 * A figure belonging to somebody else. The parent's merger size sat in Huntsman
 * India's snapshot and was read as the company's own, putting a Rs 1,296 crore
 * business on the chart at Rs 108,870 crore.
 */
const NOT =
  /(capitalisation|capitalization|market cap|funding|raised|valuation|ebitda|pat\b|profit|net income|margin|order book|backlog|merger|merging|combin\w*|parent|group\b)[^.]{0,26}$/i;

/**
 * Which currency a figure is in, judged by the words immediately before it.
 *
 * This used to be decided once for the whole sentence, and that was wrong in a
 * way nothing caught. Huntsman India's snapshot reads "revenue of Rs 1,296.07
 * crore ... the parent is combining with Olin to form a group above USD 12
 * billion". One "USD" anywhere put every figure in the sentence on the dollar
 * rate, so the company's own Rs 1,296 crore was drawn on the chart at Rs 108,870
 * crore. A snapshot naming two currencies is normal; one rate for all of them is
 * not.
 */
function currencyNear(s: string, at: number): string {
  const near = s.slice(Math.max(0, at - 16), at);
  if (/RMB|CNY|¥/i.test(near)) return "rmb";
  if (/\bSEK\b|\bkronor\b/i.test(near)) return "sek";
  if (/\bCHF\b|Swiss franc/i.test(near)) return "chf";
  if (/\bGBP\b|£/i.test(near)) return "gbp";
  if (/NT\$|\bTWD\b|\bNTD\b/i.test(near)) return "twd";
  if (/\bKRW\b|₩|\bwon\b/i.test(near)) return "krw";
  if (/\bJPY\b|\byen\b/i.test(near)) return "jpy";
  if (/EUR|€/i.test(near)) return "eur";
  if (/USD|\$/i.test(near)) return "usd";
  if (/\bRs\b|\bINR\b|₹/i.test(near)) return "inr";
  // Nothing adjacent: fall back to whatever the sentence names, then rupees.
  if (/RMB|CNY|¥/i.test(s)) return "rmb";
  if (/\bSEK\b|\bkronor\b/i.test(s)) return "sek";
  if (/\bCHF\b|Swiss franc/i.test(s)) return "chf";
  if (/\bGBP\b|£/i.test(s)) return "gbp";
  if (/NT\$|\bTWD\b|\bNTD\b/i.test(s)) return "twd";
  if (/\bKRW\b|₩|\bwon\b/i.test(s)) return "krw";
  if (/\bJPY\b|\byen\b/i.test(s)) return "jpy";
  if (/EUR|€/i.test(s)) return "eur";
  if (/USD|\$/i.test(s)) return "usd";
  return "inr";
}

export function toCrore(text: string | undefined): number | null {
  const s = String(text ?? "");
  const matches = [...s.matchAll(/([\d,]+(?:\.\d+)?)\s*(tn\b|trillion|bn|billion|B\b|mn|million|cr\b|crore|lakh)/gi)];
  let best: number | null = null;
  let bestScore = -99;
  for (const m of matches) {
    const n = parseFloat(m[1].replace(/,/g, ""));
    if (!isFinite(n) || n === 0) continue;
    const u = (m[2] || "").toLowerCase();
    let crore: number;
    if (u === "tn" || u === "trillion") crore = n * 100000;
    else if (u === "bn" || u === "billion" || u === "b") crore = n * 100;
    else if (u === "mn" || u === "million") crore = n * 0.1;
    else if (u === "cr" || u === "crore") crore = n;
    else if (u === "lakh") crore = n / 100;
    else continue;
    const at = m.index ?? 0;
    const before = s.slice(0, at);
    const score = NOT.test(before) ? -1 : WANT.test(before) ? 2 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = crore * FX[currencyNear(s, at)];
    }
  }
  return best;
}

export function multiple(self: number | null, other: number | null): string | null {
  if (!self || !other || other <= self) return null;
  const x = other / self;
  return x >= 10 ? `${Math.round(x)}×` : `${x.toFixed(1)}×`;
}

