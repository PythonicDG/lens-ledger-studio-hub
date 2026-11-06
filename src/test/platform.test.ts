import { describe, expect, it } from "vitest";
import { memberStats, quoteSubtotal, quoteTotal, type Platform, type Quote } from "@/lib/platform";

describe("quotation totals", () => {
  it("subtracts the discount without adding GST", () => {
    const quote = {
      items: [
        { name: "Photography", price: 60000 },
        { name: "Album", price: 20000 },
      ],
      discount: 10000,
    } as Quote;
    expect(quoteSubtotal(quote)).toBe(80000);
    expect(quoteTotal(quote)).toBe(70000);
  });
});

describe("team payments", () => {
  const data = {
    team: [{ id: "m1", name: "Asha", role: "Photographer", phone: "" }],
    bookings: [
      {
        id: "b1",
        assignments: [
          { id: "a1", memberId: "m1", date: "2026-12-01", fee: 5000 },
          { id: "a2", memberId: "m1", date: "2026-12-02", fee: 3000 },
        ],
      },
    ],
    teamPayments: [{ id: "p1", bookingId: "b1", assignmentId: "a1", memberId: "m1", amount: 2000 }],
  } as unknown as Platform;

  it("totals fees per day and tracks the remaining balance", () => {
    const s = memberStats(data, "m1");
    expect(s).toMatchObject({ total: 8000, paid: 2000, remaining: 6000, days: 2, shoots: 1 });
  });

  it("limits stats to the selected dates", () => {
    const s = memberStats(data, "m1", { from: "2026-12-02" });
    expect(s).toMatchObject({ total: 3000, paid: 0, remaining: 3000, days: 1 });
  });
});

describe("package catalogue", () => {
  it("loads the starter wedding and pre-wedding packages with categories", async () => {
    const { addStarterServices, getPlatform, packageDetailsFrom } = await import("@/lib/platform");
    const data = addStarterServices(getPlatform());
    expect(data.packages.map((p) => p.name)).toEqual([
      "Wedding Bronze",
      "Wedding Silver",
      "Wedding Gold",
      "Prewedding",
    ]);
    expect(data.packages.map((p) => p.category)).toEqual(["Wedding", "Wedding", "Wedding", "Pre-wedding"]);
    const gold = data.packages[2]!;
    expect(gold.price).toBe(85000);
    expect(gold.team).toHaveLength(5);
    // A quotation gets its own copy so per-client edits never touch the catalogue.
    const copy = packageDetailsFrom(gold);
    copy.team.push("Extra");
    expect(gold.team).toHaveLength(5);
  });

  it("upgrades packages saved before categories and inclusions existed", async () => {
    localStorage.setItem(
      "frameflow.platform.local",
      JSON.stringify({
        packages: [{ id: "p1", name: "Basic", description: "", serviceIds: [], price: 1, active: true }],
        services: [{ id: "s1", name: "Reels", category: "Reels", description: "", price: 1, active: true }],
      }),
    );
    const { getPlatform } = await import("@/lib/platform");
    const data = getPlatform();
    expect(data.packages[0]).toMatchObject({ category: "Other", team: [], deliverables: [], notes: "" });
    expect(data.categories.services).toContain("Reels");
    expect(data.categories.packages).toContain("Wedding");
  });
});
