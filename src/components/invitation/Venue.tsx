"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { MapViewer } from "./MapViewer";
import { FlourishDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * The map link as Google will actually draw inside a frame.
 *
 * What gets pasted into the admin field varies: the embed link Google gives
 * (fine as it is), the whole `<iframe …>` snippet, a place link
 * (`google.com/maps/place/…`, which Google refuses to show in a frame) or a
 * short `maps.app.goo.gl` link (which can't be framed either). The snippet is
 * reduced to its `src`; anything else that isn't an embed link is turned into
 * one by searching for the place — its coordinates when the link carries
 * them, otherwise the venue's name and address — which needs no API key.
 */
export function embeddableMapUrl(raw: string, venue: string): string {
  let url = raw.trim();
  const snippet = url.match(/src=["']([^"']+)["']/i);
  if (snippet) url = snippet[1].replace(/&amp;/g, "&");
  if (/\/maps\/embed|[?&]output=embed/.test(url)) return url;
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? url.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const query = at ? `${at[1]},${at[2]}` : venue.trim();
  if (!query) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

/** ទីតាំងប្រារព្ធពិធី — venue details with the Google Map, loaded as it nears the screen. */
export function Venue({ wedding }: { wedding: Wedding }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapBox = useRef<HTMLDivElement>(null);
  // the embed link, or failing that the Google Maps link, made frameable
  const mapSource = wedding.mapEmbedUrl.trim() || wedding.mapUrl.trim();
  const embedUrl = mapSource ? embeddableMapUrl(mapSource, `${wedding.venueName} ${wedding.venueAddress}`) : "";
  /* the map frame is fetched when the section comes near, not on a tap */
  useEffect(() => {
    const el = mapBox.current;
    if (!el || mapLoaded) return;
    if (typeof IntersectionObserver === "undefined") {
      setMapLoaded(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMapLoaded(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mapLoaded, embedUrl]);
  const mapPicture = mediaSrc(wedding.venueMapMediaId, "");
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);

  return (
    <section id="venue" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="ទីតាំងប្រារព្ធពិធី" flourish="title-venue" />

        <div className="reveal card-panel gold-border overflow-hidden rounded-[26px]">
          <div className="px-6 py-10 text-center sm:px-10">
            <h3 className="text-lg leading-loose text-heading khmer-wrap">
              {wedding.venueName}
            </h3>
            <FlourishDivider role="fleuron" width={64} className="my-5" />
            <p className="mx-auto max-w-md text-base leading-loose text-ink/88 khmer-wrap">
              អាសយដ្ឋាន៖ {wedding.venueAddress}
            </p>

            {wedding.mapUrl && (
              <a
                href={wedding.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-7"
              >
                <span aria-hidden="true">🗺️</span>
                <span>បើក Google Maps</span>
              </a>
            )}
          </div>

          {/* the couple's own map picture: shown whole, tap to open full size */}
          {mapPicture && (
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="group block w-full border-t border-gold/40 bg-cream/40 p-3 sm:p-4"
              aria-label="ផែនទី — ចុចដើម្បីពង្រីក"
              aria-haspopup="dialog"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapPicture}
                alt="ផែនទីទៅកាន់ទីតាំងប្រារព្ធពិធី"
                loading="lazy"
                decoding="async"
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm transition group-hover:brightness-105"
              />
              <span className="mt-2 block text-center text-xs text-ink/75 khmer-wrap">ចុចលើរូបដើម្បីពង្រីក</span>
            </button>
          )}
          {mapOpen && mapPicture && (
            <MapViewer src={mapPicture} alt="ផែនទីទៅកាន់ទីតាំងប្រារព្ធពិធី" onClose={closeMap} />
          )}

          {embedUrl && (
            <div ref={mapBox} className="relative aspect-[4/3] w-full border-t border-gold/40 sm:aspect-[16/9]">
              {mapLoaded ? (
                <iframe
                  src={embedUrl}
                  title="ផែនទីទីតាំងប្រារព្ធពិធី"
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setMapLoaded(true)}
                  className="group flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cream to-beige/70"
                >
                  <span className="text-3xl" aria-hidden="true">📍</span>
                  <span className="text-sm text-heading khmer-wrap">មើលទីតាំងនៅលើផែនទី</span>
                  <span className="text-[0.65rem] text-ink/72">កំពុងផ្ទុកផែនទី…</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
