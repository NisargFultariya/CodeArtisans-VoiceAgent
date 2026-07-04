import { useState } from "react";
import { cn } from "@/lib/utils";

export type FocusCard = {
  title: string;
  description: string;
};

export function FocusCards({
  cards,
  className,
}: {
  cards: FocusCard[];
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {cards.map((card, index) => (
        <article
          key={card.title}
          onMouseEnter={() => setActive(index)}
          onMouseLeave={() => setActive(null)}
          className={cn(
            "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition duration-300",
            active !== null && active !== index && "scale-[0.98] opacity-45 blur-[1px]",
            active === index && "border-indigo-500/40 shadow-lg shadow-indigo-500/10",
          )}
        >
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {card.description}
          </p>
        </article>
      ))}
    </div>
  );
}
