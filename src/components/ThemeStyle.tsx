import type { Wedding } from "@/lib/db/schema";

/** Injects the admin-configured palette and fonts as CSS custom properties. */
export function ThemeStyle({ wedding }: { wedding: Wedding }) {
  const css = `:root{
    --c-primary:${sanitize(wedding.colorPrimary, "#7B1F2F")};
    --c-secondary:${sanitize(wedding.colorSecondary, "#C8A24A")};
    --c-accent:${sanitize(wedding.colorAccent, "#E4CE9B")};
    --c-bg:${sanitize(wedding.colorBackground, "#FBF7F0")};
    --c-text:${sanitize(wedding.colorText, "#3E2A20")};
    --f-heading:${sanitizeFont(wedding.fontHeading, "'Noto Serif Khmer'")};
    --f-body:${sanitizeFont(wedding.fontBody, "'Noto Sans Khmer'")};
  }`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function sanitize(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{3,8}$|^rgb/.test(value.trim()) ? value.trim() : fallback;
}

function sanitizeFont(value: string, fallback: string) {
  const clean = value.trim();
  return /^[\w\s'",-]+$/.test(clean) && clean.length < 80 ? clean : fallback;
}
