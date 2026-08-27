"use client";

import { useState } from "react";
import type { GalleryImage } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, useApi } from "./ui";

/** Upload, caption, reorder and delete gallery photographs. */
export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { busy, message, send } = useApi();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  async function addFromMedia(mediaId: string) {
    await send("/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ mediaId, caption, sortOrder: images.length + 1 }),
      successText: "បានបញ្ចូលរូបភាព",
    });
    setCaption("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">វិចិត្រសាលរូបភាព</h1>
          <p className="mt-1 text-sm text-slate-500">អនុស្សាវរីយ៍របស់យើង · {images.length} រូប</p>
        </div>
      </header>

      <StatusMessage message={message} />

      <Card title="បន្ថែមរូបភាព" description="ផ្ទុករូបភាព ឬបញ្ចូល URL (អតិបរមា 6MB ក្នុងមួយរូប)">
        <div className="space-y-4">
          <Field label="ចំណងជើងរូបភាព (ស្រេចចិត្ត)">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="ឧ. ពិធីភ្ជាប់ពាក្យ" />
          </Field>

          <MediaUpload label="ផ្ទុករូបភាព" onUploaded={addFromMedia} />

          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <div className="min-w-[240px] flex-1">
              <Field label="ឬបញ្ចូល URL រូបភាព">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </Field>
            </div>
            <Button
              type="button"
              disabled={busy || !url.trim()}
              onClick={async () => {
                const result = await send("/api/admin/gallery", {
                  method: "POST",
                  body: JSON.stringify({ url: url.trim(), caption, sortOrder: images.length + 1 }),
                  successText: "បានបញ្ចូលរូបភាព",
                });
                if (result) { setUrl(""); setCaption(""); }
              }}
            >
              បន្ថែម URL
            </Button>
          </div>
        </div>
      </Card>

      <Card title="រូបភាពទាំងអស់">
        {images.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">មិនទាន់មានរូបភាពទេ</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} send={send} busy={busy} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ImageCard({
  image,
  send,
  busy,
}: {
  image: GalleryImage;
  send: ReturnType<typeof useApi>["send"];
  busy: boolean;
}) {
  const [caption, setCaption] = useState(image.caption);
  const [order, setOrder] = useState(image.sortOrder);

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaSrc(image.mediaId, image.url)}
        alt={image.caption}
        className="aspect-[4/5] w-full object-cover"
        loading="lazy"
      />
      <figcaption className="space-y-2 p-3">
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="ចំណងជើង" />
        <div className="flex gap-2">
          <Input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-20"
            aria-label="លំដាប់"
          />
          <Button
            variant="ghost"
            type="button"
            disabled={busy}
            className="flex-1"
            onClick={() =>
              send(`/api/admin/gallery/${image.id}`, {
                method: "PUT",
                body: JSON.stringify({ caption, sortOrder: Number(order) }),
                successText: "បានរក្សាទុក",
              })
            }
          >
            រក្សាទុក
          </Button>
        </div>
        <Button
          variant="danger"
          type="button"
          disabled={busy}
          className="w-full"
          onClick={() => send(`/api/admin/gallery/${image.id}`, { method: "DELETE", successText: "បានលុប" })}
        >
          លុបរូបភាព
        </Button>
      </figcaption>
    </figure>
  );
}
