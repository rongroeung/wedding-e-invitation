"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Guest } from "@/lib/db/schema";
import type { InvitationData } from "@/lib/queries";
import { mediaSrc } from "@/lib/media";
import { Blessing } from "./Blessing";
import { envelopeConfig } from "@/lib/envelope";
import { frameConfig } from "@/lib/frame";
import { CARD_SCROLL_ID, CardShell } from "./CardShell";
import { ControlsRail, EventDetailsRail } from "./Rails";
import { Contact } from "./Contact";
import { Couple } from "./Couple";
import { Cover } from "./Cover";
import { DateSection } from "./DateSection";
import { InvitationOpening } from "./envelope/InvitationOpening";
import { Gallery } from "./Gallery";
import { Gift } from "./Gift";
import { InvitationMessage } from "./InvitationMessage";
import { LoveStory } from "./LoveStory";
import { MusicPlayer } from "./MusicPlayer";
import { PreWeddingVideo } from "./PreWeddingVideo";
import { Program } from "./Program";
import { Rsvp, type RsvpReply } from "./Rsvp";
import { ShareBar } from "./ShareBar";
import { VelvetCurtains } from "./VelvetCurtains";
import { WeddingStage } from "./WeddingStage";
import { Venue } from "./Venue";
import { useRichDevice } from "./envelope/usePointerTilt";
import { videoSource } from "@/lib/video";

/**
 * Orchestrates the whole guest-facing experience: the envelope cover, the
 * scroll-reveal animations, view tracking and the ordered sections.
 */
