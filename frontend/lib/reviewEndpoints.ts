import type { MediaType } from "@/lib/types/media";

export type ReviewScope = "my" | "friends" | "media";

export function buildReviewEndpoint(
  scope: ReviewScope,
  mediaType: MediaType,
  id: number | string
): string {
  if (scope === "my") {
    return `/my/reviews/${mediaType}/${id}`;
  }

  if (scope === "friends") {
    return `/my/friends/reviews/${mediaType}/${id}`;
  }

  return `/my/media/reviews/${mediaType}/${id}`;
}
