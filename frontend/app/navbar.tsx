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
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import api from "@/app/apiClient";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  MEDIA_CONFIG,
  type Media,
  type PaginatedResponse,
} from "@/lib/types/media";
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

function NavbarContent() {
  // State to hold the search open
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // State to hold the search text
  const [searchText, setSearchText] = useState<string>("");

  const [movies, setMovies] = useState<Media[]>([]);
  const [shows, setShows] = useState<Media[]>([]);
  const [songs, setSongs] = useState<Media[]>([]);

  const { user, logout: authLogout } = useAuth();

  // States to preserve the user's previous page
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  function logout() {
    authLogout();
  }

  useEffect(() => {
    if (searchText.length === 0) {
      setMovies([]);
      setShows([]);
      setSongs([]);
      return;
    }

    const timer = setTimeout(() => {
      void Promise.all([searchMovies(), searchShows(), searchSongs()]);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchText]);

  async function searchMedia(endpoint: string, setter: (items: Media[]) => void) {
    try {
      const response = await api.get<PaginatedResponse<Media>>(endpoint, {
        headers: { Accept: "application/json" },
        params: {
          page: 1,
          size: 8,
          search_text: searchText !== "" ? searchText : undefined,
        },
      });
      setter(response.data.items);
    } catch (error) {
      console.error(error);
    }
  }

  async function searchMovies() {
    await searchMedia(MEDIA_CONFIG.movie.api, setMovies);
  }

  async function searchShows() {
    await searchMedia(MEDIA_CONFIG.tv.api, setShows);
  }

  async function searchSongs() {
    await searchMedia(MEDIA_CONFIG.song.api, setSongs);
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
                {movies.map((movie) => (
                  <Item key={movie.id}>
                    <ItemMedia variant="icon">
                      {movie.cover ? (
                        <Image src={movie.cover} alt={movie.title} width={40} height={40} className="object-cover" />
                      ) : null}
                    </ItemMedia>
                    <ItemContent>
                      <Link href={`${MEDIA_CONFIG.movie.route}/${movie.id}`}>
                        <ItemTitle>{movie.title}</ItemTitle>
                        <ItemDescription>{movie.year}</ItemDescription>
                      </Link>
                    </ItemContent>
                  </Item>
                ))}

                {shows.map((show) => (
                  <Item key={show.id}>
                    <ItemMedia variant="icon">
                      {show.cover ? (
                        <Image src={show.cover} alt={show.title} width={40} height={40} className="object-cover" />
                      ) : null}
                    </ItemMedia>
                    <ItemContent>
                      <Link href={`${MEDIA_CONFIG.tv.route}/${show.id}`}>
                        <ItemTitle>{show.title}</ItemTitle>
                        <ItemDescription>{show.year}</ItemDescription>
                      </Link>
                    </ItemContent>
                  </Item>
                ))}

                {songs.map((song) => (
                  <Item key={song.id}>
                    <ItemMedia variant="icon">
                      {song.cover ? (
                        <Image src={song.cover} alt={song.title} width={40} height={40} className="object-cover" />
                      ) : null}
                    </ItemMedia>
                    <ItemContent>
                      <Link href={`${MEDIA_CONFIG.song.route}/${song.id}`}>
                        <ItemTitle>{song.title}</ItemTitle>
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
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}