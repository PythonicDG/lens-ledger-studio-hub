import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Crop, Eye, ImagePlus, Move, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { getStudio } from "@/lib/flow";
import type { Client, Platform, Quote } from "@/lib/platform";
import {
  DEFAULT_CROP,
  DEFAULT_PHOTOS,
  MAX_ZOOM,
  SLOT_BOXES,
  SLOT_LABELS,
  buildQuotationFor,
  isDefaultCrop,
  normalizeCrop,
  prepareSlotPhoto,
  readFileAsDataUrl,
  resolvePdfFormat,
  shrinkImage,
  type PdfFormat,
  type PhotoCrop,
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

/**
 * Shows `src` framed exactly as the PDF will crop it: a cover fit inside a box of aspect `aspect`, zoomed and
 * shifted by `crop`. Everything is in percentages, so it works at any rendered size.
 */
function CroppedImage({
  src,
  alt,
  aspect,
  crop,
  imgAspect,
  onImgAspect,
}: {
  src: string;
  alt: string;
  aspect: number;
  crop: PhotoCrop;
  imgAspect: number | null;
  onImgAspect: (aspect: number) => void;
}) {
  const { w, h } = displayScale(aspect, imgAspect, crop.zoom);
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalWidth && el.naturalHeight) onImgAspect(el.naturalWidth / el.naturalHeight);
      }}
      className="pointer-events-none absolute max-w-none select-none"
      style={{
        width: `${w * 100}%`,
        height: `${h * 100}%`,
        left: `${-(w - 1) * crop.x * 100}%`,
        top: `${-(h - 1) * crop.y * 100}%`,
      }}
    />
  );
}

/**
 * Size of the displayed photo relative to its frame (1 = exactly the frame on that axis). Until the image reports
 * its size, it is assumed to match the frame (a plain centred fill).
 */
function displayScale(frameAspect: number, imgAspect: number | null, zoom: number) {
  const ia = imgAspect ?? frameAspect;
  const wide = ia > frameAspect;
  return { w: zoom * (wide ? ia / frameAspect : 1), h: zoom * (wide ? 1 : frameAspect / ia) };
}

const PRESETS: { label: string; crop: Partial<PhotoCrop> }[] = [
  { label: "Top", crop: { y: 0 } },
  { label: "Center", crop: { x: 0.5, y: 0.5 } },
  { label: "Bottom", crop: { y: 1 } },
  { label: "Left", crop: { x: 0 } },
  { label: "Right", crop: { x: 1 } },
];

