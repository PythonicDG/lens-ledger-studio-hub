import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteForm } from "@/components/platform-app";
import { buildQuotationFor } from "@/lib/quotation-pdf";
import { addStarterServices, getPlatform, type Platform, type Quote } from "@/lib/platform";

const seeded = (): Platform => addStarterServices(getPlatform());
const fillBasics = () => {
  fireEvent.change(screen.getByLabelText("Client name *"), { target: { value: "Asha Rao" } });
  fireEvent.change(screen.getByLabelText("Phone *"), { target: { value: "9876543210" } });
  fireEvent.change(screen.getByLabelText("Event date *"), { target: { value: "2026-12-12" } });
  fireEvent.change(screen.getByLabelText("Venue *"), { target: { value: "Pune" } });
};
const addPackage = (name: string) => {
  fireEvent.click(screen.getByText("Add package"));
  fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(name) }));
};

beforeEach(() => localStorage.clear());

describe("quotation form", () => {
  it("blocks saving until the required fields and a package are filled in", () => {
    const update = vi.fn();
    render(<QuoteForm data={getPlatform()} update={update} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Save quotation"));
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText("Enter the client name")).toBeInTheDocument();
    expect(screen.getByText("Enter a phone number")).toBeInTheDocument();
    expect(screen.getByText("Pick the event date")).toBeInTheDocument();
    expect(screen.getByText("Enter the venue")).toBeInTheDocument();
    expect(screen.getByText("Add at least one package")).toBeInTheDocument();
  });

  it("creates a quotation from saved and custom packages with live totals", () => {
    const update = vi.fn();
    const data = seeded();
    render(<QuoteForm data={data} update={update} onClose={vi.fn()} />);
    fillBasics();

    addPackage("Wedding Silver");
    // Only packages not already in the quotation are offered again.
    fireEvent.click(screen.getByText("Add package"));
    expect(screen.queryByRole("menuitem", { name: /Wedding Silver/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /Custom package/ }));

    expect(screen.getAllByRole("tab")).toHaveLength(2);
    // The new custom package is the open one.
    expect(screen.getByLabelText("Package title *")).toHaveValue("Custom package");
    fireEvent.change(screen.getByLabelText("Package price (₹)"), { target: { value: "20000" } });
    fireEvent.click(screen.getByLabelText("Count in total"));

    fireEvent.click(screen.getByRole("tab", { name: /Wedding Silver/ }));
    expect(screen.getByLabelText("Package title *")).toHaveValue("Wedding Silver");
    expect(screen.getByLabelText("Team quantity 1")).toHaveValue(1);
    expect(screen.queryByText(/add-on/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/GST/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Discount (₹)"), { target: { value: "5000" } });
    fireEvent.change(screen.getByLabelText("Advance (₹)"), { target: { value: "70000" } });

    // Silver 50,000 counted; the custom package is unticked. Rs. 5,000 off -> 45,000; advance 70,000.
    const totals = screen.getByText("Subtotal", { selector: "p" }).closest("[aria-live]") as HTMLElement;
    expect(within(totals).getByText("₹50,000")).toBeInTheDocument();
    expect(within(totals).getByText("₹45,000")).toBeInTheDocument();
    expect(within(totals).getByText("₹-25,000")).toHaveClass("text-rose-600");

    fireEvent.click(screen.getByText("Save quotation"));
    expect(update).toHaveBeenCalledOnce();
    const saved = update.mock.calls[0]![0] as Platform;
    const quote = saved.quotes[0]!;
    expect(saved.clients[0]).toMatchObject({ name: "Asha Rao", phone: "9876543210" });
    expect(quote.packages).toHaveLength(2);
    expect(quote.packages![1]!.countInTotal).toBe(false);
    expect(quote.discount).toBe(5000);
    expect(quote.items.map((i) => i.price)).toEqual([50000]);
    // The catalogue package itself is untouched.
    expect(saved.packages.find((p) => p.name === "Wedding Silver")!.price).toBe(50000);
  });

  it("duplicates and removes packages, and edits stay inside the quotation", () => {
    const update = vi.fn();
    render(<QuoteForm data={seeded()} update={update} onClose={vi.fn()} />);
    fillBasics();
    addPackage("Wedding Gold");
    fireEvent.change(screen.getByLabelText("Package title *"), { target: { value: "Gold for Asha" } });
    fireEvent.change(screen.getByLabelText("Package price (₹)"), { target: { value: "80000" } });
    fireEvent.click(screen.getByText("Duplicate"));
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByLabelText("Package title *")).toHaveValue("Gold for Asha (copy)");
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.getAllByRole("tab")).toHaveLength(1);

    fireEvent.click(screen.getByText("Save quotation"));
    const saved = update.mock.calls[0]![0] as Platform;
    expect(saved.quotes[0]!.packages![0]).toMatchObject({ title: "Gold for Asha", price: 80000 });
    expect(saved.packages.find((p) => p.name === "Wedding Gold")!.price).toBe(85000);
  });

  it("rejects a discount larger than the subtotal", () => {
    const update = vi.fn();
    render(<QuoteForm data={seeded()} update={update} onClose={vi.fn()} />);
    fillBasics();
    addPackage("Wedding Bronze");
    fireEvent.change(screen.getByLabelText("Discount (₹)"), { target: { value: "40000" } });
    fireEvent.click(screen.getByText("Save quotation"));
    expect(update).not.toHaveBeenCalled();
    expect(screen.getAllByText("Discount cannot exceed the subtotal").length).toBeGreaterThan(0);
  });

  it("edits an existing quotation, including one saved before multi-package support", () => {
    const update = vi.fn();
    const client = { id: "c1", name: "Old Client", email: "", phone: "9876543210", city: "", notes: "" };
    const legacy: Quote = {
      id: "q1", number: "FF-Q-0001", enquiryId: "", clientId: "c1", packageId: "", event: "Wedding",
      date: "2026-11-01", location: "Mumbai", discount: 1000, advance: 0, terms: "T", status: "Draft",
      items: [{ name: "Photography", price: 25000 }, { name: "Album", price: 5000 }], createdAt: "",
    };
    render(
      <QuoteForm
        data={{ ...seeded(), clients: [client], quotes: [legacy] }}
        update={update}
        onClose={vi.fn()}
        existing={legacy}
      />,
    );
    expect(screen.getByLabelText("Client name *")).toHaveValue("Old Client");
    expect(screen.getByLabelText("Package price (₹)")).toHaveValue(30000);
    fireEvent.change(screen.getByLabelText("Venue *"), { target: { value: "Goa" } });
    fireEvent.click(screen.getByText("Save quotation"));
    const saved = update.mock.calls[0]![0] as Platform;
    expect(saved.quotes).toHaveLength(1);
    expect(saved.clients).toHaveLength(1);
    expect(saved.quotes[0]).toMatchObject({ location: "Goa", discount: 1000 });
    expect(saved.quotes[0]!.packages![0]!.price).toBe(30000);
  });
});

