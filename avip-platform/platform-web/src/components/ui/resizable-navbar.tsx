import { createContext, useContext, useState, Children, cloneElement, isValidElement, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

type NavChrome = {
  visible: boolean;
  light: boolean;
};

const NavChromeContext = createContext<NavChrome>({ visible: false, light: false });

export function useNavChrome() {
  return useContext(NavChromeContext);
}

interface NavbarProps {
  children: ReactNode;
  className?: string;
  light?: boolean;
}

interface NavBodyProps {
  children: ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Navbar({ children, className, light = false }: NavbarProps) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100);
  });

  return (
    <NavChromeContext.Provider value={{ visible, light: light && !visible }}>
      <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 w-full px-4 pt-5", className)}>
        <div className="pointer-events-auto mx-auto w-full max-w-7xl">
          {Children.map(children, (child) =>
            isValidElement<{ visible?: boolean }>(child)
              ? cloneElement(child, { visible })
              : child,
          )}
        </div>
      </div>
    </NavChromeContext.Provider>
  );
}

export function NavBody({ children, className, visible }: NavBodyProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "min(960px, 100%)" : "100%",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden min-h-[3.25rem] w-full items-center gap-2 rounded-full bg-transparent px-3 py-2 lg:flex",
        visible && "bg-white/90",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function NavItems({ items, className, onItemClick }: NavItemsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { light } = useNavChrome();

  return (
    <div
      className={cn(
        "hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
          onClick={onItemClick}
          className={cn(
            "relative shrink-0 px-3 py-2 text-sm font-medium no-underline whitespace-nowrap",
            light ? "text-neutral-200 hover:text-white" : "text-neutral-600 hover:text-neutral-900",
          )}
          key={item.link}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="nav-hover"
              className={cn(
                "absolute inset-0 rounded-full",
                light ? "bg-white/10" : "bg-gray-100",
              )}
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </a>
      ))}
    </div>
  );
}

export function MobileNav({ children, className, visible }: MobileNavProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05)"
          : "none",
        width: visible ? "96%" : "100%",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col items-center justify-between rounded-full bg-transparent px-3 py-2 lg:hidden",
        visible && "bg-white/90",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function MobileNavHeader({ children, className }: MobileNavHeaderProps) {
  return (
    <div className={cn("flex w-full flex-row items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function MobileNavMenu({ children, className, isOpen }: MobileNavMenuProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start gap-4 rounded-2xl bg-white px-4 py-6 shadow-lg",
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function MobileNavToggle({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  const { light } = useNavChrome();
  const iconClass = cn("h-6 w-6 cursor-pointer", light ? "text-white" : "text-neutral-900");

  return isOpen ? (
    <IconX className={iconClass} onClick={onClick} aria-label="Close menu" />
  ) : (
    <IconMenu2 className={iconClass} onClick={onClick} aria-label="Open menu" />
  );
}

export function NavbarButton({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & Record<string, unknown>) {
  const baseStyles =
    "px-3.5 py-2 rounded-full text-sm font-semibold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center no-underline whitespace-nowrap";

  const variantStyles = {
    primary:
      "bg-white text-black shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05)]",
    secondary: "bg-transparent text-neutral-700 shadow-none hover:text-neutral-900",
    dark: "bg-neutral-900 text-white shadow-md",
    gradient: "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-md",
  };

  return (
    <Tag href={href} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
