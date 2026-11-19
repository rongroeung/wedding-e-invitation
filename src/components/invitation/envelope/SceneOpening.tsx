"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Guest, Wedding } from "@/lib/db/schema";
import type { EnvelopeConfig } from "@/lib/envelope";
import { sceneOf, type InvitationThemeKey } from "@/lib/invitationTheme";
import { NameLogo } from "@/components/ui/NameLogo";
import { coverName } from "../CoverContent";
import { envelopeSeenKey } from "./InvitationOpening";
import { KbachNameFrame } from "./KbachNameFrame";
import { OpenButton } from "./OpenButton";
import { OpenEnvelopeLink } from "./OpenEnvelopeLink";
import { OpeningTransition } from "./OpeningTransition";
import { SkipButton } from "./SkipButton";

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The opening page of Themes 2 and 3, in place of the envelope.
 *
 * - **photo**: the couple's photograph, full height, with the heading at the
 *   top and the greeting, the guest's name on the gilt plate and the open
 *   button over the foot of the picture.
 * - **a film theme** (3–6): a short film (the garden, the palace, the golden hall, the velvet stage) plays and holds
 *   on it; the heading, the couple's names and the guest's name then appear in
 *   the clear space under the arches.
 *
 * On a phone the picture fills the screen. On a wider screen it stands as a
 * portrait in the middle, over a soft, blurred copy of itself.
 *
 * It keeps the envelope's contract with the page (`onStart`, `onOpen`,
 * `onFinished`, the once-per-visit memory, the skip link and the `<a href>`
 * tap target that works without JavaScript), so everything after it — the
 * music, the film, the curtains, the cover — runs exactly as it does after
 * the envelope.
 */
export function SceneOpening({
  variant,
  photo,
  wedding,
  guest,
  envelope,
  onStart,
  onOpen,
  onFinished,
}: {
  /** "photo" (Theme 2), or a film theme (3–6, lib/invitationTheme SCENES). */
  variant: "photo" | InvitationThemeKey;
  /** Theme 2's photograph. */
  photo?: string;
  wedding: Wedding;
  guest: Guest | null;
  envelope: EnvelopeConfig;
  onStart?: () => void;
  onOpen: () => void;
  onFinished: () => void;
}) {
  type Step = "closed" | "leaving" | "gone" | "done";
  const [step, setStep] = useState<Step>("closed");
  /* The garden's words wait for the walk into the conservatory to finish. */
  const film = variant === "photo" ? undefined : sceneOf(variant);
  const [arrived, setArrived] = useState(!film);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const opened = useRef(false);
  const cleared = useRef(false);
  const video = useRef<HTMLVideoElement>(null);

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const finish = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    onOpenRef.current();
  }, []);
  const clear = useCallback(() => {
    setStep("done");
    if (cleared.current) return;
    cleared.current = true;
    onFinishedRef.current();
  }, []);

  /* Opened already during this visit: straight through, as the envelope does. */
  useIsoLayout(() => {
    if (envelope.everyVisit) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(envelopeSeenKey(guest?.code ?? "")) === "1";
    } catch {
      /* storage blocked: show it */
    }
    if (seen) {
      finish();
      clear();
    }
  }, []);

  useEffect(() => {
    document.querySelector("[data-opening]")?.setAttribute("data-hydrated", "yes");
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    document.querySelector("[data-opening]")?.setAttribute("data-step", step);
  });

  /*
   * The garden film. Muted, so every browser lets it play by itself; when one
   * will not (a phone in low-power mode) the poster is the film's last frame,
   * so the guest simply arrives where the film would have taken them. The
   * words come in at the end of the walk, or at once if there is no walk.
   */
  useEffect(() => {
    if (!film) return;
    const v = video.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const arrive = () => setArrived(true);
    if (!v || reduced) {
      arrive();
      return;
    }
    v.addEventListener("ended", arrive);
    v.addEventListener("error", arrive);
    // the longest film is 15 s; never leave the words hidden past that
    const fallback = window.setTimeout(arrive, 17000);
    v.play().catch(arrive);
    return () => {
      v.removeEventListener("ended", arrive);
      v.removeEventListener("error", arrive);
      clearTimeout(fallback);
    };
  }, [film]);

  const remember = useCallback(() => {
    try {
      window.sessionStorage.setItem(envelopeSeenKey(guest?.code ?? ""), "1");
    } catch {
      /* the guest sees it again next time */
    }
  }, [guest?.code]);

  const jump = useCallback(() => {
    started.current = true;
    onStartRef.current?.();
    timers.current.forEach(clearTimeout);
    remember();
    finish();
    setStep("gone");
    timers.current.push(window.setTimeout(clear, 480));
  }, [clear, finish, remember]);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    onStartRef.current?.();
    remember();
    setArrived(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !envelope.animate) {
      jump();
      return;
    }
    /* the words lift away and the picture leans in, then the scene dissolves */
    setStep("leaving");
    timers.current.push(
      window.setTimeout(() => {
        finish();
        setStep("gone");
      }, 900),
    );
    timers.current.push(window.setTimeout(clear, 900 + 1000));
  }, [clear, envelope.animate, finish, jump, remember]);

  if (step === "done") return null;

  const name = coverName(wedding, guest);
  const closed = step === "closed";
  const garden = Boolean(film);
  const backdrop = film ? film.still : photo ?? "";

  return (
    <OpeningTransition gone={step === "gone"} duration={step === "gone" ? 1000 : 420}>
      <div
        className={`scene scene-${variant} ${film ? `scene-film ${film.dark ? "scene-film-dark" : ""}` : ""} ${
          step !== "closed" ? "scene-leaving" : ""
        }`}
      >
        {/* the soft surround on a wide screen */}
        <span className="scene-surround" style={{ backgroundImage: `url("${backdrop}")` }} aria-hidden="true" />

        <div className="scene-frame">
          {film ? (
            <video
              ref={video}
              className="scene-media"
              src={film.intro}
              poster={film.still}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="scene-media" src={backdrop} alt="" aria-hidden="true" />
          )}
          <span className="scene-shade" aria-hidden="true" />

          {closed && <OpenEnvelopeLink label={wedding.envelopeOpenLabel} onOpen={start} />}

          <div className={`scene-words pointer-events-none ${arrived ? "scene-words-in" : ""}`}>
            <div className="scene-top">
              {wedding.envelopeTitle.trim() && (
                <h1 className="scene-title khmer-wrap">{wedding.envelopeTitle}</h1>
              )}
              {garden && (
                <NameLogo
                  groom={wedding.groomName}
                  bride={wedding.brideName}
                  font={wedding.monogramFont}
                  state={arrived ? "play" : "wait"}
                  className="scene-names"
                />
              )}
            </div>

            <div className="scene-foot">
              {wedding.subtitle && <p className="scene-lead khmer-wrap">{wedding.subtitle}</p>}
              {garden ? (
                <p className={`scene-guest khmer-wrap ${name.latin ? "scene-guest-latin" : ""}`}>
                  <span>{name.text}</span>
                </p>
              ) : (
                <KbachNameFrame className="knf-scene">
                  <p className={`env-address-name khmer-wrap ${name.latin ? "env-address-latin" : ""}`}>
                    {name.text}
                  </p>
                </KbachNameFrame>
              )}
              <div className="scene-open pointer-events-auto">
                <OpenButton
                  label={wedding.envelopeOpenLabel}
                  hint={wedding.envelopeHint}
                  onOpen={start}
                  hidden={!closed}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {envelope.skip && <SkipButton label={wedding.envelopeSkipLabel} onSkip={jump} hidden={!closed} />}
    </OpeningTransition>
  );
}
