import { useId } from "react";
import { cn } from "@/lib/utils";

export function GridDots({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <pattern id={`grid-dots-${id}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r="1" fill="rgba(0,0,0,0.08)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-dots-${id})`} />
    </svg>
  );
}
