import { describe, expect, it } from "vitest";
import {
  STARTER_PACKAGES,
  calcTotals,
  quotePackageFrom,
  validateQuote,
  type QuotePackage,
} from "@/lib/platform";

const pkg = (price: number, countInTotal: boolean): QuotePackage => ({
  id: String(price),
  sourceId: "",
  title: "P",
  price,
  countInTotal,
  team: [],
  materials: [],
  gift: "",
});

describe("package quotation totals", () => {
  it("counts only ticked packages and subtracts a rupee discount", () => {
    const t = calcTotals({ packages: [pkg(50000, true), pkg(20000, true), pkg(85000, false)], discount: 5000, advance: 80000 });
    expect(t).toEqual({ subtotal: 70000, discount: 5000, total: 65000, balance: -15000 });
  });

  it("caps the discount at the subtotal and validates it", () => {
    const input = { packages: [pkg(1000, true)], discount: 5000 };
    expect(calcTotals(input).total).toBe(0);
    const errors = validateQuote({ clientName: "A", phone: "9876543210", date: "2026-01-01", venue: "V", ...input });
    expect(errors.discount).toBeTruthy();
    expect(validateQuote({ clientName: "A", phone: "123", date: "", venue: "", packages: [] })).toMatchObject({
      phone: expect.any(String),
      date: expect.any(String),
      venue: expect.any(String),
      packages: expect.any(String),
    });
  });

  it("copies a catalogue package so later catalogue edits do not reach the quotation", () => {
    const master = { ...STARTER_PACKAGES[2]!, id: "m", description: "", serviceIds: [], active: true };
    const copy = quotePackageFrom(master);
    master.price = 1;
    master.team.push("Extra");
    expect(copy.price).toBe(85000);
    expect(copy.team).toHaveLength(5);
    expect(copy.team[0]).toEqual({ qty: 1, role: "Traditional Photographer" });
  });
});
