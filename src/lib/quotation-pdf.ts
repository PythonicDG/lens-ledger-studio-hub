import type { jsPDF } from "jspdf";
import heroWedding from "@/assets/hero-wedding.jpg";
import portrait from "@/assets/portrait.jpg";
import bts from "@/assets/bts.jpg";
import editing from "@/assets/editing.jpg";
import { getStudio } from "./flow";
import {
  formatDate,
  quotePackagesOf,
  quoteTotals,
  type Platform,
  type Quote,
  type QuotePackage,
} from "./platform";

/** Photos used for any slot that has no upload yet. */
export const DEFAULT_PHOTOS = [heroWedding, portrait, bts, editing];

/** Photo slots on pages 1–3 of the quotation PDF. Each has a fixed size so uploads can be cropped to fit. */
export type PhotoSlotId =
  | "coverTop"
  | "coverBottom"
  | "pre1"
  | "pre2"
  | "pre3"
  | "pre4"
  | "pre5"
  | "wed1"
  | "wed2"
  | "wed3"
  | "wed4";

export type PdfFormat = {
  logo: string;
  logoText: string;
  tagline: string;
  preHeading: string;
  weddingHeading: string;
  packagesHeading: string;
  summaryHeading: string;
  termsHeading: string;
  terms: string;
  qr: string;
  qrCaption: string;
  contactName: string;
  contactLines: string;
  /** Uploaded photos (data URLs). A missing slot falls back to the default image. */
  photos: Partial<Record<PhotoSlotId, string>>;
};

// Layout is in millimetres on A4.
export const PAGE = { w: 210, h: 297, margin: 16 };
const GAP = 3;
const COLLAGE = { x: 14, y: 36, w: 182, h: 247 };
const half = (COLLAGE.w - GAP) / 2;

type Box = { x: number; y: number; w: number; h: number };
const stack = (top: number, heights: number[]) => {
  let y = top;
  return heights.map((h) => {
    const at = y;
    y += h + GAP;
    return at;
  });
};

const COVER_H = 124;
const [preY1, preY2, preY3] = stack(COLLAGE.y, [74, 94, 74]) as [number, number, number];
const [wedY1, wedY2, wedY3] = stack(COLLAGE.y, [72, 100, 69]) as [number, number, number];
const smallH = (94 - GAP) / 2;

export const SLOT_BOXES: Record<PhotoSlotId, Box> = {
  coverTop: { x: 0, y: 0, w: PAGE.w, h: COVER_H },
  coverBottom: { x: 0, y: PAGE.h - COVER_H, w: PAGE.w, h: COVER_H },
  pre1: { x: COLLAGE.x, y: preY1, w: COLLAGE.w, h: 74 },
  pre2: { x: COLLAGE.x, y: preY2, w: half, h: smallH },
  pre3: { x: COLLAGE.x, y: preY2 + smallH + GAP, w: half, h: smallH },
  pre4: { x: COLLAGE.x + half + GAP, y: preY2, w: half, h: 94 },
  pre5: { x: COLLAGE.x, y: preY3, w: COLLAGE.w, h: 74 },
  wed1: { x: COLLAGE.x, y: wedY1, w: COLLAGE.w, h: 72 },
  wed2: { x: COLLAGE.x, y: wedY2, w: half, h: 100 },
  wed3: { x: COLLAGE.x + half + GAP, y: wedY2, w: half, h: 100 },
  wed4: { x: COLLAGE.x, y: wedY3, w: COLLAGE.w, h: 69 },
};

