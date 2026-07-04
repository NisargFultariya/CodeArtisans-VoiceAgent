import { cn } from "@/lib/utils";

export function LampHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto max-w-3xl text-center", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-36 w-2/3 bg-indigo-500/20 blur-3xl" />
      <h2 className="relative text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="relative mt-4 text-base text-[var(--color-muted-foreground)] md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
