"use client";

import { useState } from "react";
import { Button, Card, Field, Input, StatusMessage, useApi } from "./ui";

import { useT } from "./AdminPrefs";
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string | Date;
};

/**
 * គណនីគ្រប់គ្រង — change your own password, and add or remove the other people
 * who can sign in.
 *
 * Deleting the last account, or your own, is refused by the API; the buttons
 * are disabled here too so the refusal is never a surprise.
 */
export function UserManager({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const t = useT();
  const { busy, message, send, setMessage } = useApi();

  /* ── my password ── */
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  /* ── new administrator ── */
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  /* ── resetting someone else's password ── */
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState("");

  const me = users.find((u) => u.id === currentUserId);

  async function changeOwnPassword(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      setMessage({ type: "error", text: t("ពាក្យសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នា") });
      return;
    }
    const result = await send("/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
      successText: t("ប្ដូរពាក្យសម្ងាត់រួចរាល់"),
    });
    if (result) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    const result = await send("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, name: name || "Admin", password }),
      successText: t("បានបន្ថែមអ្នកគ្រប់គ្រងថ្មី"),
    });
    if (result) {
      setEmail("");
      setName("");
      setPassword("");
    }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resetFor) return;
    const result = await send(`/api/admin/users/${resetFor}`, {
      method: "PUT",
      body: JSON.stringify({ password: resetValue }),
      successText: t("កំណត់ពាក្យសម្ងាត់ថ្មីរួចរាល់"),
    });
    if (result) {
      setResetFor(null);
      setResetValue("");
    }
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`${t("លុបគណនី")} ${user.email} ${t("មែនទេ?")}`)) return;
    await send(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      successText: t("បានលុបគណនី"),
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">{t("គណនីគ្រប់គ្រង")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("ប្ដូរពាក្យសម្ងាត់របស់លោកអ្នក និងបន្ថែមអ្នកគ្រប់គ្រងផ្សេងទៀត")}</p>
      </header>

      <StatusMessage message={message} />

      <Card
        title={t("ពាក្យសម្ងាត់របស់ខ្ញុំ")}
        description={me ? `${me.name} · ${me.email}` : undefined}
      >
        <form onSubmit={changeOwnPassword} className="grid gap-4 sm:grid-cols-3">
          <Field label={t("ពាក្យសម្ងាត់បច្ចុប្បន្ន")}>
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </Field>
          <Field label={t("ពាក្យសម្ងាត់ថ្មី")} hint={t("យ៉ាងតិច ១០ តួអក្សរ")}>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </Field>
          <Field label={t("បញ្ជាក់ពាក្យសម្ងាត់ថ្មី")}>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy}>
              {t("ប្ដូរពាក្យសម្ងាត់")}</Button>
          </div>
        </form>
      </Card>

      <Card title={t("បន្ថែមអ្នកគ្រប់គ្រង")} description={t("អ្នកដែលអាចចូលប្រើផ្ទាំងគ្រប់គ្រងនេះ")}>
        <form onSubmit={addUser} className="grid gap-4 sm:grid-cols-3">
          <Field label={t("អ៊ីមែល")}>
            <Input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </Field>
          <Field label={t("ឈ្មោះ")}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin"
            />
          </Field>
          <Field label={t("ពាក្យសម្ងាត់")} hint={t("យ៉ាងតិច ១០ តួអក្សរ")}>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy}>
              {t("បន្ថែម")}</Button>
          </div>
        </form>
      </Card>

      <Card title={t("បញ្ជីអ្នកគ្រប់គ្រង")} description={`${t("សរុប")} ${users.length}`}>
        <ul className="divide-y divide-slate-100">
          {users.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <li key={user.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {user.name}
                      {isMe && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] text-amber-800">
                          {t("លោកអ្នក")}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {!isMe && (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setResetFor(resetFor === user.id ? null : user.id);
                          setResetValue("");
                        }}
                      >
                        {t("ពាក្យសម្ងាត់ថ្មី")}</Button>
                    )}
                    <Button
                      variant="danger"
                      type="button"
                      disabled={busy || isMe || users.length <= 1}
                      title={isMe ? t("មិនអាចលុបគណនីផ្ទាល់ខ្លួន") : undefined}
                      onClick={() => removeUser(user)}
                    >
                      {t("លុប")}</Button>
                  </div>
                </div>

                {resetFor === user.id && (
                  <form onSubmit={resetPassword} className="mt-3 flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px] flex-1">
                      <Field label={`${t("ពាក្យសម្ងាត់ថ្មីសម្រាប់")} ${user.email}`} hint={t("យ៉ាងតិច ១០ តួអក្សរ")}>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          minLength={10}
                          value={resetValue}
                          onChange={(e) => setResetValue(e.target.value)}
                          required
                        />
                      </Field>
                    </div>
                    <Button type="submit" disabled={busy}>
                      {t("កំណត់")}</Button>
                    <Button variant="ghost" type="button" onClick={() => setResetFor(null)}>
                      {t("បោះបង់")}</Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
