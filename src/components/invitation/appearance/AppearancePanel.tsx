"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  type Appearance,
  FX_LEVELS,
  FX_LEVEL_KEYS,
  FX_MODES,
  FX_MODE_KEYS,
  PAPER_THEMES,
  PAPER_THEME_KEYS,
  type PaperTheme,
} from "@/lib/appearance";

import { PAPER_GROUPS } from "@/lib/paperThemes";

import { choose, readSaved, resetTo, useAppearance } from "./store";

/**
 * The guest's appearance settings: a small round button, and a compact panel
 * that opens from it.
 *
 * Every choice applies the moment it is made (no reload, no re-mount: the
 * music keeps playing and the envelope is not replayed) and is remembered in
 * this browser only. "Reset" returns to the couple's defaults and forgets the
 * choice. Native radio inputs, so arrow keys, screen readers and the clear
 * focus ring all come for free.
 */
export function AppearancePanel({
  defaults,
  coupleSwatch,
}: {
  defaults: Appearance;
  /** The couple's own card picture, when they have one: offered as an option. */
  coupleSwatch: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [explicit, setExplicit] = useState(false);
  const current = useAppearance(defaults);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    try {
      setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      /* no matchMedia */
    }
    setExplicit(Boolean(readSaved()?.explicit));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const papers = PAPER_THEME_KEYS.filter((k) => k !== "couple" || coupleSwatch);
  const [tab, setTab] = useState<string | null>(null);
  const groupOfCurrent = PAPER_THEMES[current.paper]?.group;
  const shownGroup =
    tab ?? (PAPER_GROUPS.some((g) => g.key === groupOfCurrent) ? (groupOfCurrent as string) : PAPER_GROUPS[0].key);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label="ការកំណត់រូបរាង (Appearance settings)"
        title="ការកំណត់រូបរាង"
        className="ap-trigger"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {/* a paper sheet with a small spark of gold: the paper and the shimmer */}
          <path d="M6 3.5h8.5L18 7v13.5H6z" />
          <path d="M14.5 3.5V7H18" />
          <path d="M12 10.2v5.6M9.2 13h5.6M10 11l4 4M14 11l-4 4" strokeWidth="1.1" />
        </svg>
      </button>

      {open && (
        <>
          <button type="button" className="ap-scrim" aria-label="បិទ (Close)" tabIndex={-1} onClick={() => setOpen(false)} />
          <div
            ref={panel}
            id={`${id}-panel`}
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${id}-title`}
            className="ap-panel"
          >
            <div className="ap-head">
              <div>
                <p id={`${id}-title`} className="ap-title">រូបរាង</p>
                <p className="ap-sub">Appearance</p>
              </div>
              <button
                type="button"
                className="ap-close"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
                aria-label="បិទ (Close)"
                data-autofocus
              >
                ×
              </button>
            </div>

            <fieldset className="ap-group">
              <legend className="ap-legend">
                ក្រដាស <span>· Paper</span>
              </legend>
              {/*
                * Thirty papers in three collections: one collection at a
                * time, chosen with these tabs, so the panel never becomes a
                * long scroll of thumbnails. It opens on the collection of the
                * paper in use.
                */}
              <div
                className="ap-tabs"
                role="tablist"
                aria-label="Collections"
                onKeyDown={(e) => {
                  // arrow keys move between the collections, as tabs do
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const i = PAPER_GROUPS.findIndex((g) => g.key === shownGroup);
                  const n = PAPER_GROUPS.length;
                  const next = PAPER_GROUPS[(i + (e.key === "ArrowRight" ? 1 : n - 1)) % n].key;
                  setTab(next);
                  e.currentTarget.querySelector<HTMLButtonElement>(`[data-group="${next}"]`)?.focus();
                }}
              >
                {PAPER_GROUPS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    role="tab"
                    data-group={g.key}
                    aria-selected={shownGroup === g.key}
                    tabIndex={shownGroup === g.key ? 0 : -1}
                    className="ap-tab"
                    onClick={() => setTab(g.key)}
                  >
                    {g.km}
                    <small>{g.en}</small>
                  </button>
                ))}
              </div>
              {PAPER_GROUPS.filter((g) => g.key === shownGroup).map((g) => (
                <div key={g.key} className="ap-swatch-group" role="tabpanel">
                  <div className="ap-swatches">
                    {papers
                      .filter((key) => PAPER_THEMES[key].group === g.key || (g.key === "floral" && key === "couple"))
                      .map((key) => (
                        <label key={key} className="ap-swatch">
                          <input
                            type="radio"
                            name={`${id}-paper`}
                            value={key}
                            checked={current.paper === key}
                            onChange={() => choose({ paper: key as PaperTheme })}
                          />
                          <span
                            className="ap-swatch-paper"
                            style={{
                              background:
                                key === "couple"
                                  ? coupleSwatch
                                    ? `center / cover url("${coupleSwatch}")`
                                    : undefined
                                  : `center / cover url("/paper/swatch/${key}.webp")`,
                            }}
                          />
                          <span className="ap-swatch-label">
                            {PAPER_THEMES[key].km}
                            <small>{PAPER_THEMES[key].en}</small>
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </fieldset>

            <fieldset className="ap-group">
              <legend className="ap-legend">
                ចលនា <span>· Animation</span>
              </legend>
              <div className="ap-options">
                {FX_MODE_KEYS.map((key) => (
                  <label key={key} className="ap-option">
                    <input
                      type="radio"
                      name={`${id}-fx`}
                      value={key}
                      checked={current.fx === key}
                      onChange={() => {
                        choose({ fx: key });
                        setExplicit(true);
                      }}
                    />
                    <span>
                      {FX_MODES[key].km}
                      <small>{FX_MODES[key].en}</small>
                    </span>
                  </label>
                ))}
              </div>
              {reduced && !explicit && (
                <p className="ap-note">
                  ឧបករណ៍របស់អ្នកស្នើឱ្យកាត់បន្ថយចលនា ដូច្នេះចលនាត្រូវបានបិទ។ អ្នកអាចបើកវាវិញនៅខាងលើ។
                  <small>Your device asks for reduced motion, so animation is off. You can turn it on above.</small>
                </p>
              )}
            </fieldset>

            <fieldset className="ap-group" disabled={current.fx === "none"}>
              <legend className="ap-legend">
                កម្រិត <span>· Intensity</span>
              </legend>
              <div className="ap-segments">
                {FX_LEVEL_KEYS.map((key) => (
                  <label key={key} className="ap-segment">
                    <input
                      type="radio"
                      name={`${id}-level`}
                      value={key}
                      checked={current.level === key}
                      onChange={() => choose({ level: key })}
                    />
                    <span>
                      {FX_LEVELS[key].km}
                      <small>{FX_LEVELS[key].en}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="ap-reset"
              onClick={() => {
                resetTo(defaults);
                setExplicit(false);
              }}
            >
              កំណត់ឡើងវិញ <span>· Reset to default</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
