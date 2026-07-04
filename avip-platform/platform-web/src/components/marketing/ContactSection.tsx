import { type FormEvent, useMemo, useState } from "react";
import { IconMail, IconMapPin } from "@tabler/icons-react";
import { GridDots } from "@/components/aceternity/grid-dots";
import { projectMapPoint, WorldMap } from "@/components/aceternity/world-map";
import {
  demoRequestErrorMessage,
  FormSuccessMessage,
} from "@/components/marketing/DemoRequestSuccess";
import { contactDetails } from "@/content/marketing";
import { submitDemoRequest } from "@/lib/marketing-api";
import { cn } from "@/lib/utils";

const contactIcons = [IconMail, IconMail, IconMapPin] as const;

const inputClass =
  "shadow-input w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20";

function MapPin({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const { x, y } = useMemo(() => projectMapPoint(lat, lng), [lat, lng]);
  const left = `${(x / 800) * 100}%`;
  const top = `${(y / 400) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
      style={{ left, top }}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-40" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-200" />
      </div>
      <span className="mt-2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-neutral-200">
        {label}
      </span>
    </div>
  );
}

export function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const result = await submitDemoRequest({
        source: "contact",
        email: String(form.get("email") ?? ""),
        fullName: String(form.get("name") ?? ""),
        company: String(form.get("company") ?? "") || undefined,
        message: String(form.get("message") ?? ""),
      });
      setMessage(result.message);
    } catch (err) {
      setError(demoRequestErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="border-t border-[var(--color-border)] bg-white py-20 md:py-28">
      <div className="section-shell grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
            <IconMail className="h-5 w-5 text-neutral-700" stroke={1.5} />
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            Contact us
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
            We&apos;re always looking for ways to improve recovery workflows for Shopify merchants.
            Tell us about your NDR volume and we&apos;ll show you how AVIP fits your ops stack.
          </p>

          <ul className="mt-8 space-y-4">
            {contactDetails.map((item, index) => {
              const Icon = contactIcons[index];
              return (
                <li key={item.label} className="flex items-start gap-3 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" stroke={1.75} />
                  <div>
                    <div className="font-medium text-neutral-900">{item.label}</div>
                    {"href" in item && item.href ? (
                      <a
                        href={item.href}
                        className="text-neutral-600 no-underline transition hover:text-indigo-600"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-neutral-600">{item.value}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10">
            <p className="mb-4 text-sm font-medium text-neutral-500">We are here</p>
            <div className="relative overflow-visible [perspective:1200px]">
              <div className="origin-center transform-[rotateX(50deg)_scale(0.92)] transition-transform duration-500 hover:transform-[rotateX(42deg)_scale(0.95)]">
                <div className="relative">
                  <WorldMap
                    lineColor="#6366f1"
                    dots={[
                      {
                        start: { lat: 19.076, lng: 72.8777, label: "Mumbai" },
                        end: { lat: 37.7749, lng: -122.4194, label: "SF" },
                      },
                    ]}
                  />
                  <MapPin lat={19.076} lng={72.8777} label="Mumbai, India" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-100 to-neutral-200 p-6 md:p-10">
          <GridDots />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_55%)]" />

          {message ? (
            <div className="relative z-10">
              <FormSuccessMessage message={message} />
            </div>
          ) : (
            <form className="relative z-10 space-y-5" onSubmit={onSubmit}>
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neutral-700">Full name</span>
                  <input
                    className={inputClass}
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neutral-700">Email address</span>
                  <input
                    className={inputClass}
                    name="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">Company</span>
                <input
                  className={inputClass}
                  name="company"
                  type="text"
                  placeholder="Your Shopify brand"
                  autoComplete="organization"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-700">Message</span>
                <textarea
                  className={cn(inputClass, "min-h-[120px] resize-y")}
                  name="message"
                  required
                  placeholder="Monthly order volume, NDR setup, languages you need..."
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="shadow-input w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Submit"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
