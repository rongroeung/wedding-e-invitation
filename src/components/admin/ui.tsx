"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/* ── Primitives ─────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 ${props.className ?? ""}`}
    />
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-amber-300"
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-amber-500" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300",
    ghost: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles} ${props.className ?? ""}`}
    />
  );
}

export function Card({ title, description, children, actions }: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ── Save state helper ──────────────────────────────────────────────────── */

export function useApi() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function send(url: string, options: RequestInit & { successText?: string } = {}) {
    const { successText, ...init } = options;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        ...init,
        headers:
          init.body instanceof FormData
            ? init.headers
            : { "Content-Type": "application/json", ...(init.headers ?? {}) },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      setMessage({ type: "ok", text: successText ?? "រក្សាទុករួចរាល់" });
      router.refresh();
      return payload.data ?? payload;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "មានបញ្ហា" });
      return null;
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return { busy, message, send, setMessage };
}

export function StatusMessage({ message }: { message: { type: "ok" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <p
      className={`rounded-lg px-4 py-2.5 text-sm ${
        message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
      role="status"
    >
      {message.text}
    </p>
  );
}

/* ── Image / audio upload ───────────────────────────────────────────────── */

export function MediaUpload({
  label,
  kind = "image",
  currentSrc,
  onUploaded,
  onClear,
}: {
  label: string;
  kind?: "image" | "audio";
  currentSrc?: string;
  onUploaded: (mediaId: string) => void;
  onClear?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Upload failed");
      onUploaded(payload.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        {currentSrc && kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentSrc} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
        )}
        {currentSrc && kind === "audio" && <audio src={currentSrc} controls className="h-9" />}
        <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-amber-400 hover:text-amber-700">
          {busy ? "កំពុងផ្ទុក..." : currentSrc ? "ប្ដូរឯកសារ" : "ជ្រើសរើសឯកសារ"}
          <input
            type="file"
            className="hidden"
            accept={kind === "audio" ? "audio/*" : "image/*"}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />
        </label>
        {currentSrc && onClear && (
          <Button variant="danger" type="button" onClick={onClear}>
            លុប
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
