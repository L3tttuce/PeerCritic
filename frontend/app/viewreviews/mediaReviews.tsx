"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Define allowed media types for fetching reviews
type MediaType = "movie" | "show" | "song";

// Define supported sort modes
type SortMode = "newest" | "oldest" | "high" | "low";

// Define TypeScript type for media review object returned by API
type MediaReview = {
    reviewId: number;
    review: string | null;
    reviewRating: number;
    reviewRatingCount: number | null;

    userId: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;

    kind: "movie" | "song";
    title: string;
    cover?: string | null;
    movieId?: number | null;
    songId?: number | null;
};

// Define props for the MediaReviews component
type MediaReviewsProps = {
    mediaType: MediaType;
    mediaId: number;
};

// Define base API URL
const API_BASE_URL = "http://localhost:8000";

// Helper function to return the correct media review endpoint
function getEndpoint(mediaType: MediaType, mediaId: number) {
    if (mediaType === "song") {
        return `${API_BASE_URL}/my/media/reviews/song/${mediaId}`;
    }

    return `${API_BASE_URL}/my/media/reviews/movie/${mediaId}`;
}

// Export media reviews component rendered inside media detail pages
export default function MediaReviews({
    mediaType,
    mediaId,
}: MediaReviewsProps) {
    // State to hold fetched reviews
    const [reviews, setReviews] = useState<MediaReview[]>([]);

    // State to track loading status
    const [loading, setLoading] = useState(false);

    // State to store fetch error message
    const [error, setError] = useState("");

    // State to track which reviews are expanded
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

    // State to store current selected sort mode
    const [sort, setSort] = useState<SortMode>("newest");

    // Memoized endpoint for current media item
    const endpoint = useMemo(() => getEndpoint(mediaType, mediaId), [mediaType, mediaId]);

    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(false);

    const PAGE_SIZE = 8;

    // Toggle expanded state for a review card
    function toggleReview(reviewId: number) {
        setExpandedReviews((prev) => ({
            ...prev,
            [reviewId]: !prev[reviewId],
        }));
    }

    // Reset expanded reviews and sort mode when media changes
    useEffect(() => {
        setExpandedReviews({});
        setSort("newest");
        setPage(1);
    }, [mediaType, mediaId]);

    // Fetch reviews when endpoint changes
    useEffect(() => {
        async function fetchMediaReviews() {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(endpoint, {
                    headers: {
                        Accept: "application/json",
                    },
                    params: {
                        page,
                        size: PAGE_SIZE,
                    },
                });

                const items = response.data?.items ?? response.data ?? [];

                setReviews((prev) => {
                    if (page === 1) return items;

                    const existingIds = new Set(prev.map((review) => review.reviewId));
                    const newItems = items.filter(
                        (review: MediaReview) => !existingIds.has(review.reviewId)
                    );

                    return [...prev, ...newItems];
                });

                setHasMore(items.length === PAGE_SIZE);
            } catch (err) {
                console.error(err);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        }

        void fetchMediaReviews();
    }, [endpoint, page]);

    // Memoized sorted reviews list based on selected sort mode
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

    return (
        <div className="mt-3 w-full max-w-xl self-center">
            {/* Reviews section header */}
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2 text-center shadow-sm">
                <div className="text-xl font-bold text-gray-900">
                    All Reviews
                </div>
            </div>

            <div className="mt-3">
                {loading && reviews.length === 0 ? (
                    // Loading skeleton cards
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <motion.div
                                key={`loading-${index}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                            >
                                <Card className="border-orange-200 bg-orange-50 shadow-sm">
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-2.5">
                                            <div className="h-12 w-12 shrink-0 rounded-full bg-orange-100 animate-pulse" />

                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1.5">
                                                        <div className="h-4 w-28 rounded bg-orange-100 animate-pulse" />
                                                        <div className="h-3 w-20 rounded bg-orange-100 animate-pulse" />
                                                    </div>

                                                    <div className="h-8 w-16 rounded-full bg-orange-100 animate-pulse" />
                                                </div>

                                                <div className="border-t border-orange-100 pt-2 space-y-1.5">
                                                    <div className="h-4 w-full rounded bg-orange-100 animate-pulse" />
                                                    <div className="h-4 w-11/12 rounded bg-orange-100 animate-pulse" />
                                                    <div className="h-4 w-3/4 rounded bg-orange-100 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : error ? (
                    // Error state when reviews fail to load
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4 text-center text-sm text-gray-600">
                            {error}
                        </CardContent>
                    </Card>
                ) : reviews.length === 0 ? (
                    // Empty state when no reviews exist
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4 text-center text-sm text-gray-600">
                            No reviews yet.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Sort controls */}
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
                                                    layoutId="media-sort-pill-active"
                                                    className="absolute inset-0 rounded-full bg-orange-200"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}

                                            <span
                                                className={`relative z-10 ${isActive ? "text-gray-900" : "text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Review cards list */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-3"
                        >
                            {sortedReviews.map((r, index) => {
                                // Build display name from first and last name, fallback to username
                                const displayName =
                                    [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.username;

                                // Fallback text when user leaves no written review
                                const reviewText = r.review?.trim() || "No written review.";

                                // Check if current review is expanded
                                const isExpanded = !!expandedReviews[r.reviewId];

                                // Check if review is long enough to support expand/collapse
                                const isLongReview = reviewText.length > 250;

                                return (
                                    <motion.div
                                        key={r.reviewId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
                                    >
                                        <Card
                                            className={`border-orange-200 bg-orange-50 shadow-sm transition-all duration-200 ${isLongReview ? "hover:border-orange-300 hover:shadow-md" : ""
                                                }`}
                                        >
                                            <div className="block w-full bg-transparent text-left">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2.5">
                                                        {/* User avatar or fallback initial */}
                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-orange-200 bg-orange-100">
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
                                                                    <Link href={`/users/${r.userId}`} className="truncate font-semibold text-black hover:underline">
                                                                        {displayName}
                                                                    </Link>
                                                                    <div className="mt-1 text-xs text-gray-600">@{r.username}</div>
                                                                </div>

                                                                {/* Review rating badge */}
                                                                <div className="shrink-0 flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-3 py-1">
                                                                    <Star className="h-4 w-4 fill-[#F3B413] text-[#F3B413]" />
                                                                    <span className="text-sm font-semibold text-blue-700">
                                                                        {r.reviewRating.toFixed(1)}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">/10</span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 border-t border-orange-100 pt-2">
                                                                <p
                                                                    className={
                                                                        isExpanded || !isLongReview
                                                                            ? "text-sm leading-5 text-gray-800 whitespace-pre-wrap break-words"
                                                                            : "text-sm leading-5 text-gray-800 line-clamp-3 whitespace-pre-wrap break-words"
                                                                    }
                                                                >
                                                                    {reviewText}
                                                                </p>

                                                                {/* Expand or collapse label for long reviews */}
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