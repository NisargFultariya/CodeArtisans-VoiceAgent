import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { navLinks, site } from "@/content/marketing";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar,
  NavbarButton,
  NavItems,
  useNavChrome,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

const navItems = navLinks.map((link) => ({ name: link.label, link: link.href }));

function AvipLogo() {
  const { light } = useNavChrome();

  return (
    <Link
      to="/"
      className={cn(
        "relative z-20 flex shrink-0 items-center gap-2 px-2 py-1 no-underline",
        light ? "text-white" : "text-neutral-900",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        S
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">{site.name}</div>
        <div className={cn("text-[10px]", light ? "text-neutral-400" : "text-neutral-500")}>
          Voice recovery
        </div>
      </div>
    </Link>
  );
}

function NavActions({ mobile = false }: { mobile?: boolean }) {
  const { light } = useNavChrome();

  const secondaryClass = light && !mobile ? "!text-neutral-200 hover:!text-white" : undefined;
  const primaryClass = light && !mobile ? "!bg-white !text-black" : undefined;

  if (mobile) {
    return (
      <div className="flex w-full flex-col gap-3">
        <NavbarButton as={Link} to="/request-demo" variant="secondary" className="w-full">
          Try the demo
        </NavbarButton>
        <NavbarButton as={Link} to="/install" variant="primary" className="w-full">
          Install on Shopify
        </NavbarButton>
      </div>
    );
  }

  return (
    <div className="relative z-20 flex shrink-0 items-center gap-1.5">
      <NavbarButton as={Link} to="/request-demo" variant="secondary" className={secondaryClass}>
        Try the demo
      </NavbarButton>
      <NavbarButton as={Link} to="/install" variant="primary" className={primaryClass}>
        Install on Shopify
      </NavbarButton>
    </div>
  );
}

export function SiteNav() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const onDarkHero = location.pathname === "/";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <Navbar light={onDarkHero}>
      <NavBody>
        <AvipLogo />
        <NavItems items={navItems} />
        <NavActions />
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <AvipLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
          {navItems.map((item) => (
            <a
              key={item.link}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-neutral-700 no-underline"
            >
              {item.name}
            </a>
          ))}
          <NavActions mobile />
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
