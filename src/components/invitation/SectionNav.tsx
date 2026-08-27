"use client";

import { useEffect, useState } from "react";

type NavItem = { id: string; label: string };

/** Slim sticky navigation that appears once the guest starts scrolling. */
export function SectionNav({ items }: { items: NavItem[] }) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      aria-label="ផ្នែកនានានៃសំបុត្រអញ្ជើញ"
    >
      <div className="border-b border-champagne/40 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="gold-text text-sm khmer-wrap"
          >
            សិរីមង្គលអាពាហ៍ពិពាហ៍
          </button>

          {/* Desktop / tablet */}
          <ul className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors khmer-wrap ${
                    active === item.id
                      ? "bg-champagne/35 text-burgundy"
                      : "text-ink/60 hover:text-burgundy"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne/60 text-ink/70 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="បញ្ជីផ្នែក"
          >
            <span aria-hidden="true">{open ? "×" : "☰"}</span>
          </button>
        </div>

        {open && (
          <ul className="grid grid-cols-2 gap-1 border-t border-champagne/40 px-4 py-3 md:hidden">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-xs khmer-wrap ${
                    active === item.id ? "bg-champagne/35 text-burgundy" : "text-ink/65"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
