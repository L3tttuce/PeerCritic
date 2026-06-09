"use client";

import Navbar from "@/app/navbar";
import { useParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import ReviewList from "@/components/media/ReviewList";
import { api } from "@/app/apiClient";
import { Input } from "@/components/ui/input";
const ReviewForm = dynamic(() => import("@/app/reviewform/reviewForm"), { ssr: false });
import { AnimatePresence, motion } from "framer-motion";
import type {
  Friend,
  Media,
  MediaDetail,
  MediaType,
  MyReview,
  PaginatedResponse,
  SongMedia,
} from "@/lib/types/media";
import { MEDIA_CONFIG } from "@/lib/types/media";

type MediaDetailPageProps = {
  mediaType: MediaType;
  apiPath: string;
  routePath: string;
  similarLabel: string;
  videoLabel: string;
  renderInfoCard: (media: MediaDetail | SongMedia) => ReactNode;
  renderSimilarMeta?: (item: Media | SongMedia) => ReactNode;
};

export default function MediaDetailPage({
  mediaType,
  apiPath,
  routePath,
  similarLabel,
  videoLabel,
  renderInfoCard,
  renderSimilarMeta,
}: MediaDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const reviewKind = MEDIA_CONFIG[mediaType].reviewKind;

  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  const [media, setMedia] = useState<MediaDetail | SongMedia>();
  const [similarItems, setSimilarItems] = useState<(Media | SongMedia)[]>([]);

  const mediaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");
  const [reviewListRefreshKey, setReviewListRefreshKey] = useState(0);

  useEffect(() => {
    if (!mediaId) return;

    let isCancelled = false;

    async function loadMediaPage() {
      try {
        const [mediaResponse, similarResponse, myReviewResponse] = await Promise.all([
          api.get<MediaDetail | SongMedia>(`${apiPath}/${mediaId}`, {
            headers: { Accept: "application/json" },
          }),
          api.get<PaginatedResponse<Media | SongMedia>>(`${apiPath}/${mediaId}/similar`, {
            headers: { Accept: "application/json" },
            params: { page: 1, size: 20 },
          }),
          api.get<MyReview | null>(`/my/reviews/${reviewKind}/${mediaId}`).catch(() => ({ data: null })),
        ]);

        if (isCancelled) return;

        setMedia(mediaResponse.data);
        setSimilarItems(similarResponse?.data?.items ?? []);
        setMyReview(myReviewResponse.data ?? null);
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
        }
      }
    }

    void loadMediaPage();

    return () => {
      isCancelled = true;
    };
  }, [mediaId, apiPath, reviewKind]);

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
      window.location.href = `/login?next=${encodeURIComponent(`${routePath}/${mediaId}`)}`;
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

  async function shareMediaToFriend(friendId: number) {
    if (!media) return;

    try {
      const dmResponse = await api.post(`/messages/dm/${friendId}`, {});
      const conversationId = dmResponse.data.conversationId;

      await api.post(`/messages/conversations/${conversationId}/messages`, {
        messageText: "Shared media",
        messageType: "media_share",
        sharedMovieId: mediaType === "movie" ? media.id : null,
        sharedSongId: mediaType === "song" ? media.id : null,
        sharedTvshowId: mediaType === "tv" ? media.id : null,
      });

      setShareOpen(false);
      setFriendQuery("");
      setShareSuccess("Media sent!");

      setTimeout(() => {
        setShareSuccess("");
      }, 2500);
    } catch (error) {
      console.error(error);
      alert("Could not share media.");
    }
  }

  const showSummary = mediaType !== "song";

  const handleReviewSuccess = useCallback(async () => {
    if (!mediaId) return;
    try {
      const [mediaResponse, myReviewResponse] = await Promise.all([
        api.get<MediaDetail | SongMedia>(`${apiPath}/${mediaId}`, {
          headers: { Accept: "application/json" },
        }),
        api.get<MyReview | null>(`/my/reviews/${reviewKind}/${mediaId}`).catch(() => ({ data: null })),
      ]);
      setMedia(mediaResponse.data);
      setMyReview(myReviewResponse.data ?? null);
      setReviewListRefreshKey((key) => key + 1);
    } catch (error) {
      console.error(error);
    }
  }, [apiPath, mediaId, reviewKind]);

  return (
    <div className="mx-auto pb-20">
      <Navbar />
      <div>
        {media !== undefined && (
          <>
            <div className="mt-6 flex w-full gap-8 px-8">
              <div className="grow-1">
                <div className="flex flex-col items-center">
                  {media.cover ? (
                    <Image src={media.cover} alt={media.title} width={300} height={400} className="rounded-md object-cover" />
                  ) : null}

                  <div className="mt-2">
                    {media.genres.map((genre) => (
                      <Badge key={genre} className="mr-1 rounded-sm">
                        {genre}
                      </Badge>
                    ))}
                  </div>

                  {renderInfoCard(media)}
                </div>

                <div className="mt-5">
                  <ReviewList
                    scope="friends"
                    mediaType={reviewKind}
                    mediaId={media.id}
                    refreshKey={reviewListRefreshKey}
                  />
                </div>
              </div>

              <div className="grow-1">
                <h1 className="text-4xl font-bold justify-self-center">{media.title}</h1>

                <div className="mt-5 flex items-center justify-center">
                  <Star className="mr-5" fill="#F3B413" color="#F3B413" size={100} />
                  <div className="text-7xl font-bold text-blue-700">{media.rating}</div>
                </div>

                <div className="flex font-bold text-xl justify-self-center border-orange-300 border-3 p-2 rounded-lg mt-8">
                  {!isLoggedIn ? (
                    <div className="text-muted-foreground">Log in to view your rating</div>
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

                <div className="mt-8 flex justify-center gap-5">
                  <Button className="bg-orange-400" onClick={handleReviewClick}>
                    REVIEW
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={openShareModal}
                    className="h-10 w-10 rounded-full border border-orange-200 bg-orange-100 text-gray-700 hover:bg-orange-200 transition-colors duration-200"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-8 justify-self-center flex flex-col justify-center">
                  <Button
                    variant="ghost"
                    className="text-xl font-bold bg-orange-200 text-grey-500 p-7 rounded-t-xl rounded-b-none border-3 border-orange-300"
                  >
                    {videoLabel}
                  </Button>
                  <iframe
                    width="560"
                    height="315"
                    src={media.video}
                    title={media.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-xl">
                    <ReviewList
                      scope="media"
                      mediaType={reviewKind}
                      mediaId={media.id}
                      refreshKey={reviewListRefreshKey}
                    />
                  </div>
                </div>
              </div>

              <div className="grow-1 overflow-x-clip">
                {showSummary && (
                  <>
                    <div className="text-lg font-bold justify-self-center">Summary</div>
                    <div className="w-100 justify-self-center border-3 border-orange-300 p-3 rounded-lg font-semibold">
                      {media.description}
                    </div>
                  </>
                )}

                <div className={`text-lg font-bold justify-self-center ${showSummary ? "mt-5" : ""}`}>
                  {similarLabel}
                </div>

                <div className="mt-2 h-[740px] space-y-2 overflow-y-auto pr-2 snap-y snap-mandatory scroll-smooth">
                  {similarItems.map((similarItem) => (
                    <div
                      key={similarItem.id}
                      className="relative h-[140px] snap-start snap-always origin-right transition-transform duration-200 hover:-translate-x-2 hover:z-10"
                    >
                      <Link href={`${routePath}/${similarItem.id}`} className="block h-full">
                        <Card className="h-full w-90 justify-self-center border border-orange-400 bg-orange-200 shadow-sm transition-all duration-200 hover:border-orange-500 hover:shadow-lg">
                          <CardHeader>
                            <CardTitle className="line-clamp-1 transition-colors hover:text-orange-700">
                              {similarItem.title}
                            </CardTitle>

                            <CardDescription className="flex items-center gap-3 flex-wrap">
                              {renderSimilarMeta ? (
                                renderSimilarMeta(similarItem)
                              ) : (
                                <>
                                  <div>{similarItem.year}</div>
                                  <div>{similarItem.length}</div>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4" fill="#F3B413" color="#F3B413" />
                                    <div className="font-bold">{similarItem.rating}</div>
                                  </div>
                                </>
                              )}
                            </CardDescription>

                            <CardAction>
                              {similarItem.cover ? (
                                <Image
                                  src={similarItem.cover}
                                  alt={similarItem.title}
                                  width={60}
                                  height={40}
                                  className="rounded-md border border-orange-300 object-cover"
                                />
                              ) : null}
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
              mediaType={reviewKind}
              mediaId={media.id}
              mediaTitle={media.title}
              open={isReviewFormOpen}
              onClose={() => setIsReviewFormOpen(false)}
              onSuccess={() => void handleReviewSuccess()}
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
                          onClick={() => shareMediaToFriend(f.userId)}
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

            <AnimatePresence>
              {shareSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed bottom-6 right-6 z-50 rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-base font-semibold text-green-700 shadow-lg"
                >
                  {shareSuccess}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
