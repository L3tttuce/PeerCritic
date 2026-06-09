"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/app/apiClient";
import { buildReviewEndpoint, type ReviewScope } from "@/lib/reviewEndpoints";
import type { MediaType, ReviewWithUser } from "@/lib/types/media";

type SortMode = "newest" | "oldest" | "high" | "low";

type ReviewListProps = {
  scope: ReviewScope;
  mediaType: MediaType;
  mediaId: number;
  refreshKey?: number;
};

const PAGE_SIZE = 8;

export default function ReviewList({ scope, mediaType, mediaId, refreshKey = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(scope === "media" ? true : null);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [sort, setSort] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const lastFetchedRefreshKey = useRef(refreshKey);

  const endpoint = useMemo(
    () => buildReviewEndpoint(scope, mediaType, mediaId),
    [scope, mediaType, mediaId]
  );

  const isFriendsScope = scope === "friends";
  const layoutId = isFriendsScope ? "sort-pill-active" : "media-sort-pill-active";

  function toggleReview(reviewId: number) {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  }

  useEffect(() => {
    setExpandedReviews({});
    setSort("newest");
    setPage(1);
    setHasMore(false);
  }, [scope, mediaType, mediaId]);

  useEffect(() => {
    setPage(1);
    setExpandedReviews({});
  }, [refreshKey]);

  useEffect(() => {
    async function fetchReviews() {
      const isExternalRefresh = refreshKey !== lastFetchedRefreshKey.current;
      lastFetchedRefreshKey.current = refreshKey;
      const pageToFetch = isExternalRefresh ? 1 : page;

      if (isExternalRefresh && page !== 1) {
        setPage(1);
        return;
      }

      if (isFriendsScope) {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsLoggedIn(false);
          setReviews([]);
          setError("");
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(endpoint, {
          headers: { Accept: "application/json" },
          params: { page: pageToFetch, size: PAGE_SIZE },
        });

        const items = response.data?.items ?? response.data ?? [];

        setReviews((prev) => {
          if (pageToFetch === 1) return items;

          const existingIds = new Set(prev.map((review) => review.reviewId));
          const newItems = items.filter(
            (review: ReviewWithUser) => !existingIds.has(review.reviewId)
          );

          return [...prev, ...newItems];
        });

        setHasMore(items.length === PAGE_SIZE);
        if (isFriendsScope) {
          setIsLoggedIn(true);
        }
      } catch (err: unknown) {
        console.error(err);

        if (
          isFriendsScope &&
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 401
        ) {
          localStorage.removeItem("accessToken");
          setIsLoggedIn(false);
          setReviews([]);
          setError("");
        } else {
          if (isFriendsScope) {
            setIsLoggedIn(true);
          }
          setReviews([]);
          setError(
            isFriendsScope
              ? "Could not load friend reviews."
              : "Could not load reviews."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchReviews();
  }, [endpoint, page, isFriendsScope, refreshKey]);

  const sortedReviews = useMemo(() => {
    const next = [...reviews];

    next.sort((a, b) => {
      if (sort === "newest") {
        return (b.reviewId ?? 0) - (a.reviewId ?? 0);
      }

      if (sort === "oldest") {
        return (a.reviewId ?? 0) - (b.reviewId ?? 0);
      }

      if (sort === "high") {
        if (b.reviewRating !== a.reviewRating) {
          return b.reviewRating - a.reviewRating;
        }
        return (b.reviewId ?? 0) - (a.reviewId ?? 0);
      }

      if (sort === "low") {
        if (a.reviewRating !== b.reviewRating) {
          return a.reviewRating - b.reviewRating;
        }
        return (b.reviewId ?? 0) - (a.reviewId ?? 0);
      }

      return 0;
    });

    return next;
  }, [reviews, sort]);

  const sortControls = (
    <div className="mb-3 flex justify-center">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-orange-200 bg-orange-50 p-1">
        {(
          [
            { key: "newest", label: "Newest" },
            { key: "oldest", label: "Oldest" },
            { key: "high", label: "Highest" },
            { key: "low", label: "Lowest" },
          ] as const
        ).map((option) => {
          const isActive = sort === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              className="relative rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none"
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className={`absolute inset-0 rounded-full ${
                    isFriendsScope ? "bg-orange-400" : "bg-orange-200"
                  }`}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <span
                className={`relative z-10 ${
                  isActive
                    ? isFriendsScope
                      ? "text-white"
                      : "text-gray-900"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const reviewCards = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-3"
    >
      {sortedReviews.map((r, index) => {
        const displayName =
          [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.username;
        const reviewText = r.review?.trim() || "No written review.";
        const isExpanded = !!expandedReviews[r.reviewId];
        const isLongReview = reviewText.length > 250;

        return (
          <motion.div
            key={r.reviewId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
          >
            <Card
              className={`${
                isFriendsScope
                  ? "border-orange-300 bg-orange-100"
                  : "border-orange-200 bg-orange-50"
              } shadow-sm transition-all duration-200 ${
                isLongReview
                  ? isFriendsScope
                    ? "hover:border-orange-400 hover:shadow-md"
                    : "hover:border-orange-300 hover:shadow-md"
                  : ""
              }`}
            >
              <div className="block w-full bg-transparent text-left">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-full border ${
                        isFriendsScope
                          ? "border-orange-300 bg-orange-200"
                          : "border-orange-200 bg-orange-100"
                      }`}
                    >
                      {r.avatar ? (
                        <Image
                          src={r.avatar}
                          alt={displayName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/users/${r.userId}`}
                            className="truncate font-semibold text-black hover:underline"
                          >
                            {displayName}
                          </Link>
                          <div className="mt-1 text-xs text-gray-600">@{r.username}</div>
                        </div>

                        <div
                          className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1 ${
                            isFriendsScope
                              ? "border-orange-300 bg-white"
                              : "border-orange-200 bg-orange-100"
                          }`}
                        >
                          <Star className="h-4 w-4 fill-[#F3B413] text-[#F3B413]" />
                          <span className="text-sm font-semibold text-blue-700">
                            {r.reviewRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">/10</span>
                        </div>
                      </div>

                      <div
                        className={`mt-3 border-t pt-2 ${
                          isFriendsScope ? "border-orange-200" : "border-orange-100"
                        }`}
                      >
                        <p
                          className={
                            isExpanded || !isLongReview
                              ? "text-sm leading-5 text-gray-800 whitespace-pre-wrap break-words"
                              : "text-sm leading-5 text-gray-800 line-clamp-3 whitespace-pre-wrap break-words"
                          }
                        >
                          {reviewText}
                        </p>

                        {isLongReview && (
                          <button
                            type="button"
                            onClick={() => toggleReview(r.reviewId)}
                            aria-expanded={isExpanded}
                            className="mt-1.5 text-sm font-medium text-orange-700 hover:underline"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );

  const loadingSkeleton = (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={`loading-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
        >
          <Card
            className={`${
              isFriendsScope
                ? "border-orange-300 bg-orange-100"
                : "border-orange-200 bg-orange-50"
            } shadow-sm`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`h-12 w-12 shrink-0 rounded-full animate-pulse ${
                    isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                  }`}
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div
                        className={`h-4 w-28 rounded animate-pulse ${
                          isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                        }`}
                      />
                      <div
                        className={`h-3 w-20 rounded animate-pulse ${
                          isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                        }`}
                      />
                    </div>
                    <div
                      className={`h-8 w-16 rounded-full animate-pulse ${
                        isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                      }`}
                    />
                  </div>
                  <div
                    className={`border-t pt-2 space-y-1.5 ${
                      isFriendsScope ? "border-orange-200" : "border-orange-100"
                    }`}
                  >
                    <div
                      className={`h-4 w-full rounded animate-pulse ${
                        isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                      }`}
                    />
                    <div
                      className={`h-4 w-11/12 rounded animate-pulse ${
                        isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                      }`}
                    />
                    <div
                      className={`h-4 w-3/4 rounded animate-pulse ${
                        isFriendsScope ? "bg-orange-200" : "bg-orange-100"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  if (isFriendsScope) {
    return (
      <div className="mt-8">
        <div className="bg-orange-300 justify-self-center w-90 border-orange-400 border-3 rounded-lg p-1">
          <div className="text-xl font-bold justify-self-center mt-1">
            Your Friends&apos; Reviews
          </div>
        </div>

        <div className="justify-self-center w-90 mt-3">
          {isLoggedIn === false ? (
            <Card className="bg-orange-100 border-orange-300">
              <CardContent className="p-4 text-sm text-gray-600 text-center">
                Log in to see your friends&apos; reviews.
              </CardContent>
            </Card>
          ) : loading && reviews.length === 0 ? (
            loadingSkeleton
          ) : error ? (
            <Card className="bg-orange-100 border-orange-300">
              <CardContent className="p-4 text-sm text-gray-600 text-center">{error}</CardContent>
            </Card>
          ) : reviews.length === 0 ? (
            <Card className="bg-orange-100 border-orange-300">
              <CardContent className="p-4 text-sm text-gray-600 text-center">
                None of your friends have reviewed this yet.
              </CardContent>
            </Card>
          ) : (
            <>
              {sortControls}
              {reviewCards}
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading}
                    className="rounded-full border border-orange-300 bg-orange-100 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-orange-200 disabled:opacity-60"
                  >
                    {loading ? "Loading..." : "Show more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 w-full max-w-xl self-center">
      <div className="rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2 text-center shadow-sm">
        <div className="text-xl font-bold text-gray-900">All Reviews</div>
      </div>

      <div className="mt-3">
        {loading && reviews.length === 0 ? (
          loadingSkeleton
        ) : error ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center text-sm text-gray-600">{error}</CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center text-sm text-gray-600">
              No reviews yet.
            </CardContent>
          </Card>
        ) : (
          <>
            {sortControls}
            {reviewCards}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="rounded-full border border-orange-300 bg-orange-100 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-orange-200 disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
