import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ThemeStyle } from "@/components/ThemeStyle";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { weddingMetadata } from "@/lib/metadata";
import { getInvitationData, getWeddingBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Params, "params">): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getWeddingBySlug(decodeURIComponent(slug));
  return wedding ? weddingMetadata(wedding) : {};
}

/** A workspace's public invitation (no personalised guest name): /w/<slug> */
export default async function WorkspaceInvitation({ params, searchParams }: Params) {
  const { slug } = await params;
  const query = await searchParams;
  const wedding = await getWeddingBySlug(decodeURIComponent(slug));
  if (!wedding) notFound();
  // the default workspace lives at "/"; keep one address for it
  if (wedding.id === "main") redirect("/");
  // same escapes as "/" (see app/page.tsx)
  const skipEnvelope = query.envelope === "skip" || query.envelope === "open";
  const data = await getInvitationData(wedding.id);
  return (
    <>
      <ThemeStyle wedding={data.wedding} />
      <InvitationPage data={data} guest={null} skipEnvelope={skipEnvelope} />
    </>
  );
}
