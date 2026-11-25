"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminPrefsToggles, useT } from "./AdminPrefs";
import { Brand } from "./Brand";

type NavItem = { href: string; label: string; icon: string };

/**
 * The admin's navigation.
 *
 * On a computer it is the fixed column on the left, as before. On a phone or a
 * tablet it folds away: a slim bar stays at the top with a ☰ button, and the
 * same column slides in from the side over a dimmed page when it is tapped.
 * It closes again on a link, on the dimmed page, on ✕ or on Esc, and whenever
 * the page changes.
 */
export function AdminSidebar({
  nav,
  title,
  subtitle,
  email,
  viewHref,
  switcher,
  logout,
}: {
  nav: NavItem[];
  title: string;
  subtitle: string;
  email: string;
  viewHref: string;
  switcher?: ReactNode;
  logout: ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // the page under the open drawer does not scroll
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = nav.find((item) => active(item.href));

  const column = (
    <>
      <div className="flex items-start justify-between px-5 py-5">
        <div className="min-w-0">
          <Brand tagline={subtitle} />
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-mr-2 -mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label={t("បិទម៉ឺនុយ")}
        >
          ✕
        </button>
      </div>
      {switcher}
      <nav className="flex flex-col gap-1 px-3 pb-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active(item.href) ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active(item.href)
                ? "bg-amber-50 font-medium text-amber-800"
                : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {t(item.label)}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-100 px-5 py-4">
        <AdminPrefsToggles className="mb-3" />
        <p className="truncate text-xs text-slate-500">{email}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={viewHref}
            target="_blank"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-center text-xs text-slate-600 hover:bg-slate-50"
          >
            {t("មើលសំបុត្រអញ្ជើញ ↗")}</Link>
          {logout}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* phone / tablet: a slim bar with the menu button */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 hover:bg-slate-50"
          aria-label={t("បើកម៉ឺនុយ")}
          aria-expanded={open}
          aria-controls="admin-drawer"
        >
          ☰
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {current ? `${current.icon} ${t(current.label)}` : title}
          </p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* phone / tablet: the drawer */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="admin-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={t("ម៉ឺនុយគ្រប់គ្រង")}
        aria-hidden={!open}
        inert={!open}
      >
        {column}
      </aside>

      {/* computer: the fixed column */}
      <aside className="hidden border-r border-slate-200 bg-white lg:block lg:min-h-screen lg:w-64 lg:shrink-0">
        <div className="sticky top-0">{column}</div>
      </aside>
    </>
  );
}