describe("quotation PDF", () => {
  const build = async (quote: Quote) => {
    const data = {
      ...seeded(),
      clients: [{ id: "c1", name: "Asha", email: "", phone: "9876543210", city: "", notes: "" }],
    };
    const pdf = await buildQuotationFor(data, quote, undefined, { compress: false });
    return { pdf, text: pdf.output().replace(/\\([()])/g, "$1") };
  };
  const base = (packages: Quote["packages"], extra: Partial<Quote> = {}): Quote => ({
    id: "q", number: "FF-Q-0009", enquiryId: "", clientId: "c1", packageId: "", event: "Wedding",
    date: "2026-12-12", location: "Pune", items: [], packages, discount: 0, advance: 0,
    terms: "Advance confirms the booking.", status: "Draft", createdAt: "", ...extra,
  });
  const pkg = (i: number, over = {}) => ({
    id: `p${i}`, sourceId: "", title: `Package ${i}`, price: 10000, countInTotal: true,
    team: [{ qty: 2, role: "Photographer" }], materials: ["25 page album", "Pendrive"],
    gift: "Frame", ...over,
  });

  it("paginates many packages, marks options and shows totals", async () => {
    const packages = Array.from({ length: 14 }, (_, i) => pkg(i + 1, i === 1 ? { countInTotal: false } : {}));
    const { pdf, text } = await build(base(packages));
    // 3 portfolio pages + packages + summary
    expect(pdf.getNumberOfPages()).toBeGreaterThan(5);
    expect(text).toContain("Option - not included in the total");
    expect(text).toContain("Subtotal");
    expect(text).not.toContain("GST");
    // 13 counted packages at Rs. 10,000
    expect(text).toContain("Rs. 1,30,000");
  });

  it.each([[1, 5], [4, 6], [8, 8]])("lays out %i package(s) on %i pages without splitting a card", async (count, pages) => {
    const full = {
      team: ["Traditional photographer", "Candid photographer", "Cinematic videographer", "Drone pilot"].map((role) => ({ qty: 1, role })),
      materials: ["Full video edit", "25 page album with mini book & calendar", "All couple photos edit", "Raw data in 32 GB pendrive", "Teaser / reel", "Calendar and box bag"],
      gift: "12x18 frame gift. Drone charges Rs. 6,000, LED screen Rs. 15,000",
    };
    const packages = Array.from({ length: count }, (_, i) => pkg(i + 1, full));
    const { pdf, text } = await build(base(packages));
    // 3 portfolio pages, package/summary pages, one closing page for terms + QR + contact.
    expect(pdf.getNumberOfPages()).toBe(pages);
    for (let i = 1; i <= count; i++) expect(text.match(new RegExp(`\(Package ${i}\)`, "g"))).toHaveLength(1);
    expect(text).toContain("Prewedding Stories");
    expect(text).toContain("Wedding Stories");
    expect(text).toContain("Terms & Conditions");
  });

  it("omits the totals summary when no package is counted", async () => {
    const { text } = await build(base([pkg(1, { countInTotal: false })]));
    expect(text).toContain("Option - not included in the total");
    expect(text).not.toContain("Subtotal");
    expect(text).not.toContain("Advance requested");
  });
});
