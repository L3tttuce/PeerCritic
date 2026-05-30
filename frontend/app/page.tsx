"use client"

import Navbar from "@/app/navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import HomePageMovies from "@/app/home-page-carousels";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Define TypeScript type for Search Movies object returned by API
type Movie = {
  movieId: number;
  movieName: string;
  description: string;
  year: number;
  length: string;
  cover: string;
  backDrop: string;
  movieRating: number;
  movieRatingCount: number;
}

// Helper function
function HeroBannerSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl">
      <div className="relative h-130 w-full animate-pulse bg-orange-100">
        <div className="absolute inset-0 bg-orange-200" />
        <div className="absolute bottom-0 left-0 w-200 p-4">
          <div className="space-y-3 bg-gray-600/30 p-4">
            <div className="h-10 w-3/4 rounded bg-white/30" />
            <div className="h-5 w-full rounded bg-white/20" />
            <div className="h-5 w-5/6 rounded bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {

  // State to hold the fetched Search Movies 
  const [movies, setMovies] = useState<Movie[]>([]);

  // State to determine loading
  const [isLoading, setIsLoading] = useState(true);


  // Async function to fetch Search Movies from API
  async function searchMovies() {
    try {
      setIsLoading(true);
      // Send a GET resquest to the search movies endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/movies", {
        headers: {
          Accept: "application/json",
        },
        params: {
          page: 1,      // Request the first page of result
          size: 8,     // Limit results to 8 search movies
          search_text: "",
        },
      });
      // Get the item array from the Search Movies responses and store it in state
      setMovies(response.data.items as Movie[]);
    } catch (error) {
      console.error(error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    searchMovies();
  }, []);


  return (
    <div className="mx-auto">
      <Navbar />

      <div className="w-full mt-5 px-12">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="hero-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <HeroBannerSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="hero-content"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 5000,
                  }),
                ]}
                orientation="horizontal"
                className="mx-full relative"
              >
                <CarouselContent>
                  {movies.map((movie, index) => (
                    <CarouselItem key={`${movie.movieId}-${index}`}>
                      <motion.div
                        initial={{ opacity: 0.85 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <Card className="py-0">
                          <CardContent className="relative flex h-130 items-center justify-center px-0 py-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="w-full aspect-21/9"
                              src={movie.backDrop}
                              alt={movie.movieName}
                            />

                            <div className="absolute top-1/2 left-0 h-full w-200"></div>

                            <Link
                              href={`/movies/${movie.movieId}`}
                              className="absolute bottom-0 left-0 flex w-200"
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                                className="flex flex-col gap-2 bg-gray-600/40 p-4 backdrop-blur-[2px]"
                              >
                                <h1 className="text-4xl font-bold text-white">
                                  {movie.movieName}
                                </h1>
                                <h3 className="text-lg italic font-semibold text-white">
                                  {movie.description}
                                </h3>
                              </motion.div>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="absolute -left-10 top-1/2 z-10 -translate-y-1/2" />
                <CarouselNext className="absolute -right-10 top-1/2 z-10 -translate-y-1/2" />
              </Carousel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HomePageMovies />

      {/* Footer Logo + TMDB Disclaimer */}
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tmdb_logo.svg"
          alt="tmdb Logo"
          className="h-12 w-auto opacity-80"
        />

        <p className="text-sm text-gray-500 max-w-xl">
          This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
        </p>
      </div>

    </div>
  );
}
