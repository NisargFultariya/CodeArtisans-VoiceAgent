import { cn } from "@/lib/utils";

export type TimelineItem = {
  title: string;
  description: string;
};

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-8 border-l border-[var(--color-border)] pl-8", className)}>
      {items.map((item, index) => (
        <li key={item.title} className="relative">
          <span className="absolute -left-[2.05rem] flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10 text-sm font-semibold text-indigo-300">
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
