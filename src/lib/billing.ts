import { ApiError, request } from "./auth";

export type BillingCycle = "monthly" | "yearly";

export type Plan = {
  slug: string;
  name: string;
  tagline: string;
  /** Rupees per month, before GST. null = monthly billing not offered. */
  price_monthly: number | null;
  /** Rupees for the whole year, before GST. null = yearly billing not offered. */
  price_yearly: number | null;
  is_featured: boolean;
  features: string[];
};

export type PlanCatalog = {
  trial_days: number;
  gst_percent: number;
  currency: string;
  plans: Plan[];
};

export type AccessState =
  "trialing" | "trial_expired" | "active" | "grace" | "expired" | "suspended";

export type Subscription = {
  state: AccessState;
  state_label: string;
  has_access: boolean;
  access_ends_at: string | null;
  days_left: number;
  grace_days: number;
  plan: Plan | null;
  billing_cycle: BillingCycle | "";
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

export type PaymentRecord = {
  receipt: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  /** All amounts are in paise. */
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  currency: string;
  status: "paid" | "failed";
  failure_reason: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  paid_at: string | null;
  razorpay_payment_id: string | null;
};

type CheckoutOrder = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: { error: { description?: string } }) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export const SUBSCRIPTION_CHANGED_EVENT = "frameflow:subscription-changed";

export function fetchPlanCatalog() {
  return request<PlanCatalog>("/api/billing/plans/", null, "GET");
}

export function fetchSubscription() {
  return request<Subscription>("/api/billing/subscription/", null, "GET", true);
}

export function fetchPaymentHistory() {
  return request<PaymentRecord[]>("/api/billing/payments/", null, "GET", true);
}

/** Price shown per month: the monthly price, or the yearly price spread over 12 months. */
export function monthlyEquivalent(plan: Plan, cycle: BillingCycle) {
  if (cycle === "monthly") return plan.price_monthly;
  return plan.price_yearly ? Math.round(plan.price_yearly / 12) : null;
}

export function yearlySavingPercent(plans: Plan[]) {
  const savings = plans
    .filter((p) => p.price_monthly && p.price_yearly)
    .map((p) => 1 - p.price_yearly! / (p.price_monthly! * 12));
  return savings.length ? Math.round(Math.max(...savings) * 100) : 0;
}

export const paise = (amount: number) =>
  "₹" +
  (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: amount % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });

export const longDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

/** One line under the status pill that says exactly what happens next. */
export function subscriptionSummary(s: Subscription) {
  const days = `${s.days_left} day${s.days_left === 1 ? "" : "s"}`;
  switch (s.state) {
    case "trialing":
      return `Your free trial ends on ${longDate(s.trial_ends_at)} (${days} left). Paid time starts after the trial, so choosing a plan now loses nothing.`;
    case "active":
      return `Paid until ${longDate(s.current_period_end)}. Renew early and the new period is added on top.`;
    case "grace":
      return `Your plan expired on ${longDate(s.current_period_end)}. Renew within ${days} to avoid the workspace becoming read-only.`;
    case "trial_expired":
      return "Your free trial has ended. Your workspace is read-only until you choose a plan. All your data is safe.";
    case "expired":
      return `Your plan expired on ${longDate(s.current_period_end)}. Your workspace is read-only until you renew. All your data is safe.`;
    case "suspended":
      return "This account is suspended. Please contact support.";
  }
}

let checkoutScript: Promise<void> | null = null;

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  checkoutScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScript = null;
      reject(
        new ApiError("Could not load the payment window. Check your connection and try again."),
      );
    };
    document.body.appendChild(script);
  });
  return checkoutScript;
}

/**
 * Runs the whole payment: creates the order on our server, opens Razorpay Checkout, then has the
 * server verify Razorpay's signature. Resolves with the updated subscription, or null if the
 * customer closed the window without paying.
 */
export async function purchasePlan(
  plan: Plan,
  cycle: BillingCycle,
  onAttemptFailed: (reason: string) => void,
): Promise<Subscription | null> {
  const [order] = await Promise.all([
    request<CheckoutOrder>(
      "/api/billing/checkout/",
      { plan: plan.slug, billing_cycle: cycle },
      "POST",
      true,
    ),
    loadRazorpayCheckout(),
  ]);
  if (!window.Razorpay) throw new ApiError("The payment window is unavailable. Please try again.");

  const paid = await new Promise<RazorpaySuccess | null>((resolve) => {
    const checkout = new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: order.prefill,
      theme: { color: "#4f6b47" },
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
    });
    // Razorpay keeps the window open after a failure so the customer can retry with another method,
    // so a failure only reports the reason; a later success still resolves through `handler`.
    checkout.on("payment.failed", (response) => {
      onAttemptFailed(response.error.description || "The payment did not go through.");
    });
    checkout.open();
  });
  if (!paid) return null;

  const subscription = await request<Subscription>("/api/billing/verify/", paid, "POST", true);
  window.dispatchEvent(new CustomEvent(SUBSCRIPTION_CHANGED_EVENT, { detail: subscription }));
  return subscription;
}
