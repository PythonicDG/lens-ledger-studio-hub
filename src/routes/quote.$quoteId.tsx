import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { decidePublicQuote, fetchPublicQuote, type PublicQuote } from "@/lib/auth";
import { formatDate, money } from "@/lib/platform";

export const Route = createFileRoute("/quote/$quoteId")({ component: QuoteDecision });

function QuoteDecision() {
  const { quoteId } = Route.useParams();
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    fetchPublicQuote(quoteId)
      .then(setQuote)
      .catch(() => setError("This quotation is unavailable."));
  }, [quoteId]);
  if (!quote)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-3xl">{error || "Loading quotation..."}</h1>
        </div>
      </main>
    );
  const q = quote.snapshot;
  const decide = async (status: "Accepted" | "Rejected" | "Changes requested") => {
    setBusy(true);
    try {
      await decidePublicQuote(quoteId, status, feedback);
      setQuote({ ...quote, status });
      toast.success(`Quotation ${status.toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record decision.");
      void fetchPublicQuote(quoteId).then(setQuote);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#f5f6f1] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="bg-[#222a23] px-7 py-8 text-white sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/55">
            PROPOSAL FROM
          </p>
          <h1 className="mt-2 text-3xl text-white">{quote.studio_name}</h1>
          <p className="mt-2 text-xs text-white/60">{quote.studio_city}</p>
        </div>
        <div className="p-7 sm:p-10">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-olive">
                QUOTATION {q.number} · v{quote.version || 1}
              </p>
              <h2 className="mt-2 text-2xl">{q.event}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                For {q.client_name} · {formatDate(q.date)}
              </p>
              <p className="text-sm text-muted-foreground">{q.location}</p>
            </div>
            <span className="h-fit rounded-full bg-[#e8eee5] px-3 py-1 text-xs font-semibold text-olive">
              {quote.status}
            </span>
          </div>
          {q.packages ? (
            <div className="mt-8 space-y-4">
              {q.packages.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl bg-[#f6f9f3] p-5 ${p.count_in_total ? "" : "border border-dashed border-olive/50"}`}
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-display text-xl">{p.title}</p>
                    <strong>{money(p.price)}</strong>
                  </div>
                  {!p.count_in_total && (
                    <p className="text-xs text-muted-foreground">Option — not included in the total</p>
                  )}
                  {[
                    ["Team", p.team.map((t) => `${t.qty} × ${t.role}`)],
                    ["Material provided by us", p.materials],
                  ].map(([title, lines]) =>
                    (lines as string[]).length ? (
                      <div key={title as string} className="mt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {title as string}
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {(lines as string[]).map((line, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-olive">✓</span>
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                  {p.gift && (
                    <p className="mt-4 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm">{p.gift}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {q.package_details && (
                <div className="mt-8 rounded-xl bg-[#f6f9f3] p-5">
                  <p className="font-display text-xl">{q.package_details.name}</p>
                  {[
                    ["Team", q.package_details.team],
                    ["Material provided by us", q.package_details.deliverables],
                  ].map(([title, lines]) =>
                    (lines as string[]).length ? (
                      <div key={title as string} className="mt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {title as string}
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {(lines as string[]).map((line, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-olive">✓</span>
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                  {q.package_details.notes && (
                    <p className="mt-4 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm">
                      {q.package_details.notes}
                    </p>
                  )}
                </div>
              )}
              <div className="mt-8 border-t border-border pt-5">
                {q.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <span>{item.name}</span>
                    <strong>{money(item.price)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
          {(!q.packages || q.packages.some((p) => p.count_in_total)) && (
            <div className="mt-5 border-t border-border pt-5 text-sm">
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>{money(q.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Discount</span>
                <span>− {money(q.discount)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-4 text-lg font-bold">
                <span>Total</span>
                <span>{money(q.total)}</span>
              </div>
              <div className="flex justify-between py-1 text-olive">
                <span>Advance to confirm</span>
                <span>{money(q.advance)}</span>
              </div>
            </div>
          )}
          <p className="mt-7 rounded-xl bg-[#f7f8f4] p-4 text-xs leading-relaxed text-muted-foreground">
            {q.terms}
          </p>
          {quote.status === "Pending" ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                disabled={busy}
                onClick={() => void decide("Rejected")}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:border-rose-400 disabled:opacity-50"
              >
                <X size={17} /> Decline quotation
              </button>
              <button
                disabled={busy}
                onClick={() => void decide("Accepted")}
                className="flex items-center justify-center gap-2 rounded-xl bg-olive px-5 py-3 text-sm font-semibold text-white hover:bg-foreground disabled:opacity-50"
              >
                <Check size={17} /> Accept quotation
              </button>
              <button
                disabled={busy}
                onClick={() => setRequestingChanges(!requestingChanges)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:border-olive disabled:opacity-50 sm:col-span-2"
              >
                <MessageSquare size={17} /> Request changes
              </button>
              {requestingChanges && (
                <div className="space-y-3 sm:col-span-2">
                  <label htmlFor="quote-feedback" className="block text-sm font-medium">Note or target price</label>
                  <textarea id="quote-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-xl border border-border p-3 text-sm" placeholder="Tell the studio what you would like changed" />
                  <button disabled={busy || !feedback.trim()} onClick={() => void decide("Changes requested")} className="rounded-xl bg-olive px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Send request</button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-xl bg-[#e8eee5] p-4 text-center text-sm font-semibold">
              {quote.status === "Accepted"
                ? "Thank you. Your studio will confirm the booking shortly."
                : quote.status === "Changes requested"
                  ? "Your request has been sent to the studio. Please check this link for a revised quotation."
                  : "Your decision has been recorded."}
            </div>
          )}
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Powered by FrameFlow</p>
    </main>
  );
}
