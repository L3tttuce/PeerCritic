"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define TypeScript type for Genre object returned by API
type Genre = {
  genreId: number | null;
  genreName: string;
};

// Define TypeScript type for Movie card object returned by API
type MovieCard = {
  movieId: number | null;
  movieName: string;
  description: string | null;
  year: number | null;
  length: string | null;
  cover: string | null;
  backDrop: string | null;
  movieRating: number | null;
  movieRatingCount: number | null;
};

// Define TypeScript type for TV Show card object returned by API
type TVShowCard = {
  showId: number | null;
  showName: string;
  description: string | null;
  year: number | null;
  length: string | null;
  cover: string | null;
  backDrop: string | null;
  showRating: number | null;
  showRatingCount: number | null;
};

// Define TypeScript type for Song card object returned by API
type SongCard = {
  songId: number | null;
  songName: string;
  year: number | null;
  length: string | null;
  cover: string | null;
  songRating: number | null;
  songRatingCount: number | null;
};

// Define allowed media section types
type MediaType = "movies" | "shows" | "songs";

// Define normalized media item shape used by the UI
type MediaItem = {
  id: number | null;
  title: string;
  year?: number;
  duration?: string;
  cover: string;
  rating?: number;
  href: string;
};

// Define paginated response shape returned by API
type PaginatedResponse<T> = {
  items: T[];
};

// Define paginated response shape returned by API
type MediaSectionConfig<T> = {
  type: MediaType;
  title: string;
  seeMoreHref: string;
  itemsEndpoint: string;
  genresEndpoint: string;
  mapItem: (item: T) => MediaItem;
};

// Define configuration type for each media section
type MediaCarouselSectionProps<T> = {
  config: MediaSectionConfig<T>;
};

// Define props for reusable media carousel section
const API_BASE_URL = "http://localhost:8000";

// Helper function to fetch paginated data from API
async function fetchPage<T>(endpoint: string, params?: Record<string, string | number | undefined>) {
  const response = await axios.get<PaginatedResponse<T>>(`${API_BASE_URL}${endpoint}`, {
    headers: { Accept: "application/json" },
    params,
  });

  return response.data.items;
}

// Helper function to derive display duration for TV show cards
function getShowDuration(show: TVShowCard): string | undefined {
  return show.length ?? undefined;
}

