"use client"

import Navbar from "@/app/navbar";
import { useParams, usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import FriendReviews from "@/app/viewfriendreviews/friendReviews";
import MediaReviews from "@/app/viewreviews/mediaReviews";
import ReviewForm from "@/app/reviewform/reviewForm";
import api from "@/app/apiClient";
import { Input } from "@/components/ui/input";

type MyReview = {
  reviewId: number;
  review: string | null;
  reviewRating: number;
  reviewRatingCount: number | null;
  kind: "movie" | "song" | "tv";
  title: string;
  cover: string | null;
  movieId: number | null;
  songId: number | null;
};

// Define the TypeScript type for an Artist object returned by API
type Artist = {
  artistId: number;
  artistName: string;
}

// Define the TypeScript type for a Song object returned by API
type Song = {
  songId: number;
  songName: string;
  year: number;
  length: string;
  cover: string;
  video: string;
  songRating: number;
  songRatingCount: number;
  artists: string[] | Artist[];
  genres: string[];
  reviews: string[];
}

type Friend = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
};

// Export the default page component rendered at the /songs/[id] route
export default function Page() {
  const params = useParams();         // Get URL parameters

  const router = useRouter();

  const pathname = usePathname();

  const [myReview, setMyReview] = useState<MyReview | null>(null);

  // State variable to hold the fetched song details
  const [song, setSong] = useState<Song>();

  // State variable to hold the list of similar songs
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);

  const songId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

  useEffect(() => {
    if (!songId) return;

    let isCancelled = false;

    async function loadSongPage() {
      try {
        const [songResponse, similarResponse, myReviewsResponse] = await Promise.all([
          axios.get(`http://localhost:8000/songs/${songId}`, {
            headers: {
              Accept: "application/json",
            },
          }),
          axios.get(`http://localhost:8000/songs/${songId}/similar`, {
            headers: {
              Accept: "application/json",
            },
            params: {
              page: 1,
              size: 20,
            },
          }),
          api.get("/my/reviews").catch(() => ({ data: [] })),
        ]);

        if (isCancelled) return;

        setSong(songResponse.data);
        setSimilarSongs(similarResponse?.data?.items ?? []);
        const reviews = myReviewsResponse.data as MyReview[];

        const matchingReview = reviews.find((review) => {
          return review.songId === Number(songId);
        });

        setMyReview(matchingReview ?? null);
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
        }
      }
    }

    void loadSongPage();

    return () => {
      isCancelled = true;
    };
  }, [songId]);

  function handleReviewClick() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsReviewFormOpen(true);
  }

  async function openShareModal() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(`/songs/${songId}`)}`;
      return;
    }

    try {
      const response = await api.get("/my/friends");
      setFriends(response.data ?? []);
      setShareOpen(true);
    } catch (error) {
      console.error(error);
      alert("Could not load friends.");
    }
  }

  async function shareSongToFriend(friendId: number) {
    if (!song) return;

    try {
      const dmResponse = await api.post(`/messages/dm/${friendId}`, {});
      const conversationId = dmResponse.data.conversationId;

      await api.post(`/messages/conversations/${conversationId}/messages`, {
        messageText: "Shared media",
        messageType: "media_share",
        sharedMovieId: null,
        sharedSongId: song.songId,
      });

      setShareOpen(false);
      setFriendQuery("");
      setShareSuccess("Media sent!");

      setTimeout(() => setShareSuccess(""), 2500);
    } catch (error) {
      console.error(error);
      alert("Could not share media.");
    }
  }

  // Render the Song detail page UI
  return (
    // Outer container
    <div className="mx-auto pb-20">
      {/* Render the navigation bar at the top of the page*/}
      <Navbar />
      <div>
        {/* Only show content when song data is loaded */}
        {song !== undefined && (
          <>
            <div className="mt-6 flex w-full gap-8 px-8">
              {/* Left column for poster, genres and information of a song */}
              <div className="grow-1">
                <div className="flex flex-col items-center">
                  {/* song poster */}
                  <img src={song.cover} alt={song.songName} width={300} height={500} className="rounded-md object-cover" />
                  {/* genre badges */}
                  <div className="mt-2">
                    {song.genres.map((genre, index) => (
                      <Badge key={index} className="mr-1 rounded-sm">{genre}</Badge>
                    ))}
                  </div>

                  {/* Song information card */}
                  <div className="bg-orange-300 w-90 border-orange-400 border-3 rounded-lg mt-2 p-3">
                    <div>
                      <strong>Artist: </strong>
                      {song.artists.map((artist, index) => (
                        <span key={index}>{typeof artist === "string" ? artist : artist.artistName}</span>
                      ))}
                    </div>
                    <div>
                      <strong>Release Year: </strong>
                      {song.year}
                    </div>
                    <div>
                      <strong>Runtime: </strong>
                      {song.length}
                    </div>
                  </div>
                </div>

                {/*Friend's Ratings*/}
                <FriendReviews
                  mediaType="song"
                  mediaId={song.songId}
                />
              </div>

              {/* Center column for title, rating and action buttons of a song */}
              <div className="grow-1">
                {/* Song title */}
                <h1 className="text-4xl font-bold justify-self-center">{song.songName}</h1>
                {/* Rating display */}
                <div className="mt-5 flex items-center justify-center">
                  <Star className="mr-5" fill="#F3B413" color="#F3B413" size={100} />
                  <div className="text-7xl font-bold text-blue-700">{song.songRating}</div>
                </div>

                {/* User rating */}
                <div className="flex font-bold text-xl justify-self-center border-orange-300 border-3 p-2 rounded-lg mt-8">
                  {!isLoggedIn ? (
                    <div className="text-muted-foreground">
                      Log in to view your rating
                    </div>
                  ) : myReview ? (
                    <>
                      You Rated:&nbsp;
                      <div className="font-bold text-blue-700">
                        {myReview.reviewRating.toFixed(1)}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      You haven&apos;t rated this yet
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-8 flex justify-center gap-5">
                  <Button className="bg-orange-400" onClick={handleReviewClick}>
                    REVIEW
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={openShareModal}
                    className="h-10 w-10 rounded-full border border-orange-200 bg-orange-100 text-gray-700 hover:bg-orange-200"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* listen button */}
                <div className="mt-8 justify-self-center flex flex-col justify-center">
                  <Button
                    variant="ghost"
                    className="text-xl font-bold bg-orange-200 text-grey-500 p-7 rounded-t-xl rounded-b-none border-3 border-orange-300"
                  >
                    Listen on Spotify
                  </Button>
                  <iframe
                    width="560"
                    height="315"
                    src={song.video}
                    title={song.songName}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                {/* Reviews section */}
                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-xl">
                    <MediaReviews
                      mediaType="song"
                      mediaId={song.songId}
                    />
                  </div>
                </div>
              </div>

              {/* Right column for similar songs */}
              <div className="grow-1 overflow-x-clip">
                <div className="text-lg font-bold justify-self-center mt-5">Similar Songs</div>

                <div className="mt-2 h-[740px] space-y-2 overflow-y-auto pr-2 snap-y snap-mandatory scroll-smooth">
                  {similarSongs.map((similarSong) => (
                    <div
                      key={similarSong.songId}
                      className="relative h-[140px] snap-start snap-always origin-right transition-transform duration-200 hover:-translate-x-2 hover:z-10"
                    >
                      <Link href={"/songs/" + similarSong.songId} className="block h-full">
                        <Card className="h-full w-90 justify-self-center border border-orange-400 bg-orange-200 shadow-sm transition-all duration-200 hover:border-orange-500 hover:shadow-lg">
                          <CardHeader>
                            <CardTitle className="line-clamp-1 transition-colors hover:text-orange-700">
                              {similarSong.songName}
                            </CardTitle>

                            <CardDescription className="flex items-center gap-3 flex-wrap">
                              <div className="max-w-[140px] truncate">
                                {similarSong.artists.map((artist, index) => (
                                  <span key={index}>
                                    {index > 0 ? ", " : ""}
                                    {typeof artist === "string" ? artist : artist.artistName}
                                  </span>
                                ))}
                              </div>

                              <div>{similarSong.year}</div>

                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4" fill="#F3B413" color="#F3B413" />
                                <div className="font-bold">{similarSong.songRating}</div>
                              </div>
                            </CardDescription>

                            <CardAction>
                              <img
                                src={similarSong.cover}
                                alt={similarSong.songName}
                                width="60"
                                height="40"
                                className="rounded-md border border-orange-300 object-cover"
                              />
                            </CardAction>
                          </CardHeader>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <ReviewForm
              mediaType="song"
              mediaId={song.songId}
              mediaTitle={song.songName}
              open={isReviewFormOpen}
              onClose={() => setIsReviewFormOpen(false)}
              onSuccess={() => window.location.reload()}
            />
            {shareOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                onClick={() => setShareOpen(false)}
              >
                <div
                  className="w-full max-w-md rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold text-gray-900">Share with a friend</h2>

                  <Input
                    className="mt-3 border-orange-200 bg-orange-100"
                    placeholder="Search friends..."
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                  />

                  <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                    {friends
                      .filter((f) => {
                        const q = friendQuery.trim().toLowerCase();
                        if (!q) return true;

                        return `${f.firstName} ${f.lastName} ${f.username}`
                          .toLowerCase()
                          .includes(q);
                      })
                      .map((f) => (
                        <button
                          key={f.userId}
                          type="button"
                          onClick={() => shareSongToFriend(f.userId)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-orange-100"
                        >
                          <div className="h-9 w-9 overflow-hidden rounded-full border border-orange-200 bg-orange-100">
                            {f.avatar ? (
                              <img
                                src={f.avatar}
                                alt={f.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                                ?
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">
                              {`${f.firstName} ${f.lastName}`.trim() || f.username}
                            </div>
                            <div className="truncate text-xs text-gray-600">@{f.username}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {shareSuccess && (
              <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-base font-semibold text-green-700 shadow-lg">
                {shareSuccess}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}