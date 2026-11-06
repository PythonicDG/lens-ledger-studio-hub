import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuotationPdfSettings } from "@/components/quotation-pdf-settings";
import { getPlatform } from "@/lib/platform";
import { cropRect, normalizeCrop, resolvePdfFormat } from "@/lib/quotation-pdf";

// jsdom has no canvas, so image cropping is replaced by a marker.
vi.mock("@/lib/quotation-pdf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/quotation-pdf")>()),
  readFileAsDataUrl: async () => "data:image/png;base64,AAAA",
  fitImage: async (_src: string, w: number, h: number) => `data:image/jpeg;fit-${w}x${h}`,
  prepareSlotPhoto: async (_src: string, w: number, h: number) => `data:image/jpeg;source-${w}x${h}`,
  shrinkImage: async () => "data:image/png;shrunk",
}));

beforeEach(() => localStorage.clear());

describe("quotation PDF settings", () => {
  it("offers an upload slot for every photo and saves edits", async () => {
    const update = vi.fn();
    render(<QuotationPdfSettings data={getPlatform()} update={update} />);
    expect(screen.getByText("Edit quotation PDF format")).toBeInTheDocument();
    // 11 photo slots + logo + QR code
    expect(screen.getAllByRole("button", { name: /Upload/ })).toHaveLength(13);
    expect(screen.getByRole("button", { name: /Preview PDF/ })).toBeInTheDocument();

    const file = new File(["x"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Top photo (full width) file"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText("Replace").length).toBe(1));
    fireEvent.change(screen.getByDisplayValue("Prewedding Stories"), { target: { value: "Pre-wedding Tales" } });
    fireEvent.click(screen.getByText("Save PDF format"));

    const saved = update.mock.calls[0]![0].settings.pdfFormat;
    expect(saved.photos.coverTop).toMatch(/^data:image\/jpeg;source-210x124/);
    expect(saved.preHeading).toBe("Pre-wedding Tales");
  });

  it("rejects non-image files", async () => {
    render(<QuotationPdfSettings data={getPlatform()} update={vi.fn()} />);
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Logo (shown on the cover) file"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText("Upload").length).toBe(13));
  });

  it("adjusts the framing of a photo and saves it", async () => {
    const update = vi.fn();
    render(<QuotationPdfSettings data={getPlatform()} update={update} />);
    // Every photo slot (11) has an Adjust button; logo and QR do not.
    expect(screen.getAllByRole("button", { name: /^Adjust / })).toHaveLength(11);

    fireEvent.click(screen.getByRole("button", { name: "Adjust Tall photo (right)" }));
    const dialog = screen.getByRole("dialog", { name: "Adjust Tall photo (right)" });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Top" }));
    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/Adjusted/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Save PDF format"));
    const saved = update.mock.calls[0]![0].settings.pdfFormat;
    expect(saved.photoCrops.pre4).toEqual({ x: 0.5, y: 0, zoom: 1.5 });
    expect(saved.photoCrops.coverTop).toBeUndefined();
  });

  it("cancel leaves the framing unchanged and a new upload resets it", async () => {
    const update = vi.fn();
    const data = getPlatform();
    data.settings.pdfFormat = { photoCrops: { coverTop: { x: 0.2, y: 0, zoom: 2 } } };
    render(<QuotationPdfSettings data={data} update={update} />);

    fireEvent.click(screen.getByRole("button", { name: "Adjust Top photo (full width)" }));
    fireEvent.click(screen.getByRole("button", { name: "Bottom" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByText("Save PDF format"));
    expect(update.mock.calls[0]![0].settings.pdfFormat.photoCrops.coverTop).toEqual({ x: 0.2, y: 0, zoom: 2 });

    const file = new File(["x"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Top photo (full width) file"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText("Replace").length).toBe(1));
    fireEvent.click(screen.getByText("Save PDF format"));
    expect(update.mock.calls[1]![0].settings.pdfFormat.photoCrops.coverTop).toBeUndefined();
  });
});

describe("photo crop maths", () => {
  it("centres a cover fit by default", () => {
    // A 1000x2000 portrait in a 2:1 slot keeps the full width and a 500px tall band in the middle.
    expect(cropRect(1000, 2000, 2)).toEqual({ sx: 0, sy: 750, sw: 1000, sh: 500 });
  });

  it("moves the window to the top of a vertical photo", () => {
    expect(cropRect(1000, 2000, 2, { y: 0 })).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 500 });
    expect(cropRect(1000, 2000, 2, { y: 1 })).toEqual({ sx: 0, sy: 1500, sw: 1000, sh: 500 });
  });

  it("zooms in and allows horizontal movement once zoomed", () => {
    expect(cropRect(1000, 2000, 2, { x: 0, y: 0, zoom: 2 })).toEqual({ sx: 0, sy: 0, sw: 500, sh: 250 });
    expect(cropRect(1000, 2000, 2, { x: 1, y: 0.5, zoom: 2 })).toEqual({ sx: 500, sy: 875, sw: 500, sh: 250 });
  });

  it("clamps broken values and keeps saved crops when resolving the format", () => {
    expect(normalizeCrop({ x: -3, y: 9, zoom: 50 })).toEqual({ x: 0, y: 1, zoom: 4 });
    expect(normalizeCrop({ x: Number.NaN, zoom: 0.2 })).toEqual({ x: 0, y: 0.5, zoom: 1 });
    const f = resolvePdfFormat({ photoCrops: { wed1: { x: 0, y: 0, zoom: 1 } } }, {});
    expect(f.photoCrops.wed1).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(resolvePdfFormat(undefined, {}).photoCrops).toEqual({});
  });
});
