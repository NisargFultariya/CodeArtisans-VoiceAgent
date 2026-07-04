import { cn } from "@/lib/utils";

export function MovingBorderButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-slate-950 px-6 text-sm font-medium text-white",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#6366f1_0%,#a855f7_25%,#6366f1_50%,#a855f7_75%,#6366f1_100%)] opacity-80 blur-sm" />
      <span className="absolute inset-[1px] rounded-full bg-slate-950" />
      <span className="relative">{children}</span>
    </button>
  );
}

export function MovingBorderLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-slate-950 px-6 text-sm font-medium text-white no-underline",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#6366f1_0%,#a855f7_25%,#6366f1_50%,#a855f7_75%,#6366f1_100%)] opacity-80 blur-sm" />
      <span className="absolute inset-[1px] rounded-full bg-slate-950" />
      <span className="relative">{children}</span>
    </a>
  );
}
