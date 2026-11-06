import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/auth";
import {
  fetchPaymentHistory,
  longDate,
  subscriptionSummary,
  fetchPlanCatalog,
  monthlyEquivalent,
  paise,
  purchasePlan,
  yearlySavingPercent,
  type BillingCycle,
  type PaymentRecord,
  type Plan,
  type PlanCatalog,
  type Subscription,
} from "@/lib/billing";
import { inr } from "@/lib/flow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const card = "rounded-2xl border border-border/80 bg-white shadow-[0_5px_30px_rgba(30,34,25,.035)]";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-40";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition hover:border-olive hover:text-olive disabled:cursor-not-allowed disabled:opacity-40";

type Tone = "green" | "amber" | "red" | "neutral";
const stateTone: Record<Subscription["state"], Tone> = {
  trialing: "green",
  active: "green",
  grace: "amber",
  trial_expired: "red",
  expired: "red",
  suspended: "red",
};
const toneClass: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  neutral: "bg-stone-100 text-stone-600",
};

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

type Pending = { plan: Plan; cycle: BillingCycle };

export function SubscriptionSettings({
  subscription,
  onChange,
}: {
  subscription: Subscription | null;
  onChange: (subscription: Subscription) => void;
}) {
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busyPlan, setBusyPlan] = useState("");
  const [confirmSwitch, setConfirmSwitch] = useState<Pending | null>(null);

  const loadPayments = () =>
    fetchPaymentHistory()
      .then(setPayments)
      .catch(() => {});
  const loadCatalog = () => {
    setCatalogError("");
    fetchPlanCatalog()
      .then(setCatalog)
      .catch((error) =>
        setCatalogError(error instanceof ApiError ? error.message : "Could not load plans."),
      );
  };
  useEffect(() => {
    loadCatalog();
    void loadPayments();
  }, []);
  useEffect(() => {
    if (subscription?.billing_cycle) setCycle(subscription.billing_cycle);
  }, [subscription?.billing_cycle]);

  const plans = useMemo(() => catalog?.plans ?? [], [catalog]);
  const offersYearly = plans.some((p) => p.price_yearly);
  const offersMonthly = plans.some((p) => p.price_monthly);
  const saving = useMemo(() => yearlySavingPercent(plans), [plans]);
  useEffect(() => {
    // Keep the toggle on a cycle that actually has plans.
    if (catalog && cycle === "yearly" && !offersYearly) setCycle("monthly");
    if (catalog && cycle === "monthly" && !offersMonthly) setCycle("yearly");
  }, [catalog, cycle, offersMonthly, offersYearly]);

  const currentSlug = subscription?.plan?.slug;
  const paidTimeLeft = subscription?.state === "active" && subscription.days_left > 0;
  const isCurrent = (plan: Plan) =>
    currentSlug === plan.slug && subscription?.billing_cycle === cycle;

  const pay = async ({ plan, cycle: chosen }: Pending) => {
    setBusyPlan(plan.slug);
    try {
      const updated = await purchasePlan(plan, chosen, (reason) => toast.error(reason));
      if (!updated) return; // Window closed without paying.
      onChange(updated);
      toast.success(
        `Payment received. Your ${plan.name} plan is active until ${longDate(updated.current_period_end)}.`,
      );
      void loadPayments();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Payment could not be completed.");
    } finally {
      setBusyPlan("");
    }
  };

  const choose = (plan: Plan) => {
    const switching = paidTimeLeft && !isCurrent(plan);
    if (switching) setConfirmSwitch({ plan, cycle });
    else void pay({ plan, cycle });
  };

  if (!subscription) {
    return (
      <div className={`${card} flex items-center gap-3 p-6 text-sm text-muted-foreground`}>
        <Loader2 size={16} className="animate-spin" /> Loading your subscription…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${card} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-olive">
              Current plan
            </p>
            <h2 className="mt-2 text-2xl">
              {subscription.plan && !["trialing", "trial_expired"].includes(subscription.state)
                ? `${subscription.plan.name} · ${subscription.billing_cycle === "yearly" ? "Yearly" : "Monthly"}`
                : "Free trial"}
            </h2>
          </div>
          <Pill tone={stateTone[subscription.state]}>{subscription.state_label}</Pill>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {subscriptionSummary(subscription)}
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Trial ends</dt>
            <dd className="mt-1 font-medium">{longDate(subscription.trial_ends_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Current period</dt>
            <dd className="mt-1 font-medium">
              {subscription.current_period_start
                ? `${longDate(subscription.current_period_start)} – ${longDate(subscription.current_period_end)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Full access until</dt>
            <dd className="mt-1 font-medium">{longDate(subscription.access_ends_at)}</dd>
          </div>
        </dl>
      </section>

      {subscription.state !== "suspended" && (
        <section className={`${card} p-6 sm:p-8`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">
                {subscription.state === "active" ? "Renew or change plan" : "Choose a plan"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay securely with UPI, card, net banking or wallet. Prices exclude{" "}
                {catalog?.gst_percent ?? 18}% GST.
              </p>
            </div>
            {offersMonthly && offersYearly && (
              <div
                className="inline-flex rounded-full border border-border bg-[#f7f7f2] p-1 text-sm"
                role="tablist"
                aria-label="Billing cycle"
              >
                {(["monthly", "yearly"] as const).map((value) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={cycle === value}
                    onClick={() => setCycle(value)}
                    className={`rounded-full px-4 py-1.5 capitalize transition ${cycle === value ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {value}
                    {value === "yearly" && saving > 0 && (
                      <span className="ml-1 text-xs text-amber-600">−{saving}%</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {catalogError && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {catalogError}
              <button className={secondary} onClick={loadCatalog}>
                Try again
              </button>
            </div>
          )}
          {!catalog && !catalogError && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading plans…
            </div>
          )}
          {catalog && plans.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              No plans are available right now. Please contact support.
            </p>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const perMonth = monthlyEquivalent(plan, cycle);
              const total = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
              const current = isCurrent(plan);
              const busy = busyPlan === plan.slug;
              return (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-6 ${current ? "border-olive ring-2 ring-olive/20" : plan.is_featured ? "border-foreground/30" : "border-border"}`}
                >
                  {plan.is_featured && !current && (
                    <span className="absolute -top-2.5 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
                  {current && (
                    <span className="absolute -top-2.5 left-6 rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Your plan
                    </span>
                  )}
                  <p className="text-xl font-semibold">{plan.name}</p>
                  {plan.tagline && (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  )}
                  {perMonth && total ? (
                    <>
                      <p className="mt-5 text-3xl font-semibold tracking-tight">
                        {inr(perMonth)}
                        <span className="text-sm font-normal text-muted-foreground"> /month</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cycle === "yearly" ? `${inr(total)} billed yearly` : "Billed monthly"} · +
                        GST
                      </p>
                    </>
                  ) : (
                    <p className="mt-5 text-sm text-muted-foreground">
                      Not available with {cycle} billing.
                    </p>
                  )}
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-olive" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`${current ? secondary : btn} mt-6 w-full`}
                    disabled={!total || Boolean(busyPlan)}
                    onClick={() => choose(plan)}
                  >
                    {busy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CreditCard size={16} />
                    )}
                    {busy
                      ? "Opening payment…"
                      : current
                        ? "Renew this plan"
                        : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-olive" />
            Payments are processed by Razorpay. We never see or store your card or UPI details.
          </p>
        </section>
      )}

      <section className={`${card} p-6 sm:p-8`}>
        <h2 className="text-2xl">Billing history</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.receipt} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">{longDate(payment.paid_at || payment.created_at)}</td>
                    <td className="py-3 pr-4">
                      {payment.plan_name}{" "}
                      <span className="text-muted-foreground">· {payment.billing_cycle}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {payment.period_start
                        ? `${longDate(payment.period_start)} – ${longDate(payment.period_end)}`
                        : "—"}
                    </td>
                    <td
                      className="py-3 pr-4"
                      title={`${paise(payment.base_amount)} + ${paise(payment.gst_amount)} GST`}
                    >
                      {paise(payment.total_amount)}
                    </td>
                    <td className="py-3 pr-4">
                      {payment.status === "paid" ? (
                        <Pill tone="green">Paid</Pill>
                      ) : (
                        <span title={payment.failure_reason}>
                          <Pill tone="red">Failed</Pill>
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {payment.razorpay_payment_id || payment.receipt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog
        open={Boolean(confirmSwitch)}
        onOpenChange={(open) => !open && setConfirmSwitch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {confirmSwitch?.plan.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your new plan starts as soon as the payment succeeds. The {subscription.days_left}{" "}
              remaining day
              {subscription.days_left === 1 ? "" : "s"} of your current {subscription.plan?.name}{" "}
              plan are not carried over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmSwitch) void pay(confirmSwitch);
                setConfirmSwitch(null);
              }}
            >
              Continue to payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