export const SLOT_LABELS: { page: string; slots: { id: PhotoSlotId; label: string }[] }[] = [
  {
    page: "Page 1 · Cover",
    slots: [
      { id: "coverTop", label: "Top photo (full width)" },
      { id: "coverBottom", label: "Bottom photo (full width)" },
    ],
  },
  {
    page: "Page 2 · Prewedding stories",
    slots: [
      { id: "pre1", label: "Wide photo (top)" },
      { id: "pre2", label: "Small photo (upper left)" },
      { id: "pre3", label: "Small photo (lower left)" },
      { id: "pre4", label: "Tall photo (right)" },
      { id: "pre5", label: "Wide photo (bottom)" },
    ],
  },
  {
    page: "Page 3 · Wedding stories",
    slots: [
      { id: "wed1", label: "Wide photo (top)" },
      { id: "wed2", label: "Photo (left)" },
      { id: "wed3", label: "Photo (right)" },
      { id: "wed4", label: "Wide photo (bottom)" },
    ],
  },
];

export const DEFAULT_TERMS = [
  "50% advance payment on booking.",
  "Complete 90% payment before the event.",
  "Data will not be provided if 90% payment is not cleared.",
  "All payments must be cleared on album delivery.",
  "Travelling allowance above 50 km will be charged extra.",
  "Thanks for doing business with us!",
].join("\n");

export const defaultPdfFormat = (studio: {
  studioName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  ownerName?: string;
}): PdfFormat => ({
  logo: "",
  logoText: studio.studioName || "Your Studio",
  tagline: "Photography & Films",
  preHeading: "Prewedding Stories",
  weddingHeading: "Wedding Stories",
  packagesHeading: "Our Packages",
  summaryHeading: "Quotation Summary",
  termsHeading: "Terms & Conditions",
  terms: DEFAULT_TERMS,
  qr: "",
  qrCaption: "Scan & pay using any UPI app",
  contactName: studio.ownerName || studio.studioName || "",
  contactLines: [studio.phone, studio.email, [studio.city, studio.state].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join("\n"),
  photos: {},
});

export const resolvePdfFormat = (
  saved: Partial<PdfFormat> | undefined,
  studio: Parameters<typeof defaultPdfFormat>[0],
): PdfFormat => {
  const base = defaultPdfFormat(studio);
  const merged = { ...base, ...(saved || {}), photos: { ...(saved?.photos || {}) } };
  // A cleared heading or tagline falls back to the default instead of printing nothing.
  (["preHeading", "weddingHeading", "packagesHeading", "summaryHeading", "termsHeading"] as const).forEach((k) => {
    if (!merged[k].trim()) merged[k] = base[k];
  });
  return merged;
};

// ---------------------------------------------------------------- images

const JPEG_QUALITY = 0.78;
/** Output resolution for photos; 140 dpi is sharp on screen and keeps each photo near 100 KB. */
const PHOTO_DPI = 140;
const mmToPx = (mm: number, dpi = PHOTO_DPI) => Math.round((mm / 25.4) * dpi);

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = src;
  });

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

/**
 * Centre-crops an image to the target aspect ratio (cover fit, never stretched) and re-encodes it as a
 * JPEG sized for the slot. Returns the source unchanged when it already fits.
 */
export async function fitImage(
  src: string,
  wMm: number,
  hMm: number,
  opts: { dpi?: number; quality?: number; format?: "jpeg" | "png" } = {},
): Promise<string> {
  const img = await loadImage(src);
  const dpi = opts.dpi ?? PHOTO_DPI;
  const outW = Math.min(mmToPx(wMm, dpi), img.naturalWidth);
  const outH = Math.round(outW * (hMm / wMm));
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = wMm / hMm;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (srcAspect > dstAspect) sw = sh * dstAspect;
  else sh = sw / dstAspect;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not available in this browser");
  if (opts.format === "png") ctx.clearRect(0, 0, outW, outH);
  else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL(opts.format === "png" ? "image/png" : "image/jpeg", opts.quality ?? JPEG_QUALITY);
}

/** Logos and QR codes are scaled down to fit inside a box without cropping. */
export async function shrinkImage(src: string, maxPx: number, format: "jpeg" | "png"): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not available in this browser");
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.85);
}

/** Natural width / height of an image data URL. */
export async function imageAspect(src: string) {
  const img = await loadImage(src);
  return img.naturalWidth / img.naturalHeight;
}

