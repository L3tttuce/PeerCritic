"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/app/apiClient";
import type { FilterKind, Genre, Media, PaginatedResponse } from "@/lib/types/media";

type PersonOption = {
  id: number;
  name: string;
};

export type MediaListConfig = {
  apiPath: string;
  routePath: string;
  filters: FilterKind[];
  genreApiPath: string;
};

export function useMediaList(config: MediaListConfig) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageFromUrl = Number(searchParams.get("page") ?? "1");

  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDirector, setSelectedDirector] = useState<string>("");
  const [selectedActor, setSelectedActor] = useState<string>("");
  const [selectedWriter, setSelectedWriter] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [items, setItems] = useState<Media[]>([]);
  const [directors, setDirectors] = useState<PersonOption[]>([]);
  const [actors, setActors] = useState<PersonOption[]>([]);
  const [writers, setWriters] = useState<PersonOption[]>([]);
  const [artists, setArtists] = useState<PersonOption[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPage(1);
    setTotalPages(1);
    setSearchText("");
    setSelectedYear("");
    setSelectedDirector("");
    setSelectedActor("");
    setSelectedWriter("");
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

  function onArtistSelected(artist: string) {
    reset();
    setSelectedArtist(artist);
  }

  function onGenreSelected(genre: string) {
    reset();
    setSelectedGenre(genre);
  }

  const searchMedia = useCallback(
    async (page: number = 1) => {
      if (page >= 1) {
        setCurrentPage(page);
      }

      router.push(`${config.routePath}?page=${page}`, { scroll: false });

      try {
        setLoading(true);

        const response = await api.get<PaginatedResponse<Media>>(config.apiPath, {
          headers: { Accept: "application/json" },
          params: {
            page,
            size: 12,
            search_text: searchText !== "" ? searchText : undefined,
            search_year: selectedYear !== "" ? selectedYear : undefined,
            search_writer: selectedWriter !== "" ? selectedWriter : undefined,
            search_actor: selectedActor !== "" ? selectedActor : undefined,
            search_director: selectedDirector !== "" ? selectedDirector : undefined,
            search_artist: selectedArtist !== "" ? selectedArtist : undefined,
            search_genre: selectedGenre !== "" ? selectedGenre : undefined,
          },
        });

        setItems(response.data.items);
        setTotalPages(response.data.pages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [
      config.apiPath,
      config.routePath,
      searchText,
      selectedYear,
      selectedWriter,
      selectedActor,
      selectedDirector,
      selectedArtist,
      selectedGenre,
      router,
    ]
  );

  useEffect(() => {
    searchMedia(pageFromUrl);
  }, [searchMedia, pageFromUrl]);

  useEffect(() => {
    async function loadFilterOptions() {
      const requests: Promise<void>[] = [];

      if (config.filters.includes("director")) {
        requests.push(
          api
            .get<PaginatedResponse<{ directorId: number; directorName: string }>>("/directors", {
              params: { page: 1, size: 99 },
            })
            .then((res) =>
              setDirectors(
                res.data.items.map((d) => ({ id: d.directorId, name: d.directorName }))
              )
            )
            .catch(console.error)
        );
      }

      if (config.filters.includes("actor")) {
        requests.push(
          api
            .get<PaginatedResponse<{ actorId: number; actorName: string }>>("/actors", {
              params: { page: 1, size: 99 },
            })
            .then((res) =>
              setActors(res.data.items.map((a) => ({ id: a.actorId, name: a.actorName })))
            )
            .catch(console.error)
        );
      }

      if (config.filters.includes("writer")) {
        requests.push(
          api
            .get<PaginatedResponse<{ writerId: number; writerName: string }>>("/writers", {
              params: { page: 1, size: 99 },
            })
            .then((res) =>
              setWriters(res.data.items.map((w) => ({ id: w.writerId, name: w.writerName })))
            )
            .catch(console.error)
        );
      }

      if (config.filters.includes("artist")) {
        requests.push(
          api
            .get<PaginatedResponse<{ artistId: number; artistName: string }>>("/artists", {
              params: { page: 1, size: 99 },
            })
            .then((res) =>
              setArtists(res.data.items.map((a) => ({ id: a.artistId, name: a.artistName })))
            )
            .catch(console.error)
        );
      }

      if (config.filters.includes("genre")) {
        requests.push(
          api
            .get<PaginatedResponse<Genre>>(config.genreApiPath, {
              params: { page: 1, size: 99 },
            })
            .then((res) => setGenres(res.data.items))
            .catch(console.error)
        );
      }

      await Promise.all(requests);
    }

    void loadFilterOptions();
  }, [config.filters, config.genreApiPath]);

  return {
    items,
    loading,
    currentPage,
    totalPages,
    searchText,
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
    filters: config.filters,
  };
}
