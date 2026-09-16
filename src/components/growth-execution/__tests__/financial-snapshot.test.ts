/**
 * The snapshot reader: what it draws, and what it refuses to draw.
 *
 * The page prints these figures as large confident numbers, so a misread is
 * the worst failure it can have. Each refusal below is a shape that was misread
 * on the first pass over the real corpus. The sentences here are invented, in
 * those shapes, because this repository is public.
 */

import { isDrawable, readSnapshot } from "../financial-snapshot";

const FULL =
  "FY2026 revenue Rs 1,200.0 crore, up 9.0%. Gross margin 36.0%. EBITDA Rs 120.0 crore at 10.0%, against 10.4% the year before. PAT Rs 30.0 crore. Net debt Rs 20.0 crore. ROCE 10.0%.";

describe("readSnapshot reads a plain snapshot", () => {
  const r = readSnapshot(FULL);

  it("keeps every figure exactly as written", () => {
    expect(r.revenue).toMatchObject({ currency: "Rs", number: "1,200.0", unit: "crore" });
    expect(r.period).toBe("FY2026");
    expect(r.growth).toEqual({ direction: "up", number: "9.0" });
    expect(r.ebitda?.number).toBe("120.0");
    expect(r.pat?.number).toBe("30.0");
    expect(r.netDebt?.number).toBe("20.0");
  });

  it("reads margins and returns, with the prior year where stated", () => {
    expect(r.percents.map((p) => [p.label, p.number, p.prior])).toEqual([
      ["Gross margin", "36.0", undefined],
      ["EBITDA margin", "10.0", "10.4"],
      ["ROCE", "10.0", undefined],
    ]);
  });

  it("is drawable", () => {
    expect(isDrawable(r)).toBe(true);
  });
});

describe("readSnapshot refuses what it cannot place", () => {
  it("does not read a band as an exact figure", () => {
    expect(readSnapshot("FY2024 operating revenue falls in the Rs 30 to 60 crore band.").revenue).toBeUndefined();
    expect(readSnapshot("FY2024 operating revenue falls in the INR 30-60 crore band.").revenue).toBeUndefined();
    expect(readSnapshot("Revenue was between ₹10 crore and ₹40 crore for FY25.").revenue).toBeUndefined();
  });

  it("does not draw an older exact figure when the sentence gives a newer range", () => {
    const r = readSnapshot(
      "The registry places FY25 revenue in the Rs 90 crore to Rs 140 crore band. The last exact figure on the public record is FY23 operating revenue of Rs 81.2 crore."
    );
    expect(r.revenue).toBeUndefined();
  });

  it("does not read a quarter as the year", () => {
    const r = readSnapshot(
      "The group reported FY26 revenue of Rs 180.5 billion, up 11%. Q1 FY27 revenue was Rs 50.1 billion, up 14%."
    );
    expect(r.revenue).toBeUndefined();
  });

  it("does not give a prior year's loss to the current year's revenue", () => {
    const r = readSnapshot(
      "FY25 revenue Rs 520 crore, up 20%, against FY24 revenue of Rs 433 crore and a net loss of Rs 88.1 crore."
    );
    expect(r.revenue?.number).toBe("520");
    expect(r.loss).toBeUndefined();
  });

  it("keeps a loss that the sentence places in the current year", () => {
    const r = readSnapshot(
      "FY2025 revenue was reported at Rs 44.2 crore against Rs 70.0 crore in FY2024, with a FY2025 loss after tax of Rs 5.1 crore."
    );
    expect(r.loss?.number).toBe("5.1");
  });

  it("does not read another measure's growth as revenue growth", () => {
    const r = readSnapshot(
      "The company reported ₹88.1 crore in revenue for FY 2025, a 7% year-over-year increase, with a 61.5% increase in EBITDA."
    );
    expect(r.growth).toEqual({ direction: "up", number: "7" });
    const s = readSnapshot("Revenue of ₹40.0 crore in FY25, with EBITDA growth of 52.1%.");
    expect(s.growth).toBeUndefined();
  });

  it("does not read a hedged or ranged margin", () => {
    expect(readSnapshot("Reports an EBITDA margin of approximately 15%.").percents).toEqual([]);
    expect(readSnapshot("The company reports an EBITDA margin of 17%–21%.").percents).toEqual([]);
  });

  it("draws nothing from a sentence with no plain figure", () => {
    const r = readSnapshot("An unfunded private company incorporated in 2021.");
    expect(isDrawable(r)).toBe(false);
  });
});
