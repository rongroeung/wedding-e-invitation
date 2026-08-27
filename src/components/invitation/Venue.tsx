"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { GoldDivider, Lotus } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** ទីតាំងប្រារព្ធពិធី — venue details with a lazily-mounted Google Map. */
export function Venue({ wedding }: { wedding: Wedding }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <section id="venue" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="ទីកន្លែង" title="ទីតាំងប្រារព្ធពិធី" />

        <div className="reveal card-panel gold-border overflow-hidden rounded-[26px]">
          <div className="px-6 py-10 text-center sm:px-10">
            <Lotus className="mx-auto h-6 w-6 text-gold" />
            <h3 className="mt-5 text-xl leading-loose text-burgundy khmer-wrap sm:text-2xl">
              {wedding.venueName}
            </h3>
            <GoldDivider className="my-5" width="max-w-[140px]" icon="diamond" />
            <p className="mx-auto max-w-md text-sm leading-loose text-ink/75 khmer-wrap sm:text-base">
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

          {wedding.mapEmbedUrl && (
            <div className="relative aspect-[4/3] w-full border-t border-champagne/50 sm:aspect-[16/9]">
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
                  <span className="text-sm text-burgundy khmer-wrap">មើលទីតាំងនៅលើផែនទី</span>
                  <span className="text-[0.65rem] text-ink/50">
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
