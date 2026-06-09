export type MediaType = "movie" | "tv" | "song";

export type Media = {
  id: number;
  title: string;
  year: number;
  length: string;
  cover: string;
  rating: number;
  ratingCount: number;
};

export type MediaDetail = Media & {
  description?: string;
  backDrop?: string | null;
  video: string;
  genres: string[];
  writers?: string[];
  actors?: string[];
  directors?: string[];
  reviews?: string[];
};

export type SongMedia = MediaDetail & {
  artists: string[];
};

export type Genre = {
  genreId: number;
  genreName: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type TVShowDetail = MediaDetail & {
  episodeCount: number;
  seasonCount: number;
};

export type Friend = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
};

export type MyReview = {
  reviewId: number;
  review: string | null;
  reviewRating: number;
  reviewRatingCount: number | null;
  kind: MediaType;
  title: string;
  cover: string | null;
  mediaId: number;
};

export type ReviewWithUser = {
  reviewId: number;
  review: string | null;
  reviewRating: number;
  reviewRatingCount: number | null;
  userId: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  kind: MediaType;
  title: string;
  cover?: string | null;
  mediaId: number;
};

export type MediaConfigEntry = {
  route: string;
  api: string;
  reviewKind: MediaType;
  label: string;
};

export const MEDIA_CONFIG: Record<MediaType, MediaConfigEntry> = {
  movie: {
    route: "/movies",
    api: "/movies",
    reviewKind: "movie",
    label: "Movies",
  },
  tv: {
    route: "/tvshows",
    api: "/shows",
    reviewKind: "tv",
    label: "TV Shows",
  },
  song: {
    route: "/songs",
    api: "/songs",
    reviewKind: "song",
    label: "Songs",
  },
};

export type FilterKind = "writer" | "actor" | "director" | "artist" | "genre" | "year";

export const GENRE_API_PATH: Record<MediaType, string> = {
  movie: "/genres/movies",
  tv: "/genres/shows",
  song: "/genres/songs",
};

export function mediaHref(kind: MediaType, mediaId: number): string {
  return `${MEDIA_CONFIG[kind].route}/${mediaId}`;
}
