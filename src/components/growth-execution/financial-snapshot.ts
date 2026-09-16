// Reading the financial snapshot sentence into figures the page can draw.
//
// The snapshot is stored as prose, and across the corpus it takes every shape:
// an exact filed figure, a registry band ("between ₹10 crore and ₹50 crore"), a
// ceiling ("less than ₹10 Cr"), a parent company's or a subsidiary's numbers, a
// prior year set against the current one, a derived proxy. Drawing any of those
// as a large confident number would state something the sentence does not.
//
// So this reader is deliberately narrow. It takes a figure only when a named
// label states it plainly, for this company, for the same year as the revenue,
// with no hedge in front of it. Anything else is left unread: the page then
// draws fewer tiles, or none, and the sentence itself is always printed under
// the drawing as the record. Every number the page prints is the substring the
// sentence carries, never reformatted and never computed. Proportions (bar and
// ring lengths) are the only arithmetic, and they print nothing.

export interface Amount {
  /** Exactly as written, e.g. "Rs", "₹", "INR", "$". */
  currency: string;
  /** Exactly as written, e.g. "1,200.0". */
  number: string;
  /** Exactly as written, e.g. "crore", "Cr", "million"; empty when none. */
  unit: string;
  /** Parsed, for proportions only. */
  value: number;
}

export interface Percent {
  label: string;
  /** Exactly as written, without the % sign, e.g. "36.0". */
  number: string;
  value: number;
  /** The same measure a year earlier, where the sentence states it. */
  prior?: string;
}

export interface SnapshotReading {
  period?: string;
  revenueLabel?: string;
  revenue?: Amount;
  growth?: { direction: "up" | "down"; number: string };
  ebitda?: Amount;
  pat?: Amount;
  loss?: Amount;
  netDebt?: Amount;
  percents: Percent[];
}

const CUR = String.raw`(Rs\.?|INR|₹|US\$|USD|\$|EUR|€|GBP|£|CHF)`;
const NUM = String.raw`(\d[\d,]*(?:\.\d+)?)`;
const UNIT = String.raw`(crore|cr|lakh|million|mn|billion|bn)?\b`;
const AMOUNT = String.raw`${CUR}\s?${NUM}\s*${UNIT}`;
const PERIOD =
  /\b(FY\s?\d{2,4}|(?:fiscal|financial) year (?:ending [A-Za-z0-9 ,]*?)?\d{4}|\d{4} (?:fiscal|financial) year)/i;
const PERIOD_ALL = new RegExp(PERIOD.source, "gi");

/** A part of a year. A quarter's revenue drawn as the year's is wrong by 4x. */
const PART_YEAR = /\b(Q[1-4]|first (?:nine|six|three) months|nine months|half[- ]year|H[12])\b/i;

/** Words that make a figure a range, a bound, an estimate or somebody else's. */
const HEDGE =
  /\b(between|less than|under|over|below|above|up to|not exceeded|falls in|band|range|approximately|about|around|roughly|nearly|estimate|estimated|proxy|derived|objective|target|run rate|parent|subsidiary|group|pitch|valued|funding|raised)\b/i;

function toValue(n: string): number {
  return parseFloat(n.replace(/,/g, ""));
}

function amountFrom(m: RegExpMatchArray, at: number): Amount {
  return { currency: m[at], number: m[at + 1], unit: m[at + 2] ?? "", value: toValue(m[at + 1]) };
}

/** Sentences, without splitting "1,200.0" or "Rs." on their dots. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.;])\s+(?=[A-Z₹$])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function periodOf(s: string): string | undefined {
  return s.match(PERIOD)?.[1];
}

/** The figure is the start of a range: "Rs 25 to 50 crore", "INR 25-50 crore band". */
function opensRange(s: string, end: number): boolean {
  const next = s.slice(end, end + 40);
  return /^\s*(?:to|-|–)\s*(?:Rs\.?|INR|₹|\$)?\s*\d/i.test(next) || /^[^.;]{0,25}\b(band|range)\b/i.test(next);
}

/**
 * Whether a figure found at `at` in sentence `s` belongs to the revenue's year.
 *
 * The nearest year named before the figure decides. "FY25 revenue Rs 640 crore,
 * against FY24 revenue of Rs 470 crore and a net loss of Rs 114.4 crore": the
 * loss sits after FY24, so it is FY24's, and is refused beside FY25 revenue.
 * With no year before it, a figure is the current year's unless an "against"
 * came first, which is how every snapshot introduces the prior year.
 */
