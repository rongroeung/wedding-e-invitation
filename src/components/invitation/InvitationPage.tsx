"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Guest } from "@/lib/db/schema";
import type { InvitationData } from "@/lib/queries";
import { mediaSrc } from "@/lib/media";
import { Blessing } from "./Blessing";
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
import { SectionNav } from "./SectionNav";
import { ShareBar } from "./ShareBar";
import { Venue } from "./Venue";

/**
 * Orchestrates the whole guest-facing experience: the envelope cover, the
 * scroll-reveal animations, view tracking and the ordered sections.
 */
export function InvitationPage({
  data,
  guest,
}: {
  data: InvitationData;
  guest: Guest | null;
}) {
  const { wedding, events, story, gallery, gifts } = data;
  const [opened, setOpened] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  /* Lock scrolling while the cover is closed. */
  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [opened]);

  const navItems = useMemo(() => {
    const items = [
      { id: "invitation", label: "សំបុត្រអញ្ជើញ" },
      { id: "couple", label: "គូស្វាមីភរិយា" },
      { id: "date", label: "ថ្ងៃមង្គលការ" },
      wedding.showProgram && events.length > 0 ? { id: "program", label: "កម្មវិធី" } : null,
      { id: "venue", label: "ទីតាំង" },
      wedding.showLoveStory && story.length > 0 ? { id: "story", label: "រឿងរ៉ាវ" } : null,
      wedding.showGallery && gallery.length > 0 ? { id: "gallery", label: "រូបភាព" } : null,
      wedding.showRsvp ? { id: "rsvp", label: "បញ្ជាក់វត្តមាន" } : null,
      wedding.giftEnabled && gifts.length > 0 ? { id: "gift", label: "ចំណងដៃ" } : null,
      wedding.showContact ? { id: "contact", label: "ទំនាក់ទំនង" } : null,
    ];
    return items.filter(Boolean) as { id: string; label: string }[];
  }, [wedding, events.length, story.length, gallery.length, gifts.length]);

  const musicSrc = wedding.musicEnabled
    ? mediaSrc(wedding.musicMediaId, wedding.musicUrl)
    : "";

  return (
    <>
      <Cover
        wedding={wedding}
        guest={guest}
        opened={opened}
        onOpen={() => {
          setOpened(true);
          requestAnimationFrame(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
      />

      {opened && <SectionNav items={navItems} />}

      <main
        ref={contentRef}
        className={`relative transition-opacity duration-1000 ${
          opened ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!opened}
      >
        <InvitationMessage wedding={wedding} guest={guest} />
        <Couple wedding={wedding} />
        <DateSection wedding={wedding} />
        {wedding.showProgram && <Program events={events} />}
        <Venue wedding={wedding} />
        {wedding.showLoveStory && <LoveStory items={story} />}
        {wedding.showGallery && <Gallery images={gallery} />}
        {wedding.showRsvp && <Rsvp guest={guest} />}
        <Gift wedding={wedding} accounts={gifts} />
        {wedding.showContact && <Contact wedding={wedding} />}
        <Blessing wedding={wedding} />
        {wedding.showShare && (
          <ShareBar title={`${wedding.title} — ${wedding.groomName} & ${wedding.brideName}`} />
        )}

        <footer className="border-t border-champagne/40 px-5 py-8 text-center">
          <p className="text-[0.65rem] leading-loose text-ink/40 khmer-wrap">
            រក្សាសិទ្ធិដោយ {wedding.groomName} &amp; {wedding.brideName} · សិរីមង្គលអាពាហ៍ពិពាហ៍
          </p>
        </footer>
      </main>

      {musicSrc && (
        <MusicPlayer src={musicSrc} title={wedding.musicTitle} autoStart={opened} />
      )}
    </>
  );
}
