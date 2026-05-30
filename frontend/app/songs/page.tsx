"use client"

import Navbar from "@/app/navbar";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SearchIcon, Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";


// Define TypeScript type for Search Songs object returned by API
type Song = {
  songId: number;
  songName: string;
  year: number;
  length: string;
  cover: string;
  songRating: number;
  songRatingCount: number;
}

// Define TypeScript type for Search Songs Page object returned by API
/*type SongPage = {
  items: Song[];
  total: number;
  page: number;
  size: number;
  pages: number;
}*/

// Define TypeScript type for Get Artists object returned by API
type Artist = {
  artistId: number;
  artistName: string;
}

// Define TypeScript type for Get Artists Page object returned by API
/*type ArtistPage = {
  items: Artist[];
  total: number;
  page: number;
  size: number;
  pages: number;
}*/

// Define TypeScript type for Get Genres object returned by API
type Genre = {
  genreId: number;
  genreName: string;
}

// Define TypeScript type for Get Genres Page object returned by API
/*type GenrePage = {
  items: Genre[];
  total: number;
  page: number;
  size: number;
  pages: number;
}*/

// Export the default page component rendered at the /songs route
export default function Page() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page") ?? "1");

  // State to hold the selected year
  const [selectedYear, setSelectedYear] = useState<string>("");

  // State to hold the current page
  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);

  // State to hold the total pages
  const [totalPages, setTotalPages] = useState<number>(1);

  // State to hold the search text
  const [searchText, setSearchText] = useState<string>("");

  // State to hold the fetched Search Songs
  const [songs, setSongs] = useState<Song[]>([]);

  // State to hold the fetched Get Artists
  const [artists, setArtists] = useState<Artist[]>([]);

  // State to hold the selected artist
  const [selectedArtist, setSelectedArtist] = useState<string>("");

  // State to hold the fetched Get Genres
  const [genres, setGenres] = useState<Genre[]>([]);

  // State to hold the selected genre
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  // State to track loading while fetching songs
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Reset search options
  function reset() {
    setCurrentPage(1);
    setTotalPages(1);
    setSearchText("");
    setSelectedYear("");
    setSelectedArtist("");
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

  function onArtistSelected(artist: string) {
    reset();
    setSelectedArtist(artist);
  }

  function onGenreSelected(genre: string) {
    reset();
    setSelectedGenre(genre);
  }

  const searchSongs = useCallback(async (page: number = 1) => {
    if (page >= 1) {
      setCurrentPage(page);
    }

    router.push(`/songs?page=${page}`, { scroll: false });

    try {
      setLoadingSongs(true);

      const response = await axios.get("http://localhost:8000/songs", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: page,
          size: 12,
          search_text: searchText !== "" ? searchText : undefined,
          search_year: selectedYear !== "" ? selectedYear : undefined,
          search_artist: selectedArtist !== "" ? selectedArtist : undefined,
          search_genre: selectedGenre !== "" ? selectedGenre : undefined,
        }
      });

      setSongs(response.data.items as Song[]);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSongs(false);
    }
  }, [searchText, selectedYear, selectedArtist, selectedGenre, router]);

  useEffect(() => {
    searchSongs(pageFromUrl);
  }, [searchSongs, pageFromUrl]);

  // Async function to fetch Get Artists from API
  async function getArtists() {
    try {
      // Send a Get resquest to the Get Artists endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/artists", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,
          size: 99,
        }
      });
      // Get the item array from the Get Actors responses and store it in state
      setArtists(response.data.items as Artist[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Get Genres from API
  async function getGenres() {
    try {
      // Send a Get request to the Get Genres endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/genres/songs", {
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

  // Triggers data fetching function on page load
  useEffect(() => {
    getArtists();        // Fetch Get Artists
    getGenres();         // Fetch Get Genres
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
        <h1 className="text-4xl font-bold">Songs</h1>
      </motion.div>

      <div className="border-3 border-orange-400 mx-40 my-10 p-3 rounded-xl">
        <div className="justify-self-center flex gap-8">
          <div className="w-40 h-40">
            <img src="/radio.png" alt="radio" />
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
                <Label htmlFor="select-artist">Artist</Label>
                <NativeSelect id="select-artist" className="bg-orange-400"
                  value={selectedArtist}
                  onChange={e => onArtistSelected(e.target.value)}>
                  <NativeSelectOption value="">Select artist</NativeSelectOption>
                  {artists.map(artist => (
                    <NativeSelectOption key={artist.artistId} value={artist.artistName}>
                      {artist.artistName}
                    </NativeSelectOption>
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
                      <CarouselItem key={genre.genreId} className="basis-[135px]">
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
        {loadingSongs ? (
          Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={`song-skeleton-${index}`}
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
        ) : songs.length === 0 ? (
          <div className="col-span-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-12 text-center text-gray-500 text-lg font-medium"
            >
              No songs matched your search.
            </motion.div>
          </div>
        ) : (
          songs.map((song, index) => (
            <motion.div
              key={song.songId}
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.03 }}
            >
              <div className="relative transition-transform duration-200 hover:scale-[1.03] hover:z-10">
                <Card className="w-90 mt-3 justify-self-center bg-orange-200 border-orange-400 border-1 pt-0 overflow-hidden transition-all duration-200 hover:border-orange-500 hover:shadow-md">
                  <Link href={"/songs/" + song.songId} className="h-full w-full">
                    <div className="aspect-[2/3] w-full overflow-hidden bg-orange-300">
                      <img
                        src={song.cover}
                        alt={song.songName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle>
                      <Link href={"/songs/" + song.songId}>{song.songName}</Link>
                    </CardTitle>
                    <CardDescription className="flex">
                      <div className="mr-9">{song.year}</div>
                      <div className="mr-9">{song.length}</div>
                      <Star className="mr-1" fill="#F3B413" color="#F3B413" />
                      <div className="font-bold">{song.songRating}</div>
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
                  searchSongs(currentPage - 1);
                }
              }}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  searchSongs(page);
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
                  searchSongs(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}