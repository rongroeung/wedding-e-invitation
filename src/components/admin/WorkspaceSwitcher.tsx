"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useT } from "./AdminPrefs";
type Option = { id: string; label: string; slug: string };

/**
 * Which wedding the dashboard is working on. Shown only when there is more
 * than one to choose from; the server checks every switch against what this
 * admin may manage, so the list here is a convenience, not the rule.
 */
export function WorkspaceSwitcher({ current, options }: { current: string; options: Option[] }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(id: string) {
    if (id === current) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
      // the page they are on, now for the other wedding
      router.refresh();
    } catch {
      setError(t("មិនអាចប្ដូរបានទេ"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pb-3">
      <label htmlFor="ws-switch" className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {t("កន្លែងធ្វើការ · Workspace")}</label>
      <select
        id="ws-switch"
        value={current}
        disabled={busy}
        onChange={(e) => choose(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {o.slug !== o.label ? ` (${o.slug})` : ""}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
