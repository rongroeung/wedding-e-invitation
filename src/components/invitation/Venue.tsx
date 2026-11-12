"use client";

import { useCallback, useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { MapViewer } from "./MapViewer";
import { Flourish, FlourishDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** ទីតាំងប្រារព្ធពិធី — venue details with a lazily-mounted Google Map. */
export function Venue({ wedding }: { wedding: Wedding }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapPicture = mediaSrc(wedding.venueMapMediaId, "");
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);

  return (
    <section id="venue" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="ទីកន្លែង" title="ទីតាំងប្រារព្ធពិធី" flourish="title-venue" />

        <div className="reveal card-panel gold-border overflow-hidden rounded-[26px]">
          <div className="px-6 py-10 text-center sm:px-10">
            <Flourish role="rosette" className="mx-auto w-7" />
            <h3 className="mt-5 text-lg leading-loose text-heading khmer-wrap">
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

          {wedding.mapEmbedUrl && (
            <div className="relative aspect-[4/3] w-full border-t border-gold/40 sm:aspect-[16/9]">
              {mapLoaded ? (
                <iframe
                  src={wedding.mapEmbedUrl}
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
                  <span className="text-[0.65rem] text-ink/72">
                    ចុចដើម្បីផ្ទុកផែនទី (សន្សំទិន្នន័យអ៊ីនធឺណិត)
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