// ---------------------------------------------------------------- drawing

export type PdfStudio = {
  studioName?: string;
};
export type PdfClient = { name?: string; email?: string; phone?: string };
export type PdfTotals = { subtotal: number; discount: number; total: number; balance: number };
export type QuotationPdfInput = {
  format: PdfFormat;
  /** Image URLs used for slots without an upload (cycled through). */
  defaultPhotos: string[];
  studio: PdfStudio;
  client?: PdfClient | undefined;
  number: string;
  version: number;
  issued: string;
  event: string;
  eventDate: string;
  location: string;
  packages: QuotePackage[];
  totals: PdfTotals;
  advance: number;
  /** Turn off stream compression (tests read the PDF text). */
  compress?: boolean;
  /** Used when the format has no terms of its own. */
  fallbackTerms: string;
};

const C = {
  burgundy: [107, 31, 46] as const,
  burgundyDark: [78, 20, 33] as const,
  gold: [184, 147, 90] as const,
  goldSoft: [229, 213, 184] as const,
  ivory: [251, 247, 238] as const,
  ink: [58, 44, 46] as const,
  muted: [128, 112, 108] as const,
  white: [255, 255, 255] as const,
};
type Rgb = readonly [number, number, number];
const fill = (p: jsPDF, c: Rgb) => p.setFillColor(c[0], c[1], c[2]);
const stroke = (p: jsPDF, c: Rgb) => p.setDrawColor(c[0], c[1], c[2]);
const ink = (p: jsPDF, c: Rgb) => p.setTextColor(c[0], c[1], c[2]);

