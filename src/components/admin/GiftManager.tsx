"use client";

import { useState } from "react";
import type { GiftAccount, Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, Textarea, Toggle, useApi } from "./ui";

const BANKS = ["ABA Bank", "ACLEDA Bank", "Wing", "Canadia Bank", "Chip Mong Bank", "Sathapana Bank", "TrueMoney"];

/** ចំណងដៃ — bank accounts, QR codes and the section toggle. */
export function GiftManager({ wedding, accounts }: { wedding: Wedding; accounts: GiftAccount[] }) {
  const { busy, message, send } = useApi();
  const [settings, setSettings] = useState({
    giftEnabled: wedding.giftEnabled,
    giftIntro: wedding.giftIntro,
    giftNote: wedding.giftNote,
  });
  const [draft, setDraft] = useState({
    bankName: BANKS[0],
    accountName: "",
    accountNumber: "",
    note: "",
    qrMediaId: null as string | null,
    sortOrder: 0,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">ចំណងដៃ</h1>
        <p className="mt-1 text-sm text-slate-500">គណនីធនាគារ និង QR Code សម្រាប់ចំណងដៃ</p>
      </header>

      <StatusMessage message={message} />

      <Card title="ការកំណត់ផ្នែក">
        <div className="space-y-4">
          <Toggle
            label="បង្ហាញផ្នែកចំណងដៃ"
            hint="បើបិទ ផ្នែកនេះនឹងមិនបង្ហាញលើសំបុត្រអញ្ជើញទេ"
            checked={settings.giftEnabled}
            onChange={(v) => setSettings({ ...settings, giftEnabled: v })}
          />
          <Field label="អត្ថបទណែនាំ">
            <Textarea rows={2} value={settings.giftIntro} onChange={(e) => setSettings({ ...settings, giftIntro: e.target.value })} />
          </Field>
          <Field label="អត្ថបទបន្ថែម">
            <Textarea rows={2} value={settings.giftNote} onChange={(e) => setSettings({ ...settings, giftNote: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                send("/api/admin/wedding", {
                  method: "PUT",
                  body: JSON.stringify(settings),
                  successText: "បានរក្សាទុក",
                })
              }
            >
              រក្សាទុក
            </Button>
          </div>
        </div>
      </Card>

      <Card title="បន្ថែមគណនីថ្មី">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ធនាគារ / សេវាកម្ម">
            <Input
              list="bank-list"
              value={draft.bankName}
              onChange={(e) => setDraft({ ...draft, bankName: e.target.value })}
            />
            <datalist id="bank-list">
              {BANKS.map((bank) => (
                <option key={bank} value={bank} />
              ))}
            </datalist>
          </Field>
          <Field label="ឈ្មោះគណនី">
            <Input value={draft.accountName} onChange={(e) => setDraft({ ...draft, accountName: e.target.value })} />
          </Field>
          <Field label="លេខគណនី">
            <Input value={draft.accountNumber} onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })} />
          </Field>
          <Field label="កំណត់ចំណាំ">
            <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <MediaUpload
              label="QR Code (ស្រេចចិត្ត)"
              currentSrc={mediaSrc(draft.qrMediaId)}
              onUploaded={(id) => setDraft({ ...draft, qrMediaId: id })}
              onClear={() => setDraft({ ...draft, qrMediaId: null })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={busy || !draft.accountName.trim() || !draft.accountNumber.trim()}
            onClick={async () => {
              const result = await send("/api/admin/gifts", {
                method: "POST",
                body: JSON.stringify({ ...draft, sortOrder: accounts.length + 1 }),
                successText: "បានបន្ថែមគណនី",
              });
              if (result) setDraft({ bankName: BANKS[0], accountName: "", accountNumber: "", note: "", qrMediaId: null, sortOrder: 0 });
            }}
          >
            បន្ថែម
          </Button>
        </div>
      </Card>

      <Card title={`គណនីទាំងអស់ (${accounts.length})`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.length === 0 && <p className="py-6 text-center text-sm text-slate-400">មិនទាន់មានគណនីទេ</p>}
          {accounts.map((account) => (
            <div key={account.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">{account.bankName}</p>
              <p className="text-sm text-slate-600">{account.accountName}</p>
              <p className="font-mono text-sm text-slate-700">{account.accountNumber}</p>
              {mediaSrc(account.qrMediaId, account.qrUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaSrc(account.qrMediaId, account.qrUrl)}
                  alt="QR"
                  className="mt-3 h-28 w-28 rounded-lg border border-slate-200 object-contain p-1"
                />
              )}
              <Button
                variant="danger"
                type="button"
                className="mt-3 w-full"
                disabled={busy}
                onClick={() => send(`/api/admin/gifts/${account.id}`, { method: "DELETE", successText: "បានលុប" })}
              >
                លុប
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
