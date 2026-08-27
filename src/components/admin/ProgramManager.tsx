"use client";

import { useState } from "react";
import type { StoryItem, WeddingEvent } from "@/lib/db/schema";
import { Button, Card, Field, Input, StatusMessage, Textarea, useApi } from "./ui";

const EMPTY_EVENT = {
  groupName: "ពេលព្រឹក",
  groupIcon: "🌸",
  timeLabel: "",
  title: "",
  description: "",
  location: "",
  icon: "",
  sortOrder: 0,
};

/** CRUD for the wedding programme and the love-story timeline. */
export function ProgramManager({
  events,
  story,
}: {
  events: WeddingEvent[];
  story: StoryItem[];
}) {
  const { busy, message, send } = useApi();
  const [draft, setDraft] = useState({ ...EMPTY_EVENT });
  const [storyDraft, setStoryDraft] = useState({ label: "", title: "", description: "", sortOrder: 0 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">កម្មវិធី & រឿងរ៉ាវស្នេហា</h1>
        <p className="mt-1 text-sm text-slate-500">កំណត់កម្មវិធីពិធីមង្គលការតាមលំដាប់</p>
      </header>

      <StatusMessage message={message} />

      <Card title="បន្ថែមកម្មវិធីថ្មី">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ក្រុម (ព្រឹក / ល្ងាច)">
            <Input value={draft.groupName} onChange={(e) => setDraft({ ...draft, groupName: e.target.value })} />
          </Field>
          <Field label="រូបតំណាងក្រុម">
            <Input value={draft.groupIcon} onChange={(e) => setDraft({ ...draft, groupIcon: e.target.value })} />
          </Field>
          <Field label="ម៉ោង" hint="ឧ. ០៦:០០ នាទីព្រឹក">
            <Input value={draft.timeLabel} onChange={(e) => setDraft({ ...draft, timeLabel: e.target.value })} />
          </Field>
          <Field label="ឈ្មោះពិធី">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="រូបតំណាង">
            <Input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
          </Field>
          <Field label="ទីកន្លែង">
            <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </Field>
          <Field label="លំដាប់">
            <Input
              type="number"
              value={draft.sortOrder}
              onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="ការពិពណ៌នា">
              <Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={busy || !draft.title.trim()}
            onClick={async () => {
              const result = await send("/api/admin/events", {
                method: "POST",
                body: JSON.stringify({ ...draft, sortOrder: Number(draft.sortOrder) || events.length + 1 }),
                successText: "បានបន្ថែមកម្មវិធី",
              });
              if (result) setDraft({ ...EMPTY_EVENT, groupName: draft.groupName, groupIcon: draft.groupIcon });
            }}
          >
            បន្ថែម
          </Button>
        </div>
      </Card>

      <Card title={`កម្មវិធីទាំងអស់ (${events.length})`}>
        <div className="space-y-3">
          {events.length === 0 && <p className="py-6 text-center text-sm text-slate-400">មិនទាន់មានកម្មវិធីទេ</p>}
          {events.map((event) => (
            <EventRow key={event.id} event={event} onChanged={send} busy={busy} />
          ))}
        </div>
      </Card>

      <Card title="បន្ថែមរឿងរ៉ាវស្នេហា">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ឆ្នាំ / ស្លាក">
            <Input value={storyDraft.label} onChange={(e) => setStoryDraft({ ...storyDraft, label: e.target.value })} />
          </Field>
          <Field label="ចំណងជើង">
            <Input value={storyDraft.title} onChange={(e) => setStoryDraft({ ...storyDraft, title: e.target.value })} />
          </Field>
          <Field label="លំដាប់">
            <Input
              type="number"
              value={storyDraft.sortOrder}
              onChange={(e) => setStoryDraft({ ...storyDraft, sortOrder: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-3">
            <Field label="ការពិពណ៌នា">
              <Textarea rows={2} value={storyDraft.description} onChange={(e) => setStoryDraft({ ...storyDraft, description: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={busy || !storyDraft.title.trim()}
            onClick={async () => {
              const result = await send("/api/admin/story", {
                method: "POST",
                body: JSON.stringify({ ...storyDraft, sortOrder: Number(storyDraft.sortOrder) || story.length + 1 }),
                successText: "បានបន្ថែមរឿងរ៉ាវ",
              });
              if (result) setStoryDraft({ label: "", title: "", description: "", sortOrder: 0 });
            }}
          >
            បន្ថែម
          </Button>
        </div>
      </Card>

      <Card title={`រឿងរ៉ាវស្នេហា (${story.length})`}>
        <div className="space-y-2">
          {story.length === 0 && <p className="py-6 text-center text-sm text-slate-400">មិនទាន់មានរឿងរ៉ាវទេ</p>}
          {story.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs text-amber-700">{item.label}</p>
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              </div>
              <Button
                variant="danger"
                type="button"
                disabled={busy}
                onClick={() => send(`/api/admin/story/${item.id}`, { method: "DELETE", successText: "បានលុប" })}
              >
                លុប
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EventRow({
  event,
  onChanged,
  busy,
}: {
  event: WeddingEvent;
  onChanged: ReturnType<typeof useApi>["send"];
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(event);

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
        <div>
          <p className="text-xs text-slate-500">
            {event.groupIcon} {event.groupName} · {event.timeLabel} · លំដាប់ {event.sortOrder}
          </p>
          <p className="text-sm font-medium text-slate-800">
            {event.icon} {event.title}
          </p>
          {event.description && <p className="text-xs text-slate-500">{event.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" type="button" onClick={() => setEditing(true)}>កែ</Button>
          <Button
            variant="danger"
            type="button"
            disabled={busy}
            onClick={() => onChanged(`/api/admin/events/${event.id}`, { method: "DELETE", successText: "បានលុប" })}
          >
            លុប
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="ក្រុម"><Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} /></Field>
        <Field label="ម៉ោង"><Input value={form.timeLabel} onChange={(e) => setForm({ ...form, timeLabel: e.target.value })} /></Field>
        <Field label="លំដាប់"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
        <Field label="ឈ្មោះពិធី"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="ទីកន្លែង"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="រូបតំណាង"><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field>
        <div className="sm:col-span-3">
          <Field label="ការពិពណ៌នា"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={() => { setForm(event); setEditing(false); }}>បោះបង់</Button>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            await onChanged(`/api/admin/events/${event.id}`, {
              method: "PUT",
              body: JSON.stringify({
                groupName: form.groupName,
                groupIcon: form.groupIcon,
                timeLabel: form.timeLabel,
                title: form.title,
                description: form.description,
                location: form.location,
                icon: form.icon,
                sortOrder: Number(form.sortOrder),
              }),
              successText: "បានរក្សាទុក",
            });
            setEditing(false);
          }}
        >
          រក្សាទុក
        </Button>
      </div>
    </div>
  );
}
