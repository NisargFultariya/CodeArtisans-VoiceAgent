import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="beam-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => (
          <path
            key={line}
            d={`M ${-120 + line * 80} 0 Q ${220 + line * 40} 180 ${520 + line * 30} 420 T ${920 + line * 20} 900`}
            fill="none"
            stroke="url(#beam-a)"
            strokeWidth="1.5"
            className="animate-pulse"
            style={{ animationDelay: `${line * 0.35}s` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(12,18,34,0.85))]" />
    </div>
  );
}
