import { describe, expect, it } from "vitest";
import { assistBalance, assistPaid, assistPayStatus, type AssistJob } from "@/lib/platform";

const job = (patch: Partial<AssistJob> = {}): AssistJob => ({
  id: "a",
  photographer: "Studio X",
  phone: "",
  event: "Wedding",
  date: "2026-10-01",
  endDate: "",
  location: "",
  role: "Second shooter",
  fee: 10000,
  dueDate: "",
  notes: "",
  payments: [],
  ...patch,
});
const pay = (amount: number) => ({ id: String(amount), amount, date: "2026-10-02", method: "UPI", note: "" });

describe("assist log payments", () => {
  it("derives balance and status from recorded payments", () => {
    expect(assistPayStatus(job(), "2026-11-01")).toBe("Unpaid");
    const partial = job({ payments: [pay(4000)] });
    expect(assistPaid(partial)).toBe(4000);
    expect(assistBalance(partial)).toBe(6000);
    expect(assistPayStatus(partial, "2026-11-01")).toBe("Partially paid");
    expect(assistPayStatus(job({ payments: [pay(10000)] }), "2026-11-01")).toBe("Paid");
  });

  it("flags unpaid balances past the due date as overdue, but never paid ones", () => {
    expect(assistPayStatus(job({ dueDate: "2026-10-15" }), "2026-11-01")).toBe("Overdue");
    expect(assistPayStatus(job({ dueDate: "2026-10-15", payments: [pay(10000)] }), "2026-11-01")).toBe("Paid");
    expect(assistPayStatus(job({ dueDate: "2026-11-15" }), "2026-11-01")).toBe("Unpaid");
  });
});
