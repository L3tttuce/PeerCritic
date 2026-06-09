export type ReviewKind = "movie" | "song" | "tv";

export interface Review {
  reviewId: number;
  review: string | null;
  reviewRating: number;
  reviewRatingCount: number | null;
  kind: ReviewKind;
  title: string;
  cover?: string | null;
  mediaId: number;
}

export type ReviewsTab = "all" | "movie" | "song" | "tv";
export type ReviewsSort = "default" | "high" | "low" | "title";
