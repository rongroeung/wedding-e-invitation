"use client";

import { useEffect, useState } from "react";

type NavItem = { id: string; label: string };

/**
 * Slim navigation that appears once the guest starts scrolling.
 *
 * It lives inside the card, which is only ~560px wide, so a horizontal list of
 * a dozen Khmer labels can never fit — it wraps and collides with the content.
 * One menu button at every width, with the current section named beside it.
 */
export function SectionNav({ items, title }: { items: NavItem[]; title: string }) {
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

  // Collapse the menu whenever the bar hides, so it never reopens off-screen.
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
      aria-label="ផ្នែកនានានៃសំបុត្រអញ្ជើញ"
    >
      <div className="border-b border-gold-frame/30 bg-ivory/97 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-5 py-2.5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="gold-solid title-face min-w-0 flex-1 truncate text-left text-xs khmer-wrap sm:text-sm"
          >
            {title}
          </button>

          <span className="flex shrink-0 items-center gap-2.5">
            <span className="hidden max-w-[9rem] truncate text-xs text-ink/75 khmer-wrap sm:inline">
              {items.find((item) => item.id === active)?.label}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-frame/45 text-ink/80 transition hover:bg-champagne/25"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="បញ្ជីផ្នែក"
            >
              <MenuGlyph open={open} />
            </button>
          </span>
        </div>

        {open && (
          <ul className="grid grid-cols-2 gap-1 border-t border-gold-frame/30 px-4 py-3">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-xs khmer-wrap ${
                    active === item.id ? "bg-champagne/35 text-heading" : "text-ink/80"
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

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}
