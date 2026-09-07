/**
 * Where the pre-wedding film comes from, and how it has to be played.
 *
 * There are two genuinely different things a couple can give us and they cannot
 * be treated the same way, which is the entire reason this file exists rather
 * than an `<video src={wedding.videoUrl}>` somewhere.
 *
 * A **file** — uploaded, or a link ending in `.mp4` — goes in a `<video>`. We
 * own it: it can be muted, autoplayed, and it tells us when it has finished, so
 * the invitation can carry on by itself.
 *
 * An **embed** — YouTube, Vimeo, Facebook — goes in an `<iframe>`. It can be
 * asked to autoplay muted through its URL, but it is a different origin and it
 * will not tell us when it ends without loading that platform's own JavaScript
 * into the page. So an embed always shows a "carry on" button and waits for the
 * guest, and the dashboard says so in as many words. Guessing an end time and
 * cutting the film off part way through would be worse than asking.
 *
 * Only `http` and `https` survive. Everything here is set by an authenticated
 * admin, so this is not a defence against an attacker so much as against a
 * paste gone wrong — but a `javascript:` URL in an iframe `src` is a hole
 * whoever put it there, and the check costs one line.
 */

export type VideoSource =
  | { kind: "file"; src: string; poster: string }
  | { kind: "embed"; src: string; poster: string };

type VideoFields = {
  videoEnabled: boolean;
  videoUrl: string;
  videoMediaId: string | null;
  videoPosterId: string | null;
};

/** The embed hosts we know how to build a URL for. Anything else is a file. */
const YOUTUBE = /^(?:www\.|m\.)?(?:youtube\.com|youtube-nocookie\.com)$/i;
const VIMEO = /^(?:www\.|player\.)?vimeo\.com$/i;
const FACEBOOK = /^(?:www\.|web\.|m\.)?(?:facebook\.com|fb\.watch)$/i;

/**
 * The film for this wedding, or `null` if there is nothing to play.
 *
 * An upload beats a link when both are set: someone who went to the trouble of
 * uploading a file meant it, and leaving a stale link to win silently is the
 * kind of behaviour nobody can debug from the dashboard.
 */
export function videoSource(wedding: VideoFields): VideoSource | null {
  if (!wedding.videoEnabled) return null;

  const poster = wedding.videoPosterId ? `/api/media/${wedding.videoPosterId}` : "";

  if (wedding.videoMediaId) {
    return { kind: "file", src: `/api/media/${wedding.videoMediaId}`, poster };
  }

  const raw = wedding.videoUrl.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const embed = embedUrl(url);
  if (embed) return { kind: "embed", src: embed, poster };

  return { kind: "file", src: url.toString(), poster };
}

/**
 * The platform's own player URL, muted and set to play on sight.
 *
 * `mute=1` is not a preference, it is the price of `autoplay=1`: every mobile
 * browser refuses to start a video with sound without a gesture, and a player
 * that has been told to autoplay and is not allowed to shows a paused frame
 * with a play button in the middle of it. Muted, it actually plays.
 *
 * `playsinline` matters for the same reason: without it iOS takes the video
 * full-screen into its own player, which throws the guest out of the
 * invitation and into a system UI they have to dismiss to get back.
 */
function embedUrl(url: URL): string | null {
  const host = url.hostname;

  if (host.toLowerCase() === "youtu.be" || YOUTUBE.test(host)) {
    const id =
      host.toLowerCase() === "youtu.be"
        ? url.pathname.slice(1)
        : (url.searchParams.get("v") ??
          (/^\/(?:embed|shorts|live)\/([\w-]+)/.exec(url.pathname)?.[1] ?? ""));
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    /* `youtube-nocookie` because a wedding invitation should not be setting
       advertising cookies on the couple's guests. */
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
  }

  if (VIMEO.test(host)) {
    const id = /\/(?:video\/)?(\d{6,12})/.exec(url.pathname)?.[1];
    if (!id) return null;
    return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`;
  }

  if (FACEBOOK.test(host)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url.toString(),
    )}&autoplay=true&mute=1&show_text=false`;
  }

  return null;
}
