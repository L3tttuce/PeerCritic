"use client"

import Navbar from "@/app/navbar";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SearchIcon, Star } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent, PaginationEllipsis,
  PaginationItem,
  PaginationLink, PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

// Define type for Search Movies object returned by API
type Movie = {
  movieId: number;
  movieName: string;
  year: number;
  length: string;
  cover: string;
  movieRating: number;
  movieRatingCount: number;
}

// Define type for Get Directors object returned by API
type Director = {
  directorId: number;
  directorName: string;
}

// Define type for Get Actors object returned by API
type Actor = {
  actorId: number;
  actorName: string;
}

// Define type for Get Writers object returned by API
type Writer = {
  writerId: number;
  writerName: string;
}

// Define type for Get Genres object returned by API
type Genre = {
  genreId: number;
  genreName: string;
}

// Export the default page component rendered at the /movies route
export default function Page() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page") ?? "1");

  // State to hold the current page
  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);

  // State to hold the total pages
  const [totalPages, setTotalPages] = useState<number>(1);

  // State to hold the search text
  const [searchText, setSearchText] = useState<string>("");

  // State to hold the selected year
  const [selectedYear, setSelectedYear] = useState<string>("");

  // State to hold the fetched Search Movies 
  const [movies, setMovies] = useState<Movie[]>([]);

  // State to hold the fetched Get Directors
  const [directors, setDirectors] = useState<Director[]>([]);

  // State to hold the selected director
  const [selectedDirector, setSelectedDirector] = useState<string>("");

  // State to hold the fetched Get Actors
  const [actors, setActors] = useState<Actor[]>([]);

  // State to hold the selected actor
  const [selectedActor, setSelectedActor] = useState<string>("");

  // State to hold the fetched Get Writers
  const [writers, setWriters] = useState<Writer[]>([]);

  // State to hold the selected writer
  const [selectedWriter, setSelectedWriter] = useState<string>("");

  // State to hold the fetched Get Genres
  const [genres, setGenres] = useState<Genre[]>([]);

  // State to hold the selected genre
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  
  // State to hold the loading movies
  // State to hold loading state
  const [loadingMovies, setLoadingMovies] = useState(false);

  // Reset search options
  function reset() {
    setCurrentPage(1);
    setTotalPages(1);
    setSearchText("");
    setSelectedYear("");
    setSelectedDirector("");
    setSelectedActor("");
    setSelectedWriter("");
    setSelectedGenre("");
  }
  
  function onSearchTextChange(text: string) {
    reset();
    setSearchText(text);
  }

  function onYearSelected(year: string) {
    reset();
    setSelectedYear(year);
  }

  function onDirectorSelected(director: string) {
    reset();
    setSelectedDirector(director);
  }

  function onActorSelected(actor: string) {
    reset();
    setSelectedActor(actor);
  }

  function onWriterSelected(writer: string) {
    reset();
    setSelectedWriter(writer);
  }

  function onGenreSelected(genre: string) {
    reset();
    setSelectedGenre(genre);
  }

  // Async function to fetch Search Movies from API
  const searchMovies = useCallback(async (page: number = 1) => {
    if (page >= 1) {
      setCurrentPage(page);
    }

    router.push(`/movies?page=${page}`, { scroll: false });

    try {
      setLoadingMovies(true);

      const response = await axios.get("http://localhost:8000/movies", {
        headers: {
          Accept: "application/json",
        },
        params: {
          page,
          size: 12,
          search_text: searchText !== "" ? searchText : undefined,
          search_year: selectedYear !== "" ? selectedYear : undefined,
          search_writer: selectedWriter !== "" ? selectedWriter : undefined,
          search_actor: selectedActor !== "" ? selectedActor : undefined,
          search_director: selectedDirector !== "" ? selectedDirector : undefined,
          search_genre: selectedGenre !== "" ? selectedGenre : undefined,
        },
      });

      setMovies(response.data.items as Movie[]);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMovies(false);
    }
  }, [
    searchText,
    selectedYear,
    selectedWriter,
    selectedActor,
    selectedDirector,
    selectedGenre,
    router,
  ]);

  // Async function to fetch Get Directors from API
  async function getDirectors() {
    try {
      // Send a Get resquest to the Get Directors endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/directors", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,
          size: 99,
        }
      });
      // Get the item array from the Get Directors responses and store it in state
      setDirectors(response.data.items as Director[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Get Actors from API
  async function getActors() {
    try {
      // Send a Get resquest to the Get Actors endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/actors", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,
          size: 99,
        }
      });
      // Get the item array from the Get Actors responses and store it in state
      setActors(response.data.items as Actor[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Get Writers from API
  async function getWriters() {
    try {
      // Send a Get request to the Get Writers endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/writers", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,
          size: 99,
        }
      });
      // Get the item array from the Get Writers responses and store it in state
      setWriters(response.data.items as Writer[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Get Genres from API
  async function getGenres() {
    try {
      // Send a Get request to the Get Genres endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/genres/movies", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,
          size: 99,
        }
      });
      // Get the item array from the Get Genres response and store it in state
      setGenres(response.data.items as Genre[]);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    searchMovies(pageFromUrl);
  }, [searchMovies, pageFromUrl]);

  // Triggers data fetching function on page load
  useEffect(() => {
    getActors();          // Fetch Get Actors
    getDirectors();       // Fetch Get Directors
    getWriters();         // Fetch Get Writers
    getGenres();          // Fetch Get Genres
  }, []);

  return (
    <div className="mx-auto overflow-x-hidden">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="m-5"
      >
        <h1 className="text-4xl font-bold">Movies</h1>
      </motion.div>

      <div className="border-3 border-orange-400 mx-40 my-10 p-3 rounded-xl">
        <div className="justify-self-center flex gap-8">
          <div className="w-40 h-40">
            <img src="/camera.png" alt="camera" />
          </div>
          <div className="flex flex-col gap-5">

            <div className="flex gap-12">
              <div className="flex gap-3">
                <Label htmlFor="select-year">Year</Label>
                <NativeSelect id="select-year" className="bg-orange-400"
                  value={selectedYear}
                  onChange={e => onYearSelected(e.target.value)}>
                  <NativeSelectOption value="">Select year</NativeSelectOption>
                  {Array.from({ length: new Date().getFullYear() - 1930 + 1 }, (_, index) => 1930 + index).reverse().map(year => (
                    <NativeSelectOption key={year} value={year}>{year}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex gap-3">
                <Label htmlFor="select-writer">Writer</Label>
                <NativeSelect id="select-writer" className="bg-orange-400"
                  value={selectedWriter}
                  onChange={e => onWriterSelected(e.target.value)}>
                  <NativeSelectOption value="">Select writer</NativeSelectOption>
                  {writers.map(writer => (
                    <NativeSelectOption key={writer.writerId} value={writer.writerName}>{writer.writerName}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex gap-3">
                <Label htmlFor="select-actor">Actor</Label>
                <NativeSelect id="select-actor" className="bg-orange-400"
                  value={selectedActor}
                  onChange={e => onActorSelected(e.target.value)}>
                  <NativeSelectOption value="">Select actor</NativeSelectOption>
                  {actors.map(actor => (
                    <NativeSelectOption key={actor.actorId} value={actor.actorName}>{actor.actorName}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex gap-3">
                <Label htmlFor="select-director">Director</Label>
                <NativeSelect id="select-director" className="bg-orange-400"
                  value={selectedDirector}
                  onChange={e => onDirectorSelected(e.target.value)}>
                  <NativeSelectOption value="">Select director</NativeSelectOption>
                  {directors.map(director => (
                    <NativeSelectOption key={director.directorId} value={director.directorName}>{director.directorName}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <InputGroup className="border-2 border-orange-400 w-200 rounded-md">
              <InputGroupInput className="" type="search" placeholder="Search"
                onChange={e => onSearchTextChange(e.target.value)} />
              <InputGroupAddon align="inline-end">
                <SearchIcon color="#E5831A" />
              </InputGroupAddon>
            </InputGroup>

            <div className="relative py-1">
              <Carousel
                opts={{
                  align: "start",
                  dragFree: true,
                  loop: true,
                }}
                className="w-full max-w-[54rem] overflow-visible"
              >
                <div className="mx-8 overflow-hidden">
                  <CarouselContent className="pl-1 pr-6">
                    <CarouselItem className="basis-[135px]">
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Badge
                          className={cn(
                            "flex w-full justify-center cursor-pointer border-orange-400 px-3 py-1.5 text-sm bg-transparent text-gray-800 hover:bg-orange-400 hover:text-white whitespace-nowrap transition-all duration-200",
                            selectedGenre === "" && "bg-orange-400 text-white"
                          )}
                          onClick={() => onGenreSelected("")}
                        >
                          All
                        </Badge>
                      </motion.div>
                    </CarouselItem>

                    {genres.map((genre, index) => (
                      <CarouselItem
                        key={genre.genreId}
                        className="basis-[135px]"
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.02 }}
                        >
                          <Badge
                            className={cn(
                              "flex w-full justify-center cursor-pointer border-orange-400 px-3 py-1.5 text-sm bg-transparent text-gray-800 hover:bg-orange-400 hover:text-white whitespace-nowrap transition-all duration-200",
                              selectedGenre === genre.genreName && "bg-orange-400 text-white"
                            )}
                            onClick={() => onGenreSelected(genre.genreName)}
                          >
                            {genre.genreName}
                          </Badge>
                        </motion.div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </div>

                <CarouselPrevious className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-primary/90" />
                <CarouselNext className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-primary/90" />
              </Carousel>
            </div>
          </div>
        </div>

      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        {loadingMovies ? (
          Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={`movie-skeleton-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <Card className="w-90 mt-3 justify-self-center bg-orange-200 border-orange-400 border-1 pt-0 overflow-hidden">
                <div className="aspect-[2/3] w-full bg-orange-300 animate-pulse" />
                <CardHeader>
                  <div className="space-y-2">
                    <div className="h-5 w-3/4 rounded bg-orange-300 animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-orange-300 animate-pulse" />
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))
        ) : movies.length === 0 ? (
          <div className="col-span-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-12 text-center text-gray-500 text-lg font-medium"
            >
              No movies matched your search.
            </motion.div>
          </div>
        ) : (
          movies.map((movie, index) => (
            <motion.div
              key={movie.movieId}
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.03 }}
            >
              <div className="relative transition-transform duration-200 hover:scale-[1.03] hover:z-10">
                <Card className="w-90 mt-3 justify-self-center bg-orange-200 border-orange-400 border-1 pt-0 overflow-hidden transition-all duration-200 hover:border-orange-500 hover:shadow-md">
                  <Link href={"/movies/" + movie.movieId} className="h-full w-full">
                    <div className="aspect-[2/3] w-full overflow-hidden bg-orange-300">
                      <img
                        src={movie.cover}
                        alt={movie.movieName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle>
                      <Link href={"/movies/" + movie.movieId}>{movie.movieName}</Link>
                    </CardTitle>
                    <CardDescription className="flex">
                      <div className="mr-9">{movie.year}</div>
                      <div className="mr-9">{movie.length}</div>
                      <Star className="mr-1" fill="#F3B413" color="#F3B413" />
                      <div className="font-bold">{movie.movieRating}</div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <Pagination className="mt-15 mb-10">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={currentPage <= 1}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  searchMovies(currentPage - 1);
                }
              }}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  searchMovies(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={currentPage >= totalPages}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  searchMovies(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  )
}