// Built-in PDF fonts cannot draw the rupee sign, en dashes or curly quotes.
const plain = (t: string) =>
  t
    .replace(/₹\s?/g, "Rs. ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, "-")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "");
const rs = (n: number) => `Rs. ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const letterSpaced = (p: jsPDF, text: string, x: number, y: number, spacing: number, align: "left" | "center" | "right" = "left") => {
  const chars = [...text];
  const widths = chars.map((c) => p.getTextWidth(c));
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  chars.forEach((c, i) => {
    p.text(c, cx, y);
    cx += widths[i]! + spacing;
  });
};

async function fetchAsDataUrl(src: string) {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src);
  const blob = await res.blob();
  return readFileAsDataUrl(new File([blob], "image"));
}

/** Prepares every slot image once: uploaded or default, cropped to the slot and compressed. */
async function prepareSlots(input: QuotationPdfInput) {
  const ids = Object.keys(SLOT_BOXES) as PhotoSlotId[];
  const out = new Map<PhotoSlotId, string>();
  await Promise.all(
    ids.map(async (id, i) => {
      const box = SLOT_BOXES[id];
      const src = input.format.photos[id] || input.defaultPhotos[i % Math.max(1, input.defaultPhotos.length)];
      if (!src) return;
      try {
        out.set(id, await fitImage(await fetchAsDataUrl(src), box.w, box.h));
      } catch {
        // A slot that cannot be loaded keeps its tinted placeholder.
      }
    }),
  );
  return out;
}

async function optional(src: string, maxPx: number, format: "jpeg" | "png") {
  if (!src) return undefined;
  try {
    return { data: await shrinkImage(src, maxPx, format), aspect: await imageAspect(src), format };
  } catch {
    return undefined;
  }
}

export async function buildQuotationPdf(input: QuotationPdfInput): Promise<jsPDF> {
  const { jsPDF: PDF } = await import("jspdf");
  const p = new PDF({ unit: "mm", format: "a4", compress: input.compress ?? true });
  const f = input.format;
  const photos = await prepareSlots(input);
  const logo = await optional(f.logo, 700, "png");
  const qr = await optional(f.qr, 500, "png");

  const photo = (id: PhotoSlotId) => {
    const b = SLOT_BOXES[id];
    const data = photos.get(id);
    if (data) p.addImage(data, "JPEG", b.x, b.y, b.w, b.h, undefined, "FAST");
    else {
      fill(p, C.goldSoft);
      p.rect(b.x, b.y, b.w, b.h, "F");
    }
  };
  const headingPage = (title: string, slots: PhotoSlotId[]) => {
    p.addPage();
    p.setFont("times", "bold");
    p.setFontSize(23);
    ink(p, C.burgundy);
    p.text(plain(title), PAGE.w / 2, 22, { align: "center" });
    stroke(p, C.gold);
    p.setLineWidth(0.4);
    p.line(PAGE.w / 2 - 14, 27, PAGE.w / 2 + 14, 27);
    slots.forEach(photo);
  };

  // Page 1: cover.
  photo("coverTop");
  photo("coverBottom");
  fill(p, C.ivory);
  p.rect(0, COVER_H, PAGE.w, PAGE.h - 2 * COVER_H, "F");
  const bandMid = PAGE.h / 2;
  if (logo) {
    const maxW = 80;
    const maxH = 24;
    const w = Math.min(maxW, maxH * logo.aspect);
    const h = w / logo.aspect;
    p.addImage(logo.data, logo.format === "png" ? "PNG" : "JPEG", PAGE.w / 2 - w / 2, bandMid - h / 2 - 4, w, h);
  } else {
    p.setFont("times", "bold");
    p.setFontSize(26);
    ink(p, C.burgundy);
    p.text(plain(f.logoText), PAGE.w / 2, bandMid - 1, { align: "center", maxWidth: 170 });
  }
  if (f.tagline.trim()) {
    p.setFont("helvetica", "normal");
    p.setFontSize(10);
    ink(p, C.gold);
    letterSpaced(p, plain(f.tagline).toUpperCase(), PAGE.w / 2, bandMid + 12, 1.4, "center");
  }

  headingPage(f.preHeading, ["pre1", "pre2", "pre3", "pre4", "pre5"]);
  headingPage(f.weddingHeading, ["wed1", "wed2", "wed3", "wed4"]);

  // ----------------------------------------------------------- packages
  const M = PAGE.margin;
  const W = PAGE.w - 2 * M;
  const BOTTOM = PAGE.h - 20;
  let y = 0;
  const packagePages: number[] = [];

  const newPage = () => {
    p.addPage();
    packagePages.push(p.getNumberOfPages());
    stroke(p, C.goldSoft);
    p.setLineWidth(0.25);
    p.line(M, 16, PAGE.w - M, 16);
    p.setFont("helvetica", "normal");
    p.setFontSize(7.5);
    ink(p, C.muted);
    letterSpaced(p, plain(f.logoText).toUpperCase(), M, 13, 0.6);
    letterSpaced(p, `QUOTATION ${plain(input.number)}`, PAGE.w - M, 13, 0.6, "right");
    y = 28;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };
  const sectionTitle = (title: string, sub?: string) => {
    p.setFont("times", "bold");
    p.setFontSize(21);
    ink(p, C.burgundy);
    p.text(plain(title), M, y + 6);
    stroke(p, C.gold);
    p.setLineWidth(0.5);
    p.line(M, y + 10, M + 16, y + 10);
    if (sub) {
      p.setFont("helvetica", "normal");
      p.setFontSize(8.5);
      ink(p, C.muted);
      p.text(plain(sub), PAGE.w - M, y + 6, { align: "right" });
    }
    y += 18;
  };

  newPage();
  sectionTitle(
    f.packagesHeading,
    `Ref ${input.number} v${input.version}  |  Issued ${input.issued}`,
  );

  const colW = (W - 14) / 2;
  const LINE = 4.6;
  const wrap = (text: string, width: number, font: [string, string], size: number) => {
    p.setFont(font[0], font[1]);
    p.setFontSize(size);
    return p.splitTextToSize(plain(text), width) as string[];
  };

  input.packages.forEach((pkg, index) => {
    const team = pkg.team.map((t) => wrap(`${t.qty} x ${t.role}`, colW - 5, ["helvetica", "normal"], 9.5));
    const materials = pkg.materials.filter((m) => m.trim()).map((m) => wrap(m, colW - 5, ["helvetica", "normal"], 9.5));
    const titleLines = wrap(pkg.title || "Package", W - 78, ["times", "bold"], 15).slice(0, 2);
    const note = pkg.gift.trim() ? wrap(pkg.gift, W - 16, ["helvetica", "italic"], 9) : [];
    const listH = (l: string[][]) => l.reduce((s, x) => s + x.length * LINE + 1.2, 0);
    const headH = 10 + titleLines.length * 6.4 + (pkg.countInTotal ? 0 : 5);
    const bodyH = Math.max(listH(team), listH(materials), 8) + 9;
    const noteH = note.length ? note.length * 4.4 + 8 : 0;
    const cardH = headH + bodyH + noteH + 4;
    // A card never splits across pages.
    ensure(cardH + 8);

    const top = y;
    fill(p, C.ivory);
    stroke(p, C.goldSoft);
    p.setLineWidth(0.3);
    p.roundedRect(M, top, W, cardH, 1.5, 1.5, "FD");
    fill(p, C.burgundy);
    p.rect(M, top, 1.8, cardH, "F");

    // Header: number, title, price.
    const L = M + 8;
    p.setFont("helvetica", "bold");
    p.setFontSize(7.5);
    ink(p, C.gold);
    letterSpaced(p, `PACKAGE ${String(index + 1).padStart(2, "0")}`, L, top + 7, 1);
    p.setFont("times", "bold");
    p.setFontSize(15);
    ink(p, C.burgundy);
    titleLines.forEach((line, i) => p.text(line, L, top + 14 + i * 6.4));
    p.setFont("times", "bold");
    p.setFontSize(17);
    p.text(rs(pkg.price), M + W - 7, top + 14, { align: "right" });
    if (!pkg.countInTotal) {
      p.setFont("helvetica", "italic");
      p.setFontSize(7.5);
      ink(p, C.muted);
      p.text("Option - not included in the total", M + W - 7, top + 19, { align: "right" });
    }
    const ruleY = top + headH;
    stroke(p, C.goldSoft);
    p.line(L, ruleY, M + W - 7, ruleY);

    // Body: two columns.
    const col = (x: number, label: string, lines: string[][]) => {
      p.setFont("helvetica", "bold");
      p.setFontSize(7);
      ink(p, C.gold);
      letterSpaced(p, label, x, ruleY + 6, 0.9);
      let ly = ruleY + 12;
      p.setFont("helvetica", "normal");
      p.setFontSize(9.5);
      lines.forEach((wrapped) => {
        fill(p, C.gold);
        p.circle(x + 1, ly - 1.1, 0.5, "F");
        ink(p, C.ink);
        p.text(wrapped, x + 4.5, ly);
        ly += wrapped.length * LINE + 1.2;
      });
    };
    col(L, "TEAM", team);
    col(L + colW + 6, "MATERIAL PROVIDED BY US", materials);

    if (note.length) {
      const noteY = ruleY + bodyH;
      stroke(p, C.goldSoft);
      p.line(L, noteY, M + W - 7, noteY);
      p.setFont("helvetica", "bold");
      p.setFontSize(7);
      ink(p, C.gold);
      letterSpaced(p, "ADD-ONS / GIFT / NOTE", L, noteY + 5.5, 0.9);
      p.setFont("helvetica", "italic");
      p.setFontSize(9);
      ink(p, C.ink);
      p.text(note, L, noteY + 10.5);
    }
    y = top + cardH + 7;
  });
  if (!input.packages.length) {
    p.setFont("helvetica", "italic");
    p.setFontSize(10);
    ink(p, C.muted);
    p.text("No packages added to this quotation.", M, y + 4);
    y += 14;
  }

  // ----------------------------------------------------------- summary
  const t = input.totals;
  const counted = input.packages.some((pk) => pk.countInTotal);
  const clientLines: [string, string][] = [
    ["Client", input.client?.name || "Client"],
    ["Phone", input.client?.phone || ""],
    ["Email", input.client?.email || ""],
    ["Event", input.event],
    ["Event date", input.eventDate],
    ["Venue", input.location],
  ];
  const shownClient = clientLines.filter(([, v]) => v);
  const rows: [string, number, boolean?][] = counted
    ? [
        ["Subtotal", t.subtotal],
        ...(t.discount ? ([["Discount", -t.discount]] as [string, number][]) : []),
        ["Total", t.total, true],
        ["Advance requested", input.advance],
        ["Balance", t.balance],
      ]
    : [];
  const boxH = Math.max(shownClient.length * 7 + 5, rows.length * 8 + 8, 24);
  ensure(18 + boxH + 10);
  sectionTitle(f.summaryHeading);
  const sTop = y;
  fill(p, C.white);
  stroke(p, C.goldSoft);
  p.setLineWidth(0.3);
  p.roundedRect(M, sTop, W, boxH, 1.5, 1.5, "S");
  const cx = M + 7;
  shownClient.forEach(([label, value], i) => {
    const ry = sTop + 9 + i * 7;
    p.setFont("helvetica", "bold");
    p.setFontSize(7);
    ink(p, C.gold);
    letterSpaced(p, label.toUpperCase(), cx, ry, 0.7);
    p.setFont(i === 0 ? "times" : "helvetica", i === 0 ? "bold" : "normal");
    p.setFontSize(i === 0 ? 11.5 : 9.5);
    ink(p, i === 0 ? C.burgundy : C.ink);
    p.text(plain(value), cx + 28, ry, { maxWidth: 50 });
  });
  const tx = M + W / 2 + 6;
  const tw = W / 2 - 13;
  if (counted) {
    rows.forEach(([label, value, strong], i) => {
      const ry = sTop + 11 + i * 8;
      if (strong) {
        fill(p, C.burgundy);
        p.roundedRect(tx - 3, ry - 6, tw + 6, 9, 1, 1, "F");
        ink(p, C.white);
        p.setFont("times", "bold");
        p.setFontSize(12);
      } else {
        ink(p, C.ink);
        p.setFont("helvetica", "normal");
        p.setFontSize(9.5);
      }
      p.text(label, tx, ry);
      p.text(value < 0 ? `- ${rs(-value)}` : rs(value), tx + tw, ry, { align: "right" });
    });
  } else {
    p.setFont("helvetica", "italic");
    p.setFontSize(9);
    ink(p, C.muted);
    p.text(["All packages are options.", "No total is calculated."], tx, sTop + 11);
  }
  y = sTop + boxH + 10;

  // ----------------------------------------------------------- terms, QR, contact
  const termLines = (f.terms.trim() || input.fallbackTerms)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const termW = W - 14;
  const wrappedTerms = termLines.map((l) => wrap(l.replace(/^\d+[.)]\s*/, ""), termW - 7, ["helvetica", "normal"], 9));
  const termsH = 16 + wrappedTerms.reduce((s, w) => s + w.length * 4.3 + 1.6, 0);
  const contactLines = f.contactLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const qrBox = 34;
  const footH = Math.max(qrBox + 22, 30 + contactLines.length * 5.5 + 8);
  // Terms, QR and contact stay together on the closing page.
  ensure(termsH + footH + 8);
  sectionTitle(f.termsHeading);
  p.setFontSize(9);
  wrappedTerms.forEach((w, i) => {
    p.setFont("helvetica", "bold");
    ink(p, C.gold);
    p.text(`${i + 1}.`, M, y);
    p.setFont("helvetica", "normal");
    ink(p, C.ink);
    p.text(w, M + 7, y);
    y += w.length * 4.3 + 1.6;
  });
  y += 6;

  // Closing band: QR on the left, contact on the right.
  ensure(footH);
  const fTop = y;
  fill(p, C.burgundy);
  p.roundedRect(M, fTop, W, footH, 1.5, 1.5, "F");
  const qx = M + 8;
  const qy = fTop + (footH - (qrBox + 8)) / 2;
  fill(p, C.white);
  p.roundedRect(qx - 3, qy - 3, qrBox + 6, qrBox + 14, 1.5, 1.5, "F");
  if (qr) {
    const w = Math.min(qrBox, qrBox * qr.aspect);
    const h = w / qr.aspect;
    p.addImage(qr.data, "PNG", qx + (qrBox - w) / 2, qy + (qrBox - h) / 2, w, h);
  } else {
    stroke(p, C.goldSoft);
    p.setLineWidth(0.3);
    p.rect(qx, qy, qrBox, qrBox);
    p.setFont("helvetica", "italic");
    p.setFontSize(7.5);
    ink(p, C.muted);
    p.text("QR code", qx + qrBox / 2, qy + qrBox / 2, { align: "center" });
  }
  if (f.qrCaption.trim()) {
    p.setFont("helvetica", "normal");
    p.setFontSize(6.5);
    ink(p, C.burgundy);
    p.text(plain(f.qrCaption), qx + qrBox / 2, qy + qrBox + 5, { align: "center", maxWidth: qrBox + 4 });
  }
  const kx = M + W - 8;
  let ky = fTop + 13;
  p.setFont("helvetica", "bold");
  p.setFontSize(7.5);
  ink(p, C.goldSoft);
  letterSpaced(p, "GET IN TOUCH", kx, ky, 1.2, "right");
  ky += 8;
  if (f.contactName.trim()) {
    p.setFont("times", "bold");
    p.setFontSize(14);
    ink(p, C.white);
    p.text(plain(f.contactName), kx, ky, { align: "right", maxWidth: W - qrBox - 30 });
    ky += 7;
  }
  p.setFont("helvetica", "normal");
  p.setFontSize(9.5);
  ink(p, C.ivory);
  contactLines.forEach((line) => {
    p.text(plain(line), kx, ky, { align: "right", maxWidth: W - qrBox - 30 });
    ky += 5.5;
  });

  // Footer on every package/summary page.
  const total = p.getNumberOfPages();
  packagePages.forEach((page, i) => {
    p.setPage(page);
    p.setFont("helvetica", "normal");
    p.setFontSize(7.5);
    ink(p, C.muted);
    p.text(`Page ${i + 1} of ${packagePages.length}`, PAGE.w / 2, PAGE.h - 10, { align: "center" });
  });
  p.setPage(total);
  return p;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Builds the quotation PDF for a saved quotation. `format` overrides the saved format (used by the settings preview). */
export function buildQuotationFor(
  data: Platform,
  q: Quote,
  format?: Partial<PdfFormat>,
  opts: { compress?: boolean } = {},
) {
  const studio = getStudio();
  const resolved = resolvePdfFormat(format ?? data.settings.pdfFormat, studio);
  const client = data.clients.find((c) => c.id === q.clientId);
  // Terms edited on one quotation win; otherwise the PDF format's terms apply.
  const customTerms = q.terms && q.terms !== data.settings.quoteTerms ? q.terms : "";
  return buildQuotationPdf({
    format: customTerms ? { ...resolved, terms: customTerms } : resolved,
    defaultPhotos: DEFAULT_PHOTOS,
    studio,
    client,
    number: q.number,
    version: q.version || 1,
    issued: formatDate(todayIso()),
    event: q.event,
    eventDate: q.date ? formatDate(q.date) : "",
    location: q.location,
    packages: quotePackagesOf(q),
    totals: quoteTotals(q),
    advance: q.advance,
    fallbackTerms: q.terms,
    ...opts,
  });
}
