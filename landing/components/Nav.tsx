"use client";

import { useEffect, useState } from "react";
import Button from "./ui/Button";

const links = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#inteligencia", label: "Inteligência" },
  { href: "#nutricao", label: "Nutrição" },
  { href: "#social", label: "Social" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-base border-b border-border" : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-container items-center justify-between px-6 py-4 md:px-10"
      >
        <a href="#" className="text-lg font-bold tracking-widest text-ink">
          VIVECI
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Button href="#cta" variant="primary" className="text-sm">
          Começar agora
        </Button>
      </nav>
    </header>
  );
}
