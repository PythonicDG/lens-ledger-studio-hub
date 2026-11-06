import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, FileSpreadsheet } from "lucide-react";
import hero from "@/assets/hero-wedding.jpg";
import bts from "@/assets/bts.jpg";
import portrait from "@/assets/portrait.jpg";
import { SiteNav, SiteFooter } from "@/components/site";
import { DashboardMock } from "@/components/dashboard-mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FrameFlow — Run your photography studio in one place" },
      {
        name: "description",
        content:
          "Replace WhatsApp chats, spreadsheets and paperwork with one system for quotations, bookings, shoots and billing.",
      },
      { property: "og:title", content: "FrameFlow — Run your photography studio in one place" },
      {
        property: "og:description",
        content: "The studio management system built for Indian photographers.",
      },
    ],
  }),
  component: Landing,
});

const stages = [
  [
    "01",
    "Quotation",
    "Add client details, build a branded quote with GST and send it for approval.",
  ],
  ["02", "Booking", "Advance collected via UPI, dates locked on the shoot calendar."],
  ["03", "Shoot", "Crew, equipment and call sheets assigned per event — haldi to reception."],
];

function Landing() {
  return (
    <div className="bg-background">
      {/* HERO — asymmetric split */}
      <section className="relative overflow-hidden">
        <SiteNav />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-32 lg:grid-cols-12 lg:pt-36">
          <div className="lg:col-span-6 lg:pt-10 animate-rise">
            <p className="eyebrow text-olive">Studio management · Made for India</p>
            <h1 className="mt-6 text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              You frame the moments.
              <br />
              <em className="text-ember">We run the studio.</em>
            </h1>
            <p className="mt-8 max-w-lg text-lg text-muted-foreground">
              FrameFlow replaces scattered WhatsApp chats, spreadsheets and paper diaries with one
              organised system — from first quotation to final payment.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition hover:bg-olive"
              >
                Start 15-day free trial{" "}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-medium underline decoration-olive underline-offset-8"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              No card required · Setup in 10 minutes · Trusted by 1,200+ studios
            </p>
          </div>
          <div className="relative h-[520px] lg:col-span-6 lg:h-[640px]">
            <img
              src={hero}
              alt="Bride in red lehenga at golden hour"
              width={1024}
              height={1280}
              className="absolute right-0 top-0 h-[88%] w-[72%] rounded-sm object-cover shadow-print"
            />
            <img
              src={portrait}
              alt="Studio portrait"
              width={896}
              height={1152}
              loading="lazy"
              className="absolute bottom-0 left-0 h-[46%] w-[38%] rounded-sm border-8 border-background object-cover shadow-print"
            />
            <div className="absolute bottom-10 right-4 w-60 rounded-md bg-card p-4 shadow-print sm:right-[-10px]">
              <p className="eyebrow text-muted-foreground">Payment received</p>
              <p className="mt-1 font-display text-2xl">₹1,25,000</p>
              <p className="text-xs text-muted-foreground">Aditi & Rohan · Advance via UPI</p>
              <div className="mt-3 h-1 rounded-full bg-muted">
                <div className="h-1 w-2/3 rounded-full bg-olive" />
              </div>
            </div>
            <p className="absolute left-2 top-4 font-display text-sm italic text-muted-foreground [writing-mode:vertical-rl]">
              Udaipur, Nov 2025
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-ink py-24 text-ivory grain">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1fr_1.3fr]">
          <h2 className="text-4xl leading-tight sm:text-5xl">
            Wedding season shouldn't mean <em className="text-gold">forty open chats</em> and a
            diary full of crossed-out dates.
          </h2>
          <div className="grid gap-px overflow-hidden rounded-md bg-ivory/10 sm:grid-cols-3">
            {[
              [
                MessageCircle,
                "Leads lost in WhatsApp",
                "Studios miss 1 in 4 enquiries because nobody followed up.",
              ],
              [
                FileSpreadsheet,
                "Payments on spreadsheets",
                "Balances slip through when the album ships before the money.",
              ],
            ].map(([I, t, d]) => {
              const Icon = I as typeof MessageCircle;
              return (
                <div key={t as string} className="bg-ink p-6">
                  <Icon className="h-5 w-5 text-ember" />
                  <p className="mt-6 font-display text-xl">{t as string}</p>
                  <p className="mt-2 text-sm text-ivory/60">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section id="features" className="py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow text-olive">One dashboard</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Your whole studio, at a glance.
            </h2>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Revenue, dues and profit per shoot — live",
                "Every client's history, contracts and invoices",
                "GST-ready quotations and invoices",
                "WhatsApp reminders for payments and dates",
              ].map((f) => (
                <li key={f} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative lg:col-span-8">
            <div className="absolute -right-6 -top-6 h-full w-full rounded-lg bg-olive-soft" />
            <div className="relative">
              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW — editorial timeline */}
      <section id="workflow" className="border-y border-border bg-secondary py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl text-4xl leading-tight sm:text-6xl">
              From <em>“Hi, are you free on the 14th?”</em> to the final album.
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Six stages. One thread. Nothing falls through the cracks.
            </p>
          </div>
          <ol className="mt-16 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {stages.map(([n, t, d], i) => (
              <li
                key={n}
                className={`border-t border-foreground pt-5 ${i % 3 === 1 ? "md:mt-12" : i % 3 === 2 ? "md:mt-24" : ""}`}
              >
                <span className="font-display text-5xl italic text-olive">{n}</span>
                <p className="mt-3 text-xl font-medium">{t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TEAM + SHOOTS collage */}
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <img
              src={bts}
              alt="Photographer shooting at a mandap"
              width={1280}
              height={896}
              loading="lazy"
              className="w-full rounded-sm object-cover shadow-print"
            />
            <div className="absolute -bottom-10 right-6 w-64 rounded-md bg-card p-4 shadow-print">
              <p className="eyebrow text-muted-foreground">Crew · Sat 14 Nov</p>
              {[
                ["Arjun M.", "Lead photographer"],
                ["Sana K.", "Cinematographer"],
                ["Vikram P.", "Drone + assistant"],
              ].map(([n, r]) => (
                <div key={n} className="mt-2 flex items-center justify-between text-sm">
                  <span>{n}</span>
                  <span className="text-xs text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center lg:col-span-5 lg:pl-6">
            <p className="eyebrow text-olive">Team & shoots</p>
            <h2 className="mt-4 text-4xl leading-tight">
              Everyone knows where to be — and what's due.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Assign photographers, cinematographers and freelancers per event. They get call sheets
              on their phone; you see availability before you say yes to a date.
            </p>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="bg-olive py-20 text-ivory">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-3">
          {[
            ["11 hrs", "saved every week on admin"],
            ["32%", "more enquiries converted"],
            ["₹2.4L", "recovered dues per studio, per season"],
          ].map(([n, l]) => (
            <div key={n}>
              <p className="font-display text-6xl">{n}</p>
              <p className="mt-2 text-ivory/80">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[1fr_2fr]">
          <img
            src={portrait}
            alt="Rahul Deshmukh"
            width={896}
            height={1152}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-sm object-cover"
          />
          <blockquote>
            <p className="font-display text-3xl leading-snug sm:text-4xl">
              “We shot 64 weddings last season with a team of nine. FrameFlow is the reason nobody
              missed a muhurat — and every rupee got collected.”
            </p>
            <footer className="mt-6 text-sm">
              <span className="font-medium">Rahul Deshmukh</span>{" "}
              <span className="text-muted-foreground">· Founder, Lenscraft Studio, Pune</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink text-ivory">
        <img
          src={hero}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28">
          <h2 className="max-w-3xl text-5xl leading-tight sm:text-6xl">
            This wedding season, run the studio <em className="text-gold">like a studio.</em>
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-full bg-ivory px-7 py-4 text-sm font-medium text-ink transition hover:bg-gold"
            >
              Start free trial
            </Link>
            <Link
              to="/pricing"
              className="rounded-full border border-ivory/40 px-7 py-4 text-sm font-medium transition hover:bg-ivory/10"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
