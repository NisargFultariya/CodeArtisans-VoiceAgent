import { useRef } from "react";
import { Link } from "react-router-dom";
import { useScroll, useTransform } from "framer-motion";
import { FlipWords } from "@/components/aceternity/flip-words";
import { GoogleGeminiEffect } from "@/components/aceternity/google-gemini-effect";
import { heroWords } from "@/content/marketing";

export function HeroGeminiSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.75], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.75], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.75], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.75], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.75], [0, 1.2]);

  return (
    <section
      ref={ref}
      className="relative h-[200vh] w-full overflow-clip border-b border-neutral-800 bg-black"
    >
      <GoogleGeminiEffect
        pathLengths={[
          pathLengthFirst,
          pathLengthSecond,
          pathLengthThird,
          pathLengthFourth,
          pathLengthFifth,
        ]}
        eyebrow="Shopify · Voice recovery · India-ready"
        titleContent={
          <>
            Recover <FlipWords words={heroWords} className="inline-block min-w-[10ch]" /> with AI
            voice calls
          </>
        }
        description="When fulfillment fails, Soniqa calls your customer in their language to confirm address, reschedule, or save the order. Built for NDR workflows, TRAI disclosure, and checkout consent."
      >
        <Link
          to="/request-demo"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black no-underline shadow-lg transition hover:opacity-90"
        >
          Try the demo
        </Link>
        <Link
          to="/install"
          className="rounded-full border border-neutral-500 bg-black/40 px-5 py-2.5 text-sm font-medium text-white no-underline backdrop-blur-sm transition hover:bg-white/10"
        >
          Install on Shopify
        </Link>
        <Link
          to="/#contact"
          className="text-sm text-neutral-300 underline-offset-4 hover:underline"
        >
          Contact sales
        </Link>
      </GoogleGeminiEffect>

      <p className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 text-center text-xs text-neutral-500">
        Scroll to animate · Consent-first · NDR-1 &amp; NDR-2 only
      </p>
    </section>
  );
}