// Reusable component for a homepage media carousel section
function MediaCarouselSection<T>({ config }: MediaCarouselSectionProps<T>) {
  // State to hold fetched media items
  const [items, setItems] = useState<MediaItem[]>([]);

  // State to hold fetched media items
  const [genres, setGenres] = useState<Genre[]>([]);

  // State to hold the currently selected genre
  const [selectedGenre, setSelectedGenre] = useState("");

  // State to hold the currently selected genre
  const [isLoading, setIsLoading] = useState(true);

  // Async function to fetch media items based on selected genre
  async function loadItems(genre = "") {
    try {
      setIsLoading(true);

      const fetchedItems = await fetchPage<T>(config.itemsEndpoint, {
        page: 1,
        size: 16,
        search_genre: genre || undefined,
      });

      setItems(fetchedItems.map(config.mapItem));
    } catch (error) {
      console.error(`Error fetching ${config.title.toLowerCase()}:`, error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle genre selection and refetch matching items
  function handleGenreSelect(genre: string) {
    const nextGenre = selectedGenre === genre ? "" : genre;
    setSelectedGenre(nextGenre);
    void loadItems(nextGenre);
  }

  // Fetch genres and initial media items on page load
  useEffect(() => {
    async function loadSectionData() {
      try {
        setIsLoading(true);

        const [fetchedGenres, fetchedItems] = await Promise.all([
          fetchPage<Genre>(config.genresEndpoint, { page: 1, size: 99 }),
          fetchPage<T>(config.itemsEndpoint, { page: 1, size: 16 }),
        ]);

        setGenres(fetchedGenres);
        setItems(fetchedItems.map(config.mapItem));
      } catch (error) {
        console.error(`Error loading ${config.title.toLowerCase()} section:`, error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSectionData();
  }, [config]);

  return (
    //Header
    <div className="mx-12">
      <div className="flex items-center justify-between px-2 py-4">
        <h2 className="text-black text-3xl font-bold">{config.title}</h2>

        <Link
          href={config.seeMoreHref}
          className="flex items-center gap-2 text-orange-400 font-bold text-lg hover:text-orange-300 transition"
        >
          <span>See More</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      {/*Genre Carousel*/}
      <div className="relative py-2">
        <Carousel
          opts={{ align: "start", dragFree: true, loop: true }}
          className="w-full overflow-visible"
        >
          <div className="mx-8 overflow-hidden">
            <CarouselContent className="pl-1 pr-6">
              <CarouselItem className="basis-[160px]">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Badge
                    className={cn(
                      "flex w-full justify-center cursor-pointer border-orange-400 px-4 py-2 text-sm bg-transparent text-gray-800 hover:bg-orange-400 hover:text-white whitespace-nowrap transition-all duration-200",
                      selectedGenre === "" && "bg-orange-400 text-white"
                    )}
                    onClick={() => !isLoading && handleGenreSelect("")}
                  >
                    All
                  </Badge>
                </motion.div>
              </CarouselItem>

              {genres.map((genre, index) => (
                <CarouselItem
                  key={`genre-${genre.genreId ?? "no-id"}-${index}`}
                  className="basis-[160px]"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.02 }}
                  >
                    <Badge
                      className={cn(
                        "flex w-full justify-center cursor-pointer border-orange-400 px-4 py-2 text-sm bg-transparent text-gray-800 hover:bg-orange-400 hover:text-white whitespace-nowrap transition-all duration-200",
                        selectedGenre === genre.genreName && "bg-orange-400 text-white"
                      )}
                      onClick={() => !isLoading && handleGenreSelect(genre.genreName)}
                    >
                      {genre.genreName}
                    </Badge>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>

          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-primary/90" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-primary/90" />
        </Carousel>
      </div>

      {/*Media Carousel*/}
      <div className="mt-4 relative py-4 px-12">
        <Carousel
          key={`${config.type}-${selectedGenre || "all"}-${isLoading ? "loading" : "ready"}`}
          opts={{ align: "start", dragFree: true }}
          className="w-full relative"
        >
          <CarouselContent className="pr-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <CarouselItem
                  key={`skeleton-${index}`}
                  className="basis-1/3 md:basis-1/5 lg:basis-1/6 xl:basis-1/7 py-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="px-2"
                  >
                    <div className="overflow-hidden rounded-lg border border-orange-300 bg-orange-100">
                      <div className="aspect-[2/3] w-full animate-pulse bg-orange-200" />
                      <div className="space-y-3 p-4">
                        <div className="h-5 w-3/4 animate-pulse rounded bg-orange-200" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-orange-200" />
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))
            ) : items.length === 0 ? (
              <CarouselItem
                key={`empty-${selectedGenre || "all"}`}
                className="basis-full py-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex w-full justify-center py-12 text-center text-gray-500 text-lg font-medium"
                >
                  Nothing matched {selectedGenre ? `"${selectedGenre}"` : "your search"}.
                </motion.div>
              </CarouselItem>
            ) : (
              items.map((item, index) => (
                <CarouselItem
                  key={`${config.type}-${selectedGenre || "all"}-${item.id ?? "no-id"}-${index}`}
                  className="basis-1/3 md:basis-1/5 lg:basis-1/6 xl:basis-1/7 py-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.25,
                      ease: "easeOut",
                      delay: index * 0.03,
                    }}
                    className="px-2"
                  >
                    <Link href={item.href} className="block select-none">
                      <div className="relative transition-transform duration-200 hover:scale-[1.05] hover:z-10">
                        <Card className="bg-orange-200 border-orange-400 border rounded-lg pt-0 h-full">
                          <div className="w-full aspect-[2/3] overflow-hidden rounded-t-lg border-b border-orange-400">
                            <img
                              src={item.cover}
                              alt={item.title}
                              draggable={false}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          </div>

                          <CardHeader>
                            <CardTitle className="line-clamp-1">{item.title}</CardTitle>

                            <CardDescription className="flex flex-col gap-3 text-gray-500">
                              <div className="flex gap-3">
                                {item.year !== undefined && <span>{item.year}</span>}
                                {item.duration && <span>{item.duration}</span>}
                              </div>
                              {typeof item.rating === "number" && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4" fill="#F3B413" color="#F3B413" />
                                  <span className="font-bold text-gray-500">{item.rating}</span>
                                </div>
                              )}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))
            )}
          </CarouselContent>

          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 bg-white" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 bg-white" />
        </Carousel>
      </div>
    </div>
  );
}

// Config object for Movies section
const movieSection: MediaSectionConfig<MovieCard> = {
  type: "movies",
  title: "Movies",
  seeMoreHref: "/movies",
  itemsEndpoint: "/movies",
  genresEndpoint: "/genres/movies",
  mapItem: (movie) => ({
    id: movie.movieId,
    title: movie.movieName,
    year: movie.year ?? undefined,
    duration: movie.length ?? undefined,
    cover: movie.cover ?? "/placeholder.png",
    rating: movie.movieRating ?? undefined,
    href: `/movies/${movie.movieId}`,
  }),
};

// Config object for TV Shows section
const showSection: MediaSectionConfig<TVShowCard> = {
  type: "shows",
  title: "TV Shows",
  seeMoreHref: "/tvshows",
  itemsEndpoint: "/shows",
  genresEndpoint: "/genres/shows",
  mapItem: (show) => ({
    id: show.showId,
    title: show.showName,
    year: show.year ?? undefined,
    duration: getShowDuration(show),
    cover: show.cover ?? "/placeholder.png",
    rating: show.showRating ?? undefined,
    href: `/tvshows/${show.showId}`,
  }),
};

// Config object for Songs section
const songSection: MediaSectionConfig<SongCard> = {
  type: "songs",
  title: "Songs",
  seeMoreHref: "/songs",
  itemsEndpoint: "/songs",
  genresEndpoint: "/genres/songs",
  mapItem: (song) => ({
    id: song.songId,
    title: song.songName,
    year: song.year ?? undefined,
    duration: song.length ?? undefined,
    cover: song.cover ?? "/placeholder.png",
    rating: song.songRating ?? undefined,
    href: `/songs/${song.songId}`,
  }),
};

export default function HomePageCarousels() {
  return (
    <div className="space-y-2">
      <MediaCarouselSection config={movieSection} />
      <MediaCarouselSection config={showSection} />
      <MediaCarouselSection config={songSection} />
    </div>
  );
}