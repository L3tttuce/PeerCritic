"use client";

import Navbar from "@/app/navbar";
import { useMediaList, type MediaListConfig } from "@/lib/useMediaList";
import { getVisiblePages } from "@/lib/pagination";
import Image from "next/image";
import { memo, Suspense, useMemo } from "react";
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
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1930 + 1 },
  (_, index) => 1930 + index
).reverse();

type MediaListPageProps = {
  title: string;
  routePath: string;
  emptyMessage: string;
  headerIcon: { src: string; alt: string };
  listConfig: MediaListConfig;
};

const MediaGridCard = memo(function MediaGridCard({
  item,
  routePath,
}: {
  item: { id: number; title: string; cover?: string | null; year?: number | null; length?: string | null; rating?: number | null };
  routePath: string;
}) {
  return (
    <div className="relative transition-transform duration-200 hover:scale-[1.03] hover:z-10">
      <Card className="w-90 mt-3 justify-self-center bg-orange-200 border-orange-400 border-1 pt-0 overflow-hidden transition-all duration-200 hover:border-orange-500 hover:shadow-md">
        <Link href={`${routePath}/${item.id}`} className="h-full w-full">
          <div className="aspect-[2/3] w-full overflow-hidden bg-orange-300">
            {item.cover ? (
              <Image
                src={item.cover}
                alt={item.title}
                width={360}
                height={540}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </Link>
        <CardHeader>
          <CardTitle>
            <Link href={`${routePath}/${item.id}`}>{item.title}</Link>
          </CardTitle>
          <CardDescription className="flex">
            <div className="mr-9">{item.year}</div>
            <div className="mr-9">{item.length}</div>
            <Star className="mr-1" fill="#F3B413" color="#F3B413" />
            <div className="font-bold">{item.rating}</div>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
});

function MediaListPageContent({
  title,
  routePath,
  emptyMessage,
  headerIcon,
  listConfig,
}: MediaListPageProps) {
  const {
    items,
    loading,
    currentPage,
    totalPages,
    selectedYear,
    selectedDirector,
    selectedActor,
    selectedWriter,
    selectedArtist,
    selectedGenre,
    directors,
    actors,
    writers,
    artists,
    genres,
    searchMedia,
    onSearchTextChange,
    onYearSelected,
    onDirectorSelected,
    onActorSelected,
    onWriterSelected,
    onArtistSelected,
    onGenreSelected,
    filters,
  } = useMediaList(listConfig);

  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );

  return (
    <div className="mx-auto overflow-x-hidden">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="m-5"
      >
        <h1 className="text-4xl font-bold">{title}</h1>
      </motion.div>

      <div className="border-3 border-orange-400 mx-40 my-10 p-3 rounded-xl">
        <div className="justify-self-center flex gap-8">
          <div className="w-40 h-40">
            <img src={headerIcon.src} alt={headerIcon.alt} />
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex gap-12">
              {filters.includes("year") && (
                <div className="flex gap-3">
                  <Label htmlFor="select-year">Year</Label>
                  <NativeSelect
                    id="select-year"
                    className="bg-orange-400"
                    value={selectedYear}
                    onChange={(e) => onYearSelected(e.target.value)}
                  >
                    <NativeSelectOption value="">Select year</NativeSelectOption>
                    {YEAR_OPTIONS.map((year) => (
                        <NativeSelectOption key={year} value={year}>
                          {year}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </div>
              )}

              {filters.includes("writer") && (
                <div className="flex gap-3">
                  <Label htmlFor="select-writer">Writer</Label>
                  <NativeSelect
                    id="select-writer"
                    className="bg-orange-400"
                    value={selectedWriter}
                    onChange={(e) => onWriterSelected(e.target.value)}
                  >
                    <NativeSelectOption value="">Select writer</NativeSelectOption>
                    {writers.map((writer) => (
                      <NativeSelectOption key={writer.id} value={writer.name}>
                        {writer.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {filters.includes("actor") && (
                <div className="flex gap-3">
                  <Label htmlFor="select-actor">Actor</Label>
                  <NativeSelect
                    id="select-actor"
                    className="bg-orange-400"
                    value={selectedActor}
                    onChange={(e) => onActorSelected(e.target.value)}
                  >
                    <NativeSelectOption value="">Select actor</NativeSelectOption>
                    {actors.map((actor) => (
                      <NativeSelectOption key={actor.id} value={actor.name}>
                        {actor.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {filters.includes("director") && (
                <div className="flex gap-3">
                  <Label htmlFor="select-director">Director</Label>
                  <NativeSelect
                    id="select-director"
                    className="bg-orange-400"
                    value={selectedDirector}
                    onChange={(e) => onDirectorSelected(e.target.value)}
                  >
                    <NativeSelectOption value="">Select director</NativeSelectOption>
                    {directors.map((director) => (
                      <NativeSelectOption key={director.id} value={director.name}>
                        {director.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {filters.includes("artist") && (
                <div className="flex gap-3">
                  <Label htmlFor="select-artist">Artist</Label>
                  <NativeSelect
                    id="select-artist"
                    className="bg-orange-400"
                    value={selectedArtist}
                    onChange={(e) => onArtistSelected(e.target.value)}
                  >
                    <NativeSelectOption value="">Select artist</NativeSelectOption>
                    {artists.map((artist) => (
                      <NativeSelectOption key={artist.id} value={artist.name}>
                        {artist.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </div>

            <InputGroup className="border-2 border-orange-400 w-200 rounded-md">
              <InputGroupInput
                type="search"
                placeholder="Search"
                onChange={(e) => onSearchTextChange(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <SearchIcon color="#E5831A" />
              </InputGroupAddon>
            </InputGroup>

            {filters.includes("genre") && (
              <div className="relative py-1">
                <Carousel
                  opts={{ align: "start", dragFree: true, loop: true }}
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
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
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
        ) : items.length === 0 ? (
          <div className="col-span-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-12 text-center text-gray-500 text-lg font-medium"
            >
              {emptyMessage}
            </motion.div>
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.03 }}
            >
              <MediaGridCard item={item} routePath={routePath} />
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
                  searchMedia(currentPage - 1);
                }
              }}
            />
          </PaginationItem>

          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <span className="px-2 text-muted-foreground">…</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    searchMedia(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={currentPage >= totalPages}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  searchMedia(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default function MediaListPage(props: MediaListPageProps) {
  return (
    <Suspense fallback={<div className="mx-auto p-8 text-center">Loading...</div>}>
      <MediaListPageContent {...props} />
    </Suspense>
  );
}
