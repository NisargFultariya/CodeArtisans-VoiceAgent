import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DemoDockItem = {
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  disabled?: boolean;
  active?: boolean;
  hold?: boolean;
};

type DemoControlDockProps = {
  items: DemoDockItem[];
  className?: string;
};

export function DemoControlDock({ items, className }: DemoControlDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-[4.5rem] items-end gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 px-4 pb-3 shadow-2xl backdrop-blur-xl",
        className,
      )}
    >
      {items.map((item) => (
        <DockButton key={item.title} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  );
}

function DockButton({
  mouseX,
  title,
  icon,
  onClick,
  onPointerDown,
  onPointerUp,
  disabled,
  active,
  hold,
}: DemoDockItem & { mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [holding, setHolding] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const width = useSpring(useTransform(distance, [-120, 0, 120], [44, 72, 44]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(useTransform(distance, [-120, 0, 120], [44, 72, 44]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const iconSize = useSpring(useTransform(distance, [-120, 0, 120], [20, 32, 20]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={hold ? undefined : onClick}
      onPointerDown={
        hold
          ? (e) => {
              e.preventDefault();
              if (disabled) return;
              setHolding(true);
              onPointerDown?.();
            }
          : undefined
      }
      onPointerUp={
        hold
          ? (e) => {
              e.preventDefault();
              setHolding(false);
              onPointerUp?.();
            }
          : undefined
      }
      onPointerLeave={
        hold
          ? () => {
              if (holding) onPointerUp?.();
              setHolding(false);
            }
          : () => setHovered(false)
      }
      onMouseEnter={() => setHovered(true)}
      className="relative shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <motion.div
        style={{ width, height }}
        className={cn(
          "relative flex items-center justify-center rounded-full border transition-colors",
          active || holding
            ? "border-indigo-400/60 bg-indigo-500/30"
            : "border-white/10 bg-neutral-800",
        )}
      >
        <AnimatePresence>
          {hovered && !disabled ? (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 rounded-md border border-white/10 bg-neutral-800 px-2 py-0.5 text-xs whitespace-nowrap text-neutral-200"
            >
              {title}
            </motion.span>
          ) : null}
        </AnimatePresence>
        <motion.span
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center [&_svg]:size-full"
        >
          {icon}
        </motion.span>
      </motion.div>
    </button>
  );
}
