"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/* ── Primitives ─────────────────────────────────────────────────────────── */

/**
 * How much of a file goes in one request.
 *
 * Not our limit: a serverless host refuses a request body over its own cap
 * before the application runs at all, and Vercel's is 4.5 MB. That is the
 * whole reason a 64 MB film could not be uploaded — raising `MAX_VIDEO_BYTES`
 * could never have helped, because nothing of ours was being asked.
 *
 * So anything larger than one request goes up in pieces of this size and is
 * appended server-side. Three megabytes leaves comfortable room under the cap
 * for the multipart envelope around it, and makes a 64 MB film 22 requests
 * rather than 200.
 */
const CHUNK = 3 * 1024 * 1024;

type Reply = { ok?: boolean; error?: string; data?: { id: string } };

/**
 * Read a reply that might not be ours.
 *
 * `response.json()` assumes the request reached the application. When a host
 * refuses it at the door the body is that host's plain prose — Vercel answers
 * an oversized upload with the words "Request Entity Too Large" — and parsing
 * it throws `Unexpected token 'R'`: a message that names a character, blames
 * the parser, and tells a couple nothing about their film being too big.
 */
async function read(response: Response): Promise<Reply | null> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as Reply;
  } catch {
    return null;
  }
}

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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${props.className ?? ""}`}
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
  kind?: "image" | "audio" | "video";
  currentSrc?: string;
  onUploaded: (mediaId: string) => void;
  onClear?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState("");

  /**
   * A file too large for one request, sent as several.
   *
   * Sequentially, and that is not laziness: the pieces are *appended* to one
   * row in the order they arrive, so two in flight at once would interleave and
   * produce a file that is the right length and unplayable.
   */
  async function uploadInPieces(file: File) {
    const uploadId = crypto.randomUUID();
    const total = Math.ceil(file.size / CHUNK);
    for (let index = 0; index < total; index++) {
      const body = new FormData();
      body.append("uploadId", uploadId);
      body.append("index", String(index));
      body.append("total", String(total));
      body.append("kind", kind);
      body.append("filename", file.name.slice(0, 160) || "upload");
      body.append("mimeType", file.type);
      body.append("chunk", file.slice(index * CHUNK, (index + 1) * CHUNK));

      const response = await fetch("/api/admin/upload/chunk", { method: "POST", body });
      const payload = await read(response);
      if (!payload?.ok) throw new Error(payload?.error || `ការផ្ទុកបានបរាជ័យ (${response.status})`);
      setSent(Math.round(((index + 1) / total) * 100));
    }
    return uploadId;
  }

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setSent(0);
    try {
      if (file.size > CHUNK) {
        onUploaded(await uploadInPieces(file));
        return;
      }
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = await read(response);
      if (!payload) {
        throw new Error(`ការផ្ទុកមិនបានសម្រេច (${response.status}). សូមព្យាយាមម្ដងទៀត។`);
      }
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Upload failed");
      }
      onUploaded(payload.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setSent(0);
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
        {currentSrc && kind === "video" && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={currentSrc} controls muted playsInline className="h-24 rounded-lg border border-slate-200" />
        )}
        <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-amber-400 hover:text-amber-700">
          {/* A film goes up in pieces and can take minutes; a button that just
              says "loading" for that long looks like one that has died. */}
          {busy
            ? sent > 0
              ? `កំពុងផ្ទុក... ${sent}%`
              : "កំពុងផ្ទុក..."
            : currentSrc
              ? "ប្ដូរឯកសារ"
              : "ជ្រើសរើសឯកសារ"}
          <input
            type="file"
            className="hidden"
            accept={kind === "audio" ? "audio/*" : kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"}
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
