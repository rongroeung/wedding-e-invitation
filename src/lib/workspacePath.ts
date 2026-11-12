/** Public address of a workspace's invitation (without a guest code).
 *  Client-safe (no server imports), so dashboard forms can link to it. */
export function workspacePath(slug: string) {
  return slug === "main" ? "/" : `/w/${encodeURIComponent(slug)}`;
}