export function InvitationPage({
  data,
  guest,
  rsvpStatus: initialRsvpStatus = "pending",
  rsvpReply = null,
  skipEnvelope = false,
}: {
  data: InvitationData;
  guest: Guest | null;
  rsvpStatus?: "attending" | "declined" | "pending";
  /** The guest's stored reply, so a returning guest is thanked, not re-asked. */
  rsvpReply?: RsvpReply | null;
  /**
   * `?envelope=skip`: go straight to the invitation.
   *
   * Read on the server, so it works with no JavaScript at all — which is the
   * point of it. It is what the skip link falls back to, and it means no guest
   * can ever be trapped behind the envelope by a script that did not run.
   */
  skipEnvelope?: boolean;
}) {
  const { wedding, events, story, gallery } = data;
  const [opened, setOpened] = useState(false);
  /*
   * The envelope has been opened and has left the screen.
   *
   * It is deliberately *not* the same thing as the invitation being opened.
   * The envelope hands the guest the card; it does not read the card for them.
   * What the envelope's own card morphs onto is the home page — the same
   * monogram, the same names, the same gold frame — so the guest arrives on a
   * cover that is whole and still closed, and opens it themselves.
   */
  const [envelopeDone, setEnvelopeDone] = useState(false);
  /*
   * The velvet is across the invitation until this is true.
   *
   * It is a separate state from `envelopeDone` and not derived from it, because
   * the two have to be a beat apart. The envelope's veil takes a moment to
   * dissolve, and curtains that start moving in the middle of that dissolve
   * read as two things happening at once rather than as one shot carrying on.
   */
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [curtainsStruck, setCurtainsStruck] = useState(false);
  const [curtainsGone, setCurtainsGone] = useState(false);
  /*
   * The envelope's veil has actually left the screen.
   *
   * Distinct from `envelopeDone`, which fires a step early so the music can be
   * running by the time the veil clears. Hanging the curtains off that earlier
   * cue opened them *behind* the veil: by the time the guest could see the
   * stage the velvet was already a quarter drawn, so the one movement the whole
   * second half of the sequence is built around happened off screen.
   */
  const [veilGone, setVeilGone] = useState(false);
  /*
   * The pre-wedding film has finished, or the guest has carried on past it.
   *
   * When there is no film this starts true, so nothing anywhere below has to
   * ask whether one was configured — the curtains simply wait on a condition
   * that is already met. A beat that costs nothing when it is switched off is
   * the only kind worth adding to a sequence this tightly timed.
   */
  const film = videoSource(wedding);
  const [filmDone, setFilmDone] = useState(!film);
  /* Fade the film out on its own beat, then unmount it, exactly as the
     curtains are struck: something that has finished should be seen leaving. */
  const [filmGone, setFilmGone] = useState(!film);
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvpStatus);
  const giftQr = mediaSrc(wedding.giftQrMediaId, wedding.giftQrUrl);
  const frame = frameConfig(wedding);
  const envelope = envelopeConfig(wedding);
  const contentRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);
  const open = useCallback(() => setOpened(true), []);
  const envelopeOver = useCallback(() => setEnvelopeDone(true), []);
  const veilCleared = useCallback(() => {
    setEnvelopeDone(true);
    setVeilGone(true);
  }, []);
  const rich = useRichDevice();

  /*
   * Raise the curtain. With an envelope it goes up once the envelope has left;
   * with no envelope there is nothing to wait for, so it goes up on arrival —
   * but still a beat late, so a guest who lands on the page sees it open rather
   * than finding it already open, which is the whole point of a curtain.
   */
  /*
   * Fade once the parting has finished, and unmount once the fade has. Both
   * numbers are read off the transitions they follow — the curtain's own
   * 2300ms travel, then the 800ms fade below — so a change to either in the
   * stylesheet has to be matched here. They are deliberately not `transitionend`
   * listeners: the panels are two elements with several animatable properties
   * between them, and a tab backgrounded mid-transition may never fire one.
   */
  useEffect(() => {
    if (!curtainsOpen) return;
    const strike = setTimeout(() => setCurtainsStruck(true), 2400);
    const clear = setTimeout(() => setCurtainsGone(true), 3300);
    return () => {
      clearTimeout(strike);
      clearTimeout(clear);
    };
  }, [curtainsOpen]);

  useEffect(() => {
    if (envelope.enabled && !veilGone) return;
    /*
     * And not while the film is still running. With no film this is true from
     * the first render and the timing is exactly what it was.
     */
    if (!filmDone) return;
    /*
     * No pause with an envelope. The velvet has been hanging there closed since
     * well before the veil dissolved, so the moment the veil is gone the next
     * thing owed to the guest is the curtain moving — a beat of stillness there
     * reads as the sequence having finished and then started again.
     *
     * A film changes that one number and nothing else: the guest has just
     * watched something end, so the curtain wants a breath before it moves
     * rather than treading on the last frame.
     */
    const timer = setTimeout(
      () => setCurtainsOpen(true),
      /*
       * 700ms after the film says it is done, which is most of the way through
       * its own 900ms fade. The curtain's first movement happens behind what is
       * left of it — an overlap, like every other hand-over here — but by the
       * time the parting is wide enough to read, the film has gone. Waiting for
       * the fade to finish leaves a beat of stillness that reads as the
       * sequence having ended and then started again; not waiting at all shows
       * the guest a curtain already half open when the film clears.
       */
      !envelope.enabled ? 900 : film ? 700 : 60,
    );
    return () => clearTimeout(timer);
  }, [envelope.enabled, veilGone, filmDone, film]);

  /*
   * The film's exit: fade, then unmount.
   *
   * Two steps rather than one, and the numbers are read off `.film`'s own
   * transition. Unmounting it the moment it is done would cut to the velvet;
   * leaving it mounted and transparent would leave a `fixed inset-0` element
   * over the whole invitation for the rest of the visit, which is a page that
   * cannot be tapped.
   */
  useEffect(() => {
    if (!filmDone || filmGone) return;
    const timer = setTimeout(() => setFilmGone(true), 950);
    return () => clearTimeout(timer);
  }, [filmDone, filmGone]);

  /* Hold the page still behind the cover when the page is what scrolls. */
  useEffect(() => {
    if (frame.sticky) return;
    document.body.style.overflow = opened ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened, frame.sticky]);

  /* Record the view once per page load. */
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const controller = new AbortController();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, guestCode: guest?.code ?? "" }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [guest?.code]);

  /* Scroll-reveal animations. */
  useEffect(() => {
    if (!opened) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    // The card scrolls inside its frame, so that element is the observer's
    // root — against the viewport nothing below the fold would ever intersect.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.style.transitionDelay = `${Math.min(index * 90, 270)}ms`;
          element.classList.add("is-visible");
          observer.unobserve(element);
        });
      },
      {
        // With a fixed frame the card's own region scrolls, so that is the
        // root; otherwise the page scrolls and the viewport is.
        root: frame.sticky ? document.getElementById(CARD_SCROLL_ID) : null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [opened, frame.sticky]);

  const musicSrc = wedding.musicEnabled
    ? mediaSrc(wedding.musicMediaId, wedding.musicUrl)
    : "";

  /*
   * Music never starts before a gesture, and the gesture is the guest opening
   * the envelope. If the couple would rather it stayed quiet after that, the
   * existing player is still there for the guest to start themselves — there
   * is only ever one player.
   */
  /*
   * With an envelope, the gesture is opening it — and whether that should also
   * start the music is the couple's setting, not ours. Without one, the gesture
   * is the guest opening the cover.
   */
  const musicStart = envelope.enabled ? envelopeDone && envelope.music : opened;

  const musicButton = musicSrc ? (
    <MusicPlayer src={musicSrc} title={wedding.musicTitle} autoStart={musicStart} inline />
  ) : null;

  const card = (
    <CardShell
      frame={frame}
      scrollable={opened}
      cover={
        <Cover
          wedding={wedding}
          guest={guest}
          opened={opened}
          onOpen={open}
          /*
           * The monogram draws itself in when the velvet starts to part, which
           * is the first moment a guest can see it. Hung off mount it would
           * play out behind closed curtains and be finished before anyone
           * looked; with no envelope at all `curtainsOpen` is still the right
           * cue, because the curtain is what is in front of the cover either
           * way.
           */
          reveal={curtainsOpen}
        />
      }
      curtains={
        curtainsGone ? null : (
          <VelvetCurtains open={curtainsOpen} struck={curtainsStruck} />
        )
      }
      left={<EventDetailsRail wedding={wedding} />}
      right={<ControlsRail guest={guest} rsvpStatus={rsvpStatus} music={musicButton} />}
    >
      <main
        ref={contentRef}
        className={`relative transition-opacity duration-1000 ${
          opened ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!opened}
      >
        <InvitationMessage wedding={wedding} />
        <Couple wedding={wedding} />
        <DateSection wedding={wedding} />
        {wedding.showProgram && <Program events={events} />}
        <Venue wedding={wedding} />
        {wedding.showLoveStory && <LoveStory items={story} />}
        {wedding.showGallery && <Gallery images={gallery} />}
        {wedding.showRsvp && (
          <Rsvp
            guest={guest}
            reply={rsvpReply}
            onSubmitted={(attending) => setRsvpStatus(attending ? "attending" : "declined")}
          />
        )}
        <Gift wedding={wedding} />
        {wedding.showContact && <Contact wedding={wedding} />}
        <Blessing wedding={wedding} />
        {wedding.showShare && (
          <ShareBar title={`${wedding.title} — ${wedding.groomName} & ${wedding.brideName}`} />
        )}

        <footer className="px-5 pb-4 pt-4 text-center">
          <p className="text-[0.65rem] leading-loose text-ink/70 khmer-wrap">
            {wedding.groomName} &amp; {wedding.brideName} · {wedding.title}
          </p>
        </footer>
      </main>

      {/* On phones the player floats over the card; on desktop it lives in the rail */}
      {musicSrc && (
        <div className="xl:hidden">
          <MusicPlayer src={musicSrc} title={wedding.musicTitle} autoStart={musicStart} />
        </div>
      )}

    </CardShell>
  );

  /*
   * The envelope is a sibling of the card, not a child of it.
   *
   * Inside, it would sit in the scroll region's stacking context — under the
   * cover, whatever its z-index — and the region's mask would establish a
   * containing block that clips even `position: fixed`. Out here it is
   * genuinely full-screen, and it still renders on the server, so a guest
   * never sees the invitation flash past before the envelope arrives.
   */
  return (
    <>
      {/*
        * The stage is the page, not a backdrop behind a scene that ends.
        *
        * That is the load-bearing decision in the whole sequence. The envelope
        * is played over the top of an invitation that is *already there* — laid
        * out, lit, and with the velvet already across it — so when the veil
        * dissolves there is nothing to build and nothing to wait for. The
        * alternative, a second copy of the wedding stage living inside the
        * overlay and handing over at the end, is where a cut would be
        * unavoidable however carefully the two were matched.
        */}
      <WeddingStage lit={curtainsOpen} rich={rich}>
        {card}
      </WeddingStage>
      {/*
        * The film, mounted *before* the envelope so it is already there and
        * fully opaque when the envelope's veil dissolves onto it. This is the
        * same rule the velvet is hung by, and for the same reason: a scene
        * that fades in on the cue that the previous one fades out reads as a
        * cut however smoothly each half is animated on its own.
        *
        * `envelopeDone` and not `veilGone` is the cue, and the difference is
        * the whole hand-over: `envelopeDone` fires as the dissolve *starts*, so
        * the film is mounted, painted and already playing through the second
        * the veil takes to clear. Mounted on `veilGone` it would appear at the
        * exact moment the envelope vanished, which is a cut. Mounted from the
        * first render it would be over before the guest had tapped anything.
        *
        * It is mounted only while the envelope is enabled, because with no
        * envelope there is no "after the envelope" for it to be after — the
        * guest lands directly on the invitation and a film in front of it
        * would be a splash screen.
        */}
      {film && envelope.enabled && envelopeDone && !filmGone && (
        <PreWeddingVideo
          source={film}
          skipLabel={wedding.videoSkipLabel}
          continueLabel={wedding.videoContinueLabel}
          gone={filmDone}
          onDone={() => setFilmDone(true)}
        />
      )}

      {/* `skipEnvelope` is the server honouring `?envelope=skip` — the one way
          past this overlay that needs no JavaScript at all. */}
      {envelope.enabled && !skipEnvelope && (
        <InvitationOpening
          wedding={wedding}
          guest={guest}
          envelope={envelope}
          frame={frame}
          onOpen={envelopeOver}
          onFinished={veilCleared}
        />
      )}
    </>
  );
}
