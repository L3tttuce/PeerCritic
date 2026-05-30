"use client";

import { Icon, Menu, User } from "lucide-react";

import { Accordion, } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/app/apiClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

const menu = [
  {
    title: "Home",
    url: "/"
  },
  {
    title: "Movies",
    url: "/movies"
  },
  {
    title: "TV shows",
    url: "/tvshows"
  },
  {
    title: "Music",
    url: "/songs"
  },
  {
    title: "Discussion",
    url: "/discussions"
  }
]

interface User {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

// Define TypeScript type for Search Movies object returned by API
type Movie = {
  movieId: number;
  movieName: string;
  year: number;
  length: string;
  cover: string;
  movieRating: number;
  movieRatingCount: number;
}

// Define TypeScript type for Search Shows object returned by API
type Show = {
  movieId: number;
  movieName: string;
  year: number;
  length: string;
  cover: string;
  movieRating: number;
  movieRatingCount: number;
}

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

export default function Navbar() {
  // State to hold the search open
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // State to hold the search text
  const [searchText, setSearchText] = useState<string>("");

  // State to hold the fetched Search Movies 
  const [movies, setMovies] = useState<Movie[]>([]);

  // State to hold the fetched Search Shows
  const [shows, setShows] = useState<Show[]>([]);

  // State to hold the fetched Search Songs
  const [songs, setSongs] = useState<Song[]>([]);

  // State to hold the user
  const [user, setUser] = useState<User | null>(null);

  // States to preserve the user's previous page
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  useEffect(() => {
    fetchUser();
  }, []);
  // Get current logged in information
  async function fetchUser() {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token && !refreshToken) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/current_user");
      setUser(response.data);
    } catch (error: any) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      console.error(error);
    }
  }

  // check if user is logged in (local storage will store access token)
  function isUserLoggedIn() {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken != null && accessToken != "") {
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  useEffect(() => {
    if (searchText.length > 0) {
      searchMovies();
      searchShows();
      searchSongs();
    }
  }, [searchText]);

  // Async function to fetch Search Movies from API
  async function searchMovies() {
    try {
      // Send a GET resquest to the search movies endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/movies", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,      // Request the first page of result
          size: 8,     // Limit results to 8 search movies
          search_text: searchText !== "" ? searchText : undefined
        }
      });
      // Get the item array from the Search Movies responses and store it in state
      setMovies(response.data.items as Movie[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Search Shows from API
  async function searchShows() {
    try {
      // Send a GET resquest to the search shows endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/shows", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,      // Request the first page of result
          size: 8,     // Limit results to 8 search shows
          search_text: searchText !== "" ? searchText : undefined,
        }
      });
      // Get the item array from the Search Shows responses and store it in state
      setShows(response.data.items as Show[]);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to fetch Search Songs from API
  async function searchSongs() {
    try {
      // Send a GET resquest to the search songs endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/songs", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,      // Request the first page of result
          size: 8,     // Limit results to 8 search songs
          search_text: searchText !== "" ? searchText : undefined,
        }
      });
      // Get the item array from the Search Songs responses and store it in state
      setSongs(response.data.items as Song[]);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section>
      <div className="mx-auto">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between lg:flex bg-orange-500 p-2">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter text-white">
                PeerCritic
              </span>
            </a>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList className="bg-orange-400 rounded-lg">
                  {menu.map((item) => (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuLink
                        href={item.url}
                        className="bg-background hover:bg-orange-200 hover:text-accent-foreground group 
                                   inline-flex h-10 w-max items-center justify-center rounded-md px-4 
                                   py-2 text-sm font-medium transition-colors bg-orange-400 text-white">
                        {item.title}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <Popover open={searchText.length > 0}>
              <PopoverTrigger asChild>
                <Input className="bg-orange-800 text-white !placeholder-white w-100 rounded-full"
                  type="search"
                  placeholder="Search" value={searchText} onChange={e => setSearchText(e.target.value)} />
              </PopoverTrigger>
              <PopoverContent className="w-100 max-h-150 overflow-y-auto"
                onOpenAutoFocus={(e) => e.preventDefault()}>
                {movies.map(movie => (
                  <Item key={movie.movieId}>

                    <ItemMedia variant="icon">
                      <img src={movie.cover} alt={movie.movieName} />
                    </ItemMedia>
                    <ItemContent>
                      <Link href={"/movies/" + movie.movieId}>
                        <ItemTitle>{movie.movieName}</ItemTitle>
                        <ItemDescription>{movie.year}</ItemDescription>
                      </Link>
                    </ItemContent>
                  </Item>
                ))}

                {shows.map(show => (
                  <Item key={show.movieId}>

                    <ItemMedia variant="icon">
                      <img src={show.cover} alt={show.movieName} />
                    </ItemMedia>
                    <ItemContent>
                      <Link href={"/movies/" + show.movieId}>
                        <ItemTitle>{show.movieName}</ItemTitle>
                        <ItemDescription>{show.year}</ItemDescription>
                      </Link>
                    </ItemContent>
                  </Item>
                ))}

                {songs.map(song => (
                  <Item key={song.songId}>

                    <ItemMedia variant="icon">
                      <img src={song.cover} alt={song.songName} />
                    </ItemMedia>
                    <ItemContent>
                      <Link href={"/songs/" + song.songId}>
                        <ItemTitle>{song.songName}</ItemTitle>
                        <ItemDescription>{song.year}</ItemDescription>
                      </Link>
                    </ItemContent>
                  </Item>
                ))}
              </PopoverContent>
            </Popover>



          </div>

          {user != null
            ? (
              <div>
                <div className="flex items-center gap-3 text-lg font-semibold tracking-tighter">
                  {/*Messages button*/}
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="h-11 w-15 bg-orange-400 text-white border-orange-300 hover:bg-orange-300"
                  >
                    <Link href="/messages">
                      <MessageCircle className="size-5" />
                    </Link>
                  </Button>

                  {/*Profile Link*/}
                  <Link href="/profile" className="flex items-center gap-2 mr-5 text-black">
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-orange-200"
                      />
                    )}
                    Hello, {user.firstName} {user.lastName}
                  </Link>

                  {/*Logout*/}
                  <Button asChild size="sm">
                    <a href="/" onClick={logout}>LOGOUT</a>
                  </Button>
                </div>
              </div>
            )
            : (
              <div className="flex gap-2">
                <Button className="bg-orange-400 text-white" asChild variant="outline" size="sm">
                  <Link href={`/login?next=${encodeURIComponent(currentUrl)}`}>
                    LOGIN
                  </Link>
                </Button>
                <Button className="bg-orange-800 text-white" asChild size="sm">
                  <Link href={`/signup?next=${encodeURIComponent(currentUrl)}`}>
                    SIGNUP
                  </Link>
                </Button>
              </div>
            )}
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between text-2xl font-bold">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 ">
              PeerCritic
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href="/" className="flex items-center gap-2 font-bold">
                      PeerCritic
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => (
                      <a key={item.title} href={item.url} className="text-md font-semibold">
                        {item.title}
                      </a>
                    ))}
                  </Accordion>

                  {user != null
                    ? (
                      <div>
                        <div className="text-lg font-semibold tracking-tighter">
                          <a href="/profile" className="mr-5">
                            Hello, {user.firstName} {user.lastName}
                          </a>
                          <Button asChild size="sm">
                            <a href="/" onClick={logout}>LOGOUT</a>
                          </Button>
                        </div>
                      </div>
                    )
                    : (
                      <div className="flex flex-col gap-3">
                        <Button asChild variant="outline">
                          <Link href={`/login?next=${encodeURIComponent(currentUrl)}`}>
                            LOGIN
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href={`/signup?next=${encodeURIComponent(currentUrl)}`}>
                            SIGNUP
                          </Link>
                        </Button>
                      </div>
                    )
                  }


                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};