/** Modal for re-framing one photo inside its slot: drag to move, slider / wheel / buttons to zoom. */
function CropEditor({
  label,
  src,
  aspect,
  initial,
  onSave,
  onClose,
}: {
  label: string;
  src: string;
  aspect: number;
  initial: PhotoCrop;
  onSave: (crop: PhotoCrop) => void;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState<PhotoCrop>(initial);
  const [imgAspect, setImgAspect] = useState<number | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; start: PhotoCrop; slackX: number; slackY: number } | null>(null);
  const patch = (next: Partial<PhotoCrop>) => setCrop((cur) => normalizeCrop({ ...cur, ...next }));

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Wheel zoom needs a non-passive listener so the page does not scroll at the same time.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCrop((cur) => normalizeCrop({ ...cur, zoom: cur.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const scale = displayScale(aspect, imgAspect, crop.zoom);
  const canMove = scale.w > 1.001 || scale.h > 1.001;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      start: crop,
      slackX: rect.width * (scale.w - 1),
      slackY: rect.height * (scale.h - 1),
    };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Dragging the photo right reveals more of its left side, so x goes down.
    patch({
      x: d.slackX > 0.5 ? d.start.x - (e.clientX - d.px) / d.slackX : d.start.x,
      y: d.slackY > 0.5 ? d.start.y - (e.clientY - d.py) / d.slackY : d.start.y,
    });
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, Partial<PhotoCrop>> = {
      ArrowLeft: { x: crop.x - step },
      ArrowRight: { x: crop.x + step },
      ArrowUp: { y: crop.y - step },
      ArrowDown: { y: crop.y + step },
      "+": { zoom: crop.zoom + 0.1 },
      "=": { zoom: crop.zoom + 0.1 },
      "-": { zoom: crop.zoom - 0.1 },
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    patch(m);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Adjust ${label}`}
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">Adjust photo · {label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drag the photo to choose which part shows, and zoom with the slider or mouse wheel. The frame is the exact
              shape of this slot in the PDF.
            </p>
          </div>
          <button type="button" className="rounded-full p-1.5 hover:bg-muted" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex justify-center rounded-xl bg-muted p-3">
          <div
            ref={frame}
            role="application"
            aria-label="Photo position. Use the arrow keys to move, plus and minus to zoom."
            tabIndex={0}
            className={`relative overflow-hidden rounded-md bg-neutral-200 outline-none ring-olive/40 focus-visible:ring-4 ${
              canMove ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            // Wide slots fill the width; tall ones are capped so the frame stays on screen.
            style={{ width: `min(100%, calc(55vh * ${aspect}))`, aspectRatio: String(aspect), touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
          >
            <CroppedImage src={src} alt={label} aspect={aspect} crop={crop} imgAspect={imgAspect} onImgAspect={setImgAspect} />
            {/* Rule-of-thirds guide */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={secondary}
              aria-label="Zoom out"
              disabled={crop.zoom <= 1}
              onClick={() => patch({ zoom: crop.zoom - 0.1 })}
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={crop.zoom}
              aria-label="Zoom"
              className="h-1.5 w-full cursor-pointer accent-olive"
              onChange={(e) => patch({ zoom: Number(e.target.value) })}
            />
            <button
              type="button"
              className={secondary}
              aria-label="Zoom in"
              disabled={crop.zoom >= MAX_ZOOM}
              onClick={() => patch({ zoom: crop.zoom + 0.1 })}
            >
              <ZoomIn size={14} />
            </button>
            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{crop.zoom.toFixed(2)}×</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-foreground/75">
              <Move size={13} /> Quick position
            </span>
            {PRESETS.map((preset) => (
              <button key={preset.label} type="button" className={secondary} onClick={() => patch(preset.crop)}>
                {preset.label}
              </button>
            ))}
          </div>
          {imgAspect !== null && !canMove && (
            <p className="text-[11px] text-muted-foreground">
              This photo already has the same shape as the slot. Zoom in to move it around.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <button type="button" className={secondary} onClick={() => setCrop(DEFAULT_CROP)}>
            <RotateCcw size={13} /> Reset framing
          </button>
          <div className="flex gap-2">
            <button type="button" className={secondary} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={btn} onClick={() => onSave(crop)}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Upload / replace / reset / preview (and, for photo slots, adjust) controls around one image. */
function ImagePicker({
  label,
  src,
  custom,
  aspect,
  fallback,
  crop,
  onFile,
  onReset,
  onPreview,
  onAdjust,
}: {
  label: string;
  src: string;
  custom: boolean;
  aspect: number;
  fallback?: string;
  /** Present for photo slots: the thumbnail shows this framing and an Adjust button appears. */
  crop?: PhotoCrop;
  onFile: (file: File) => Promise<void>;
  onReset: () => void;
  onPreview: (src: string, label: string) => void;
  onAdjust?: (src: string) => void;
}) {
  const [imgAspect, setImgAspect] = useState<number | null>(null);
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
  const framed = !!crop && !isDefaultCrop(crop);
  // Photo slots show their true shape so the thumbnail matches the PDF; logo / QR boxes stay within a tidy range.
  const boxAspect = crop ? aspect : Math.min(Math.max(aspect, 0.6), 3);
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px] text-muted-foreground">
          {custom ? "Custom" : "Default"}
          {framed ? " · Adjusted" : ""}
        </span>
      </div>
      <div
        className="relative mx-auto mt-2 flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio: String(boxAspect) }}
      >
        {shown && crop ? (
          <CroppedImage src={shown} alt={label} aspect={aspect} crop={crop} imgAspect={imgAspect} onImgAspect={setImgAspect} />
        ) : shown ? (
          <img src={shown} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] text-muted-foreground">No image</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className={secondary} disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus size={13} /> {busy ? "Processing..." : custom ? "Replace" : "Upload"}
        </button>
        {onAdjust && (
          <button
            type="button"
            className={secondary}
            disabled={!shown || busy}
            aria-label={`Adjust ${label}`}
            onClick={() => onAdjust(shown)}
          >
            <Crop size={13} /> Adjust
          </button>
        )}
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
  const [adjusting, setAdjusting] = useState<{ id: PhotoSlotId; src: string; label: string } | null>(null);
  const [building, setBuilding] = useState(false);
  const set = <K extends keyof PdfFormat>(key: K, value: PdfFormat[K]) => setF((cur) => ({ ...cur, [key]: value }));
  const setPhoto = (id: PhotoSlotId, value: string | undefined) =>
    setF((cur) => {
      const photos = { ...cur.photos };
      if (value) photos[id] = value;
      else delete photos[id];
      // A new or removed photo starts from the centred framing again.
      const photoCrops = { ...cur.photoCrops };
      delete photoCrops[id];
      return { ...cur, photos, photoCrops };
    });
  const setCrop = (id: PhotoSlotId, crop: PhotoCrop) =>
    setF((cur) => {
      const photoCrops = { ...cur.photoCrops };
      if (isDefaultCrop(crop)) delete photoCrops[id];
      else photoCrops[id] = normalizeCrop(crop);
      return { ...cur, photoCrops };
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
        crop={normalizeCrop(f.photoCrops[id])}
        onFile={async (file) => setPhoto(id, await prepareSlotPhoto(await readFileAsDataUrl(file), box.w, box.h))}
        onReset={() => setPhoto(id, undefined)}
        onPreview={(src, l) => setLightbox({ src, label: l })}
        onAdjust={(src) => setAdjusting({ id, src, label })}
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
            Use <strong>Adjust</strong> on any photo to choose which part shows and how much it is zoomed. Slots
            without an upload use the default photos.
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

      {adjusting && (
        <CropEditor
          key={adjusting.id}
          label={adjusting.label}
          src={adjusting.src}
          aspect={SLOT_BOXES[adjusting.id].w / SLOT_BOXES[adjusting.id].h}
          initial={normalizeCrop(f.photoCrops[adjusting.id])}
          onClose={() => setAdjusting(null)}
          onSave={(crop) => {
            setCrop(adjusting.id, crop);
            setAdjusting(null);
          }}
        />
      )}

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
