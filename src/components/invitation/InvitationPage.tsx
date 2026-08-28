"use client";

import { useEffect, useRef, useState } from "react";
import type { Guest } from "@/lib/db/schema";
import type { InvitationData } from "@/lib/queries";
import { mediaSrc } from "@/lib/media";
import { Blessing } from "./Blessing";
import { frameConfig } from "@/lib/frame";
import { CARD_SCROLL_ID, CardShell } from "./CardShell";
import { ControlsRail, EventDetailsRail } from "./Rails";
import { Contact } from "./Contact";
import { Couple } from "./Couple";
import { Cover } from "./Cover";
import { DateSection } from "./DateSection";
import { Gallery } from "./Gallery";
import { Gift } from "./Gift";
import { InvitationMessage } from "./InvitationMessage";
import { LoveStory } from "./LoveStory";
import { MusicPlayer } from "./MusicPlayer";
import { Program } from "./Program";
import { Rsvp } from "./Rsvp";
import { ShareBar } from "./ShareBar";
import { Venue } from "./Venue";

/**
 * Orchestrates the whole guest-facing experience: the envelope cover, the
 * scroll-reveal animations, view tracking and the ordered sections.
 */
export function InvitationPage({
  data,
  guest,
  rsvpStatus: initialRsvpStatus = "pending",
}: {
  data: InvitationData;
  guest: Guest | null;
  rsvpStatus?: "attending" | "declined" | "pending";
}) {
  const { wedding, events, story, gallery } = data;
  const [opened, setOpened] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvpStatus);
  const giftQr = mediaSrc(wedding.giftQrMediaId, wedding.giftQrUrl);
  const frame = frameConfig(wedding);
  const contentRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

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

  const musicButton = musicSrc ? (
    <MusicPlayer src={musicSrc} title={wedding.musicTitle} autoStart={opened} inline />
  ) : null;

  return (
    <CardShell
      frame={frame}
      scrollable={opened}
      cover={
        <Cover
          wedding={wedding}
          guest={guest}
          opened={opened}
          onOpen={() => setOpened(true)}
        />
      }
      left={<EventDetailsRail wedding={wedding} />}
      right={<ControlsRail guest={guest} rsvpStatus={rsvpStatus} music={musicButton} />}
    >
      <main
        ref={contentRef}
        className={`relative transition-opacity duration-1000 ${
          opened
            ? "opacity-100"
            : "pointer-events-none opacity-0"
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
          <MusicPlayer src={musicSrc} title={wedding.musicTitle} autoStart={opened} />
        </div>
      )}
    </CardShell>
  );
}
