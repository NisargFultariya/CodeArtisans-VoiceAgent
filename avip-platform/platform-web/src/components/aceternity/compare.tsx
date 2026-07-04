import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Compare({
  before,
  after,
  className,
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  function onMove(clientX: number) {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg select-none",
        className,
      )}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return;
        onMove(event.clientX);
      }}
      onPointerDown={(event) => onMove(event.clientX)}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        {before}
      </div>
      <div
        className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.8)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-300 bg-slate-950 text-xs font-semibold text-white">
          ⇆
        </div>
      </div>
    </div>
  );
}
