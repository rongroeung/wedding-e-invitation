"use client";

import { useMemo, useState } from "react";
import type { Rsvp } from "@/lib/db/schema";
import { Button, Card, Input, Select, StatusMessage, useApi } from "./ui";

import { useT } from "./AdminPrefs";
/** RSVP list with search, filtering and CSV export. */
export function RsvpTable({ rsvps }: { rsvps: Rsvp[] }) {
  const t = useT();
  const { busy, message, send } = useApi();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((rsvp) => {
      if (filter === "yes" && !rsvp.attending) return false;
      if (filter === "no" && rsvp.attending) return false;
      if (!q) return true;
      return (
        rsvp.name.toLowerCase().includes(q) || rsvp.message.toLowerCase().includes(q)
      );
    });
  }, [rsvps, query, filter]);

  const attending = rsvps.filter((r) => r.attending);
  const totalSeats = attending.reduce((sum, r) => sum + r.guestCount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{t("ការបញ្ជាក់វត្តមាន")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {rsvps.length} {t(" ការឆ្លើយតប · ចូលរួម ")}{attending.length} {t(" · អ្នកចូលរួមសរុប ")}{totalSeats} {t(" នាក់")}</p>
        </div>
        <a
          href="/api/admin/export?type=rsvps"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {t("ទាញយក CSV")}</a>
      </header>

      <StatusMessage message={message} />

      <Card
        title={t("បញ្ជីឆ្លើយតប")}
        actions={
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ស្វែងរក")}
              className="w-40 sm:w-56"
            />
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-36">
              <option value="all">{t("ទាំងអស់")}</option>
              <option value="yes">{t("ចូលរួម")}</option>
              <option value="no">{t("មិនអាចចូលរួម")}</option>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">{t("ឈ្មោះ")}</th>
                <th className="py-2 pr-4">{t("វត្តមាន")}</th>
                <th className="py-2 pr-4">{t("ចំនួន")}</th>
                <th className="py-2 pr-4">{t("សារជូនពរ")}</th>
                <th className="py-2 pr-4">{t("កាលបរិច្ឆេទ")}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    {t("មិនទាន់មានទិន្នន័យទេ")}</td>
                </tr>
              )}
              {rows.map((rsvp) => (
                <tr key={rsvp.id} className="align-top">
                  <td className="py-3 pr-4 font-medium text-slate-800">{rsvp.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        rsvp.attending ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {rsvp.attending ? t("ចូលរួម") : t("មិនអាចចូលរួម")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">{rsvp.guestCount}</td>
                  <td className="max-w-xs py-3 pr-4 text-slate-600">{rsvp.message || "—"}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500">
                    {new Date(rsvp.createdAt).toLocaleString("en-GB")}
                  </td>
                  <td className="py-3">
                    <Button
                      variant="danger"
                      type="button"
                      disabled={busy}
                      onClick={() => send(`/api/admin/rsvps/${rsvp.id}`, { method: "DELETE", successText: t("បានលុប") })}
                    >
                      {t("លុប")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
