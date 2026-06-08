// The type of media a review belongs to. (For filtering and tab selection)
export type ReviewKind = "movie" | "song" | "tv";

// Represents a single user review from the backend.
export interface Review {
  reviewId: number;                   // Unique identifier for this review
  review: string | null;              // Written review text
  reviewRating: number;               // Average Rating
  reviewRatingCount: number | null;   // Total # of ratings

  kind: ReviewKind;                   // movie, song, or tv
  title: string;
  cover?: string | null;

  movieId: number | null;
  songId: number | null;
  showId: number | null;
}

// Tabs in the review panel
export type ReviewsTab = "all" | "movie" | "song" | "tv";

// Sorting modes
export type ReviewsSort = "default" | "high" | "low" | "title";