import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Eye, ImagePlus, RotateCcw, X } from "lucide-react";
import { getStudio } from "@/lib/flow";
import type { Client, Platform, Quote } from "@/lib/platform";
import {
  DEFAULT_PHOTOS,
  SLOT_BOXES,
  SLOT_LABELS,
  buildQuotationFor,
  fitImage,
  readFileAsDataUrl,
  resolvePdfFormat,
  shrinkImage,
  type PdfFormat,
  type PhotoSlotId,
} from "@/lib/quotation-pdf";

const field =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-40";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium transition hover:border-olive hover:text-olive disabled:opacity-40";

const MAX_FILE_MB = 15;
const defaultPhotoFor = (id: PhotoSlotId) => {
  const index = Object.keys(SLOT_BOXES).indexOf(id);
  return DEFAULT_PHOTOS[index % DEFAULT_PHOTOS.length]!;
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/75">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Upload / replace / reset / preview controls around one image. */
function ImagePicker({
  label,
  src,
  custom,
  aspect,
  fallback,
  onFile,
  onReset,
  onPreview,
}: {
  label: string;
  src: string;
  custom: boolean;
  aspect: number;
  fallback?: string;
  onFile: (file: File) => Promise<void>;
  onReset: () => void;
  onPreview: (src: string, label: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file (JPG, PNG or WebP)");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return void toast.error(`Image is larger than ${MAX_FILE_MB} MB`);
    setBusy(true);
    try {
      await onFile(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not use that image");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const shown = src || fallback || "";
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px] text-muted-foreground">{custom ? "Custom" : "Default"}</span>
      </div>
      <div
        className="mt-2 flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio: String(Math.min(Math.max(aspect, 0.6), 3)) }}
      >
        {shown ? (
          <img src={shown} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] text-muted-foreground">No image</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className={secondary} disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus size={13} /> {busy ? "Processing..." : custom ? "Replace" : "Upload"}
        </button>
        <button type="button" className={secondary} disabled={!shown} onClick={() => onPreview(shown, label)}>
          <Eye size={13} /> Preview
        </button>
        {custom && (
          <button type="button" className={secondary} onClick={onReset}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`${label} file`}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
}

const sampleClient: Client = {
  id: "sample",
  name: "Sample Client",
  email: "client@example.com",
  phone: "98765 43210",
  city: "",
  notes: "",
};
const samplePackages = (): NonNullable<Quote["packages"]> => [
  {
    id: "s1", sourceId: "", title: "Wedding Bronze package", price: 35000, countInTotal: true,
    team: [{ qty: 1, role: "Traditional photographer" }, { qty: 1, role: "Traditional videographer" }],
    materials: ["Full traditional video edit", "25 page album with mini book & calendar", "All raw data in 32 GB pendrive"],
    gift: "12x18 frame gift from us",
  },
  {
    id: "s2", sourceId: "", title: "Wedding Gold package", price: 85000, countInTotal: true,
    team: [{ qty: 1, role: "Traditional photographer" }, { qty: 1, role: "Cinematic videographer" }, { qty: 1, role: "Drone pilot" }],
    materials: ["3-4 min cinematic highlight video", "1-2 min teaser / reel", "30 page album with mini book"],
    gift: "",
  },
  {
    id: "s3", sourceId: "", title: "Prewedding package", price: 25000, countInTotal: false,
    team: [{ qty: 1, role: "Photographer" }, { qty: 1, role: "Videographer" }],
    materials: ["3-4 min cinematic video", "50-60 couple photos edit"],
    gift: "Additional drone charges: Rs. 6,000",
  },
];

export function QuotationPdfSettings({ data, update }: { data: Platform; update: (d: Platform) => void }) {
  const studio = getStudio();
  const [f, setF] = useState<PdfFormat>(() => resolvePdfFormat(data.settings.pdfFormat, studio));
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const [building, setBuilding] = useState(false);
  const set = <K extends keyof PdfFormat>(key: K, value: PdfFormat[K]) => setF((cur) => ({ ...cur, [key]: value }));
  const setPhoto = (id: PhotoSlotId, value: string | undefined) =>
    setF((cur) => {
      const photos = { ...cur.photos };
      if (value) photos[id] = value;
      else delete photos[id];
      return { ...cur, photos };
    });

  const save = () => {
    try {
      update({ ...data, settings: { ...data.settings, pdfFormat: f } });
      toast.success("Quotation PDF format saved");
    } catch {
      toast.error("Could not save: the images are too large for this browser's storage. Remove a few photos and try again.");
    }
  };

  const preview = async () => {
    // Open the tab first so the pop-up blocker allows it, then point it at the PDF.
    const tab = window.open("", "_blank");
    setBuilding(true);
    try {
      const latest = data.quotes[data.quotes.length - 1];
      const quote: Quote = latest ?? {
        id: "sample", number: "SAMPLE-0001", enquiryId: "", clientId: sampleClient.id, packageId: "",
        event: "Wedding", date: new Date().toISOString().slice(0, 10), location: "Pune",
        items: [], packages: samplePackages(), discount: 5000, advance: 30000,
        terms: data.settings.quoteTerms, status: "Draft", createdAt: "",
      };
      const withClient = latest ? data : { ...data, clients: [...data.clients, sampleClient] };
      const pdf = await buildQuotationFor(withClient, quote, f);
      const url = URL.createObjectURL(pdf.output("blob"));
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch (error) {
      tab?.close();
      toast.error(error instanceof Error ? error.message : "Could not build the preview");
    } finally {
      setBuilding(false);
    }
  };

  const slotPicker = (id: PhotoSlotId, label: string) => {
    const box = SLOT_BOXES[id];
    return (
      <ImagePicker
        key={id}
        label={label}
        src={f.photos[id] || ""}
        fallback={defaultPhotoFor(id)}
        custom={!!f.photos[id]}
        aspect={box.w / box.h}
        onFile={async (file) => setPhoto(id, await fitImage(await readFileAsDataUrl(file), box.w, box.h))}
        onReset={() => setPhoto(id, undefined)}
        onPreview={(src, l) => setLightbox({ src, label: l })}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl">Edit quotation PDF format</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Pages 1–3 are your portfolio pages. Photos are cropped to fit their slot and compressed, so any image works.
            Slots without an upload use the default photos.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={secondary} disabled={building} onClick={() => void preview()}>
            <Eye size={14} /> {building ? "Building..." : "Preview PDF"}
          </button>
          <button type="button" className={btn} onClick={save}>
            Save PDF format
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg">Logo & tagline</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker
            label="Logo (shown on the cover)"
            src={f.logo}
            custom={!!f.logo}
            aspect={2.5}
            onFile={async (file) => set("logo", await shrinkImage(await readFileAsDataUrl(file), 700, "png"))}
            onReset={() => set("logo", "")}
            onPreview={(src, label) => setLightbox({ src, label })}
          />
          <div className="space-y-4">
            <Field label="Studio name (used when there is no logo)">
              <input className={field} value={f.logoText} onChange={(e) => set("logoText", e.target.value)} />
            </Field>
            <Field label="Tagline">
              <input className={field} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      {SLOT_LABELS.map((group) => (
        <section key={group.page} className="space-y-4">
          <h3 className="text-lg">{group.page}</h3>
          {group.page.startsWith("Page 2") && (
            <Field label="Page heading">
              <input className={field} value={f.preHeading} onChange={(e) => set("preHeading", e.target.value)} />
            </Field>
          )}
          {group.page.startsWith("Page 3") && (
            <Field label="Page heading">
              <input className={field} value={f.weddingHeading} onChange={(e) => set("weddingHeading", e.target.value)} />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.slots.map((s) => slotPicker(s.id, s.label))}</div>
        </section>
      ))}

      <section className="space-y-4">
        <h3 className="text-lg">Packages & summary pages</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Packages heading">
            <input className={field} value={f.packagesHeading} onChange={(e) => set("packagesHeading", e.target.value)} />
          </Field>
          <Field label="Summary heading">
            <input className={field} value={f.summaryHeading} onChange={(e) => set("summaryHeading", e.target.value)} />
          </Field>
          <Field label="Terms heading">
            <input className={field} value={f.termsHeading} onChange={(e) => set("termsHeading", e.target.value)} />
          </Field>
        </div>
        <Field
          label="Terms & conditions (one per line)"
          hint="A quotation whose own terms were edited keeps them; all others use this text."
        >
          <textarea className={`${field} min-h-32 resize-y`} value={f.terms} onChange={(e) => set("terms", e.target.value)} />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg">Payment QR & contact details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker
            label="Payment QR code"
            src={f.qr}
            custom={!!f.qr}
            aspect={1}
            onFile={async (file) => set("qr", await shrinkImage(await readFileAsDataUrl(file), 500, "png"))}
            onReset={() => set("qr", "")}
            onPreview={(src, label) => setLightbox({ src, label })}
          />
          <div className="space-y-4">
            <Field label="Text under the QR code">
              <input className={field} value={f.qrCaption} onChange={(e) => set("qrCaption", e.target.value)} />
            </Field>
            <Field label="Contact name">
              <input className={field} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Contact details (one per line)" hint="Phone, email, address, Instagram...">
              <textarea
                className={`${field} min-h-24 resize-y`}
                value={f.contactLines}
                onChange={(e) => set("contactLines", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-label={`${lightbox.label} preview`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white p-2"
            aria-label="Close preview"
            onClick={() => setLightbox(null)}
          >
            <X size={16} />
          </button>
          <img src={lightbox.src} alt={lightbox.label} className="max-h-full max-w-full rounded-lg bg-white object-contain" />
        </div>
      )}
    </div>
  );
}