function inYear(s: string, at: number, period: string | undefined): boolean {
  const lead = s.slice(0, at);
  if (PART_YEAR.test(lead)) return false;
  const named = [...lead.matchAll(PERIOD_ALL)].map((m) => m[1]);
  const last = named[named.length - 1];
  if (last) {
    if (!period) return false;
    return last.replace(/\s/g, "").toLowerCase() === period.replace(/\s/g, "").toLowerCase();
  }
  return !/\bagainst\b/i.test(lead);
}

function findRevenue(text: string) {
  const label = String.raw`(revenue from operations|operating revenue|total revenue|total income|net sales|revenue|turnover)`;
  // "FY2026 revenue Rs 1,200.0 crore", "revenue of ₹387 crore", "revenue was INR 134.36 crore"
  const before = new RegExp(String.raw`${label}\b([^.;%]{0,28}?)\s${AMOUNT}`, "i");
  // "₹98.97 crore in revenue", "₹53.03 crore in revenue for FY25"
  const after = new RegExp(String.raw`${AMOUNT}\s+(?:in\s+)?(?:annual\s+)?${label}\b`, "i");

  for (const s of sentences(text)) {
    const b = s.match(before);
    if (b && b.index !== undefined) {
      const lead = s.slice(0, b.index);
      const end = b.index + b[0].length;
      if (
        !HEDGE.test(lead) &&
        !HEDGE.test(b[2]) &&
        !PART_YEAR.test(lead) &&
        !/\bagainst\b/i.test(lead) &&
        !opensRange(s, end)
      ) {
        return { sentence: s, label: b[1], amount: amountFrom(b, 3), end };
      }
    }
    const a = s.match(after);
    if (a && a.index !== undefined) {
      const lead = s.slice(0, a.index);
      const end = a.index + a[0].length;
      if (!HEDGE.test(lead) && !PART_YEAR.test(lead) && !/\bagainst\b/i.test(lead)) {
        return { sentence: s, label: a[4], amount: amountFrom(a, 1), end };
      }
    }
  }
  return null;
}

/** Revenue growth: the clause right after the revenue figure, and nothing further. */
function findGrowth(tail: string) {
  // Stop at the next measure, so "EBITDA growth of 69.6%" is never read as revenue's.
  const clause = tail.split(/\b(EBITDA|PAT|profit|margin|net|income|loss|order|market|with)\b/i)[0];
  if (/\b(prior year|year before|previous year)\b/i.test(clause)) return undefined;
  const up = clause.match(new RegExp(String.raw`\b(up|down)\s+${NUM}%`, "i"));
  if (up) return { direction: up[1].toLowerCase() as "up" | "down", number: up[2] };
  const noun = clause.match(
    new RegExp(
      String.raw`\b${NUM}%\s+(?:year[- ](?:on|over)[- ]year\s+|YoY\s+)?(increase|growth|rise|decrease|decline)`,
      "i"
    )
  );
  if (noun) return { direction: /decrease|decline/i.test(noun[2]) ? ("down" as const) : ("up" as const), number: noun[1] };
  const of = clause.match(new RegExp(String.raw`\b(increase|decrease) of\s+${NUM}%`, "i"));
  if (of) return { direction: of[1].toLowerCase() === "decrease" ? ("down" as const) : ("up" as const), number: of[2] };
  return undefined;
}

/** The first plainly stated amount for a label, in a sentence of the right year. */
function findAmount(text: string, label: string, period: string | undefined): Amount | undefined {
  const re = new RegExp(String.raw`(?:^|[^A-Za-z])(?:${label})\s+(?:of\s+|was\s+|at\s+)?${AMOUNT}`, "i");
  for (const s of sentences(text)) {
    const m = s.match(re);
    if (!m || m.index === undefined) continue;
    if (HEDGE.test(s.slice(0, m.index + m[0].length))) continue;
    if (!inYear(s, m.index, period)) continue;
    if (opensRange(s, m.index + m[0].length)) continue;
    return amountFrom(m, 1);
  }
  return undefined;
}

interface PercentSpec {
  label: string;
  /** Forms where the label comes first: "gross margin 36.0%". */
  lead: string;
  /** Forms where the figure comes first: "an 18% EBITDA margin". */
  trail?: string;
}

// Priority order: the first three found become rings.
const PERCENTS: PercentSpec[] = [
  { label: "Gross margin", lead: "gross margin" , trail: "gross margin" },
  { label: "EBITDA margin", lead: String.raw`EBITDA margin|EBITDA [^;%]{0,40}?\bat(?: an?)?`, trail: "EBITDA margin" },
  { label: "Operating margin", lead: "operating margin", trail: "operating margin" },
  { label: "PAT margin", lead: String.raw`PAT margin|net profit margin|net margin`, trail: String.raw`PAT margin|net profit margin|net margin` },
  { label: "ROCE", lead: "ROCE" },
  { label: "ROE", lead: String.raw`ROE|return on equity` },
];

