import { Link } from "react-router-dom";
import { ArrowRight, Phone, Shield, Store, Workflow } from "lucide-react";
import { Compare } from "@/components/aceternity/compare";
import { FocusCards } from "@/components/aceternity/focus-cards";
import { LampHeader } from "@/components/aceternity/lamp-header";
import { Timeline } from "@/components/aceternity/timeline";
import { HeroGeminiSection } from "@/components/marketing/HeroGeminiSection";
import { ContactSection } from "@/components/marketing/ContactSection";
import { buttonClasses } from "@/components/ui/button";
import {
  bentoFeatures,
  compliancePillars,
  faqs,
  stats,
  timelineSteps,
} from "@/content/marketing";
import { cn } from "@/lib/utils";

function ComparePanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "bad" | "good";
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-center p-8 md:p-10",
        tone === "bad" ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-white",
      )}
    >
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed opacity-90">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      <HeroGeminiSection />

      <section className="border-b border-[var(--color-border)] bg-white py-10">
        <div className="section-shell flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-muted-foreground)]">
          <span>Built for Shopify ops teams</span>
          <span className="hidden h-4 w-px bg-[var(--color-border)] md:block" />
          <span>Multilingual India</span>
          <span className="hidden h-4 w-px bg-[var(--color-border)] md:block" />
          <span>Temporal-backed workflows</span>
        </div>
      </section>

      <section id="product" className="py-20">
        <div className="section-shell">
          <LampHeader
            title="RTO isn't a support ticket — it's lost revenue"
            subtitle="Your team can't call every NDR manually. Soniqa automates the first recovery attempts while your ops team handles escalations."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm"
              >
                <div className="text-3xl font-semibold text-[var(--color-primary)]">{stat.value}</div>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)]/40 py-20">
        <div className="section-shell">
          <LampHeader title="Manual recovery vs Soniqa" subtitle="Drag to compare" />
          <div className="mt-10">
            <Compare
              before={
                <ComparePanel
                  title="Without Soniqa"
                  tone="bad"
                  items={[
                    "Ops dials manually with inconsistent scripts",
                    "No consent trail before outbound calls",
                    "Calls on the wrong NDR stage",
                    "Outcomes scattered across spreadsheets",
                  ]}
                />
              }
              after={
                <ComparePanel
                  title="With Soniqa"
                  tone="good"
                  items={[
                    "Scripted multilingual agent, same SOP every time",
                    "Checkout consent + pre-dial gate",
                    "NDR-1/NDR-2 automated; NDR-3 escalates to human",
                    "Outcomes in Shopify app + platform audit log",
                  ]}
                />
              }
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="section-shell grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <LampHeader
              title="From failed delivery to recovered order"
              subtitle="Orchestrated by Temporal — reliable, retriable, observable."
              className="text-left"
            />
          </div>
          <Timeline items={timelineSteps} />
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-white py-20">
        <div className="section-shell">
          <LampHeader
            title="Everything ops needs. Nothing compliance forgot."
            subtitle="Purpose-built for Indian ecommerce recovery workflows."
          />
          <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-3">
            {bentoFeatures.map((feature) => (
              <article
                key={feature.title}
                className={cn(
                  "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  feature.className,
                )}
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-dark border-y border-[var(--color-border)] py-20">
        <div className="section-shell">
          <LampHeader
            title="Voice AI you can defend in an audit"
            subtitle="Soniqa is built for Indian telecom and ecommerce rules — not bolted on after launch."
          />
          <div className="mt-12">
            <FocusCards cards={compliancePillars} />
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/compliance" className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200">
              Read compliance overview <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/privacy" className="text-slate-400 hover:text-slate-200">
              Privacy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-slate-200">
              Terms
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-slate-950 p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 text-indigo-300">
              <Phone className="h-5 w-5" />
              <span className="text-sm font-medium">Live browser demo</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold">Hear the agent before you install</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Pick a language, speak naturally, and watch transcript and pipeline stages update in
              real time.
            </p>
            <Link to="/request-demo" className={buttonClasses({ className: "mt-6 bg-white text-slate-950 hover:opacity-90" })}>
              Try the demo
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, label: "Shopify embedded app" },
              { icon: Shield, label: "Pre-dial compliance gate" },
              { icon: Workflow, label: "Temporal workflows" },
              { icon: Phone, label: "Sarvam STT / TTS" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-3 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />

      <section className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 py-20">
        <div className="section-shell max-w-3xl">
          <LampHeader title="Common questions" />
          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5"
              >
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-dark py-20">
        <div className="section-shell text-center">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Stop losing orders to silent RTOs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Free to install · Demo available now · Compliance docs public
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/request-demo" className={buttonClasses({ className: "bg-white text-slate-950 hover:opacity-90" })}>
              Try the demo
            </Link>
            <Link to="/install" className={buttonClasses({ className: "bg-white text-slate-950 hover:opacity-90" })}>
              Install on Shopify
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
