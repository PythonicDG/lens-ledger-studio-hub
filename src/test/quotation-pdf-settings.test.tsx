import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuotationPdfSettings } from "@/components/quotation-pdf-settings";
import { getPlatform } from "@/lib/platform";

// jsdom has no canvas, so image cropping is replaced by a marker.
vi.mock("@/lib/quotation-pdf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/quotation-pdf")>()),
  readFileAsDataUrl: async () => "data:image/png;base64,AAAA",
  fitImage: async (_src: string, w: number, h: number) => `data:image/jpeg;fit-${w}x${h}`,
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
    expect(saved.photos.coverTop).toMatch(/^data:image\/jpeg;fit-210x124/);
    expect(saved.preHeading).toBe("Pre-wedding Tales");
  });

  it("rejects non-image files", async () => {
    render(<QuotationPdfSettings data={getPlatform()} update={vi.fn()} />);
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Logo (shown on the cover) file"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText("Upload").length).toBe(13));
  });
});