function findPercent(text: string, spec: PercentSpec, period: string | undefined): Percent | undefined {
  const lead = new RegExp(
    String.raw`(?:^|[^A-Za-z])(?:${spec.lead})\s*(?:of\s+|was\s+|at\s+|is\s+|:\s*)?(-?${NUM.slice(1, -1)})%(?![\d]|\s*[–-]\s*\d)`,
    "i"
  );
  const trail = spec.trail
    ? new RegExp(String.raw`(-?${NUM.slice(1, -1)})%\s+(?:${spec.trail})\b`, "i")
    : null;
  for (const s of sentences(text)) {
    const m = s.match(lead) ?? (trail ? s.match(trail) : null);
    if (!m || m.index === undefined) continue;
    if (!inYear(s, m.index, period)) continue;
    const upto = s.slice(Math.max(0, m.index - 18), m.index + m[0].length);
    if (/\b(approximately|about|around|roughly|nearly|~)\b/i.test(upto)) continue;
    const value = parseFloat(m[1]);
    if (!isFinite(value)) continue;
    const rest = s.slice(m.index + m[0].length);
    const prior = rest.match(
      new RegExp(String.raw`^,?\s*against\s+(-?${NUM.slice(1, -1)})%\s+(?:the year before|a year earlier|last year|in FY\s?\d{2,4})`, "i")
    );
    return { label: spec.label, number: m[1], value, prior: prior?.[1] };
  }
  return undefined;
}

function sameScale(a: Amount, b: Amount): boolean {
  const cur = (c: string) => (/^(Rs\.?|INR|₹)$/i.test(c) ? "INR" : c.toUpperCase());
  const unit = (u: string) => (/^(cr|crore)$/i.test(u) ? "crore" : /^(mn|million)$/i.test(u) ? "million" : /^(bn|billion)$/i.test(u) ? "billion" : u.toLowerCase());
  return cur(a.currency) === cur(b.currency) && unit(a.unit) === unit(b.unit);
}

export function readSnapshot(text: string | undefined): SnapshotReading {
  const reading: SnapshotReading = { percents: [] };
  const s = String(text ?? "").trim();
  if (!s) return reading;

  // A snapshot that gives revenue as a range anywhere, or says a figure is the
  // last one on record, is about an older or an unknown exact year. Its one
  // exact figure would be drawn as current when the sentence says it is not.
  const revenueHedged = sentences(s).some(
    (x) =>
      /\b(revenue|turnover|income|sales)\b/i.test(x) &&
      (/\b(between|band|range|less than|under|not exceeded|falls in|up to)\b/i.test(x) || /\blast\b/i.test(x))
  );
  const rev = revenueHedged ? null : findRevenue(s);
  const period = rev ? periodOf(rev.sentence) : periodOf(s);
  if (rev) {
    reading.revenue = rev.amount;
    reading.revenueLabel = rev.label;
    reading.period = periodOf(rev.sentence);
    reading.growth = findGrowth(rev.sentence.slice(rev.end));
  }

  const ebitda = findAmount(s, String.raw`adjusted EBITDA|operational EBITDA|EBITDA`, period);
  const pat = findAmount(s, String.raw`adjusted PAT|PAT|profit after tax|net profit|net income`, period);
  const loss = findAmount(s, String.raw`net loss|loss after tax`, period);
  const netDebt = findAmount(s, "net debt", period);

  // Amounts are drawn against revenue, so they must be on its scale and smaller
  // than it. Anything else is dropped rather than drawn wrong.
  const fits = (a?: Amount) => !!a && !!reading.revenue && sameScale(a, reading.revenue) && a.value > 0 && a.value <= reading.revenue.value;
  if (fits(ebitda)) reading.ebitda = ebitda;
  if (fits(pat)) reading.pat = pat;
  if (loss) reading.loss = loss;
  if (netDebt) reading.netDebt = netDebt;

  for (const spec of PERCENTS) {
    const p = findPercent(s, spec, period);
    if (p) reading.percents.push(p);
  }
  return reading;
}

/** Enough was read to draw something worth drawing. */
export function isDrawable(r: SnapshotReading): boolean {
  return !!r.revenue || r.percents.filter((p) => p.value >= 0 && p.value <= 100).length >= 2;
}
