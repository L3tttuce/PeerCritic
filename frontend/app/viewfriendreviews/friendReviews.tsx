"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Define allowed media types for fetching friend reviews
type MediaType = "movie" | "show" | "song";

// Define supported sort modes
type SortMode = "newest" | "oldest" | "high" | "low";

// Define TypeScript type for Friend Review object returned by API
type FriendReview = {
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

// Define props for the FriendReviews component
type FriendReviewsProps = {
    mediaType: MediaType;
    mediaId: number;
};

const API_BASE_URL = "http://localhost:8000";

// Helper function to return the correct friend review endpoint
function getEndpoint(mediaType: MediaType, mediaId: number) {
    if (mediaType === "song") {
        return `${API_BASE_URL}/my/friends/reviews/song/${mediaId}`;
    }

    if (mediaType === "show") {
        return `${API_BASE_URL}/my/friends/reviews/show/${mediaId}`;
    }

    return `${API_BASE_URL}/my/friends/reviews/movie/${mediaId}`;
}

// Export the friend reviews component rendered inside media detail pages
export default function FriendReviews({
    mediaType,
    mediaId,
}: FriendReviewsProps) {
    // State to hold the fetched friend reviews
    const [reviews, setReviews] = useState<FriendReview[]>([]);

    // State to track loading status while fetching reviews
    const [loading, setLoading] = useState(false);

    // State to hold an error message if the request fails
    const [error, setError] = useState("");

    // State to track whether the user is logged in
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // State to track which review cards are expanded
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

    // State to track sort mode
    const [sort, setSort] = useState<SortMode>("newest");

    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(false);

    const PAGE_SIZE = 8;

    // Memoize the endpoint so it only changes when media type or id changes
    const endpoint = useMemo(() => getEndpoint(mediaType, mediaId), [mediaType, mediaId]);

    // Toggle a review between expanded and collapsed
    function toggleReview(reviewId: number) {
        setExpandedReviews((prev) => ({
            ...prev,
            [reviewId]: !prev[reviewId],
        }));
    }

    // Reset expanded review state when switching to a different media item
    useEffect(() => {
        setExpandedReviews({});
        setSort("newest");
        setPage(1);
        setHasMore(false);
    }, [mediaType, mediaId]);

    // Fetch friend reviews when the endpoint changes
    useEffect(() => {
        async function fetchFriendReviews() {
            // Get access token from local storage
            const token = localStorage.getItem("accessToken");

            // If no token exists, treat the user as logged out
            if (!token) {
                setIsLoggedIn(false);
                setReviews([]);
                setError("");
                setLoading(false);
                return;
            }

            try {
                // Start loading and clear any previous error
                setLoading(true);
                setError("");

                // Send a GET request to the friend reviews endpoint
                const response = await axios.get(endpoint, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
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
                        (review: FriendReview) => !existingIds.has(review.reviewId)
                    );

                    return [...prev, ...newItems];
                });

                setHasMore(items.length === PAGE_SIZE);
                setIsLoggedIn(true);
            } catch (err) {
                console.error(err);

                // If token is invalid or expired, remove it and treat user as logged out
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                    setIsLoggedIn(false);
                    setReviews([]);
                    setError("");
                } else {
                    // Otherwise show an error while still considering the user logged in
                    setIsLoggedIn(true);
                    setReviews([]);
                    setError("Could not load friend reviews.");
                }
            } finally {
                // Stop loading after request finishes
                setLoading(false);
            }
        }

        void fetchFriendReviews();
    }, [endpoint, page]);

    // Build sorted review list
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

    // Render the friend reviews section UI
    return (
        <div className="mt-8">
            <div className="bg-orange-300 justify-self-center w-90 border-orange-400 border-3 rounded-lg p-1">
                <div className="text-xl font-bold justify-self-center mt-1">
                    Your Friends&apos; Reviews
                </div>
            </div>

            <div className="justify-self-center w-90 mt-3">
                {/*Login prompt when user is not logged in*/}
                {isLoggedIn === false ? (
                    <Card className="bg-orange-100 border-orange-300">
                        <CardContent className="p-4 text-sm text-gray-600 text-center">
                            Log in to see your friends&apos; reviews.
                        </CardContent>
                    </Card>
                ) : loading && reviews.length === 0 ? (
                    /*Animated skeleton cards while reviews are loading*/
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <motion.div
                                key={`loading-${index}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                            >
                                <Card className="border-orange-300 bg-orange-100 shadow-sm">
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-2.5">
                                            <div className="h-12 w-12 shrink-0 rounded-full bg-orange-200 animate-pulse" />

                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1.5">
                                                        <div className="h-4 w-28 rounded bg-orange-200 animate-pulse" />
                                                        <div className="h-3 w-20 rounded bg-orange-200 animate-pulse" />
                                                    </div>

                                                    <div className="h-8 w-16 rounded-full bg-orange-200 animate-pulse" />
                                                </div>

                                                <div className="border-t border-orange-200 pt-2 space-y-1.5">
                                                    <div className="h-4 w-full rounded bg-orange-200 animate-pulse" />
                                                    <div className="h-4 w-11/12 rounded bg-orange-200 animate-pulse" />
                                                    <div className="h-4 w-3/4 rounded bg-orange-200 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : error ? (
                    /*Show error state if the request fails*/
                    <Card className="bg-orange-100 border-orange-300">
                        <CardContent className="p-4 text-sm text-gray-600 text-center">
                            {error}
                        </CardContent>
                    </Card>
                ) : reviews.length === 0 ? (
                    /*Show empty state if no friends have reviewed the media*/
                    <Card className="bg-orange-100 border-orange-300">
                        <CardContent className="p-4 text-sm text-gray-600 text-center">
                            None of your friends have reviewed this yet.
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
                                                    layoutId="sort-pill-active"
                                                    className="absolute inset-0 rounded-full bg-orange-400"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}

                                            <span
                                                className={`relative z-10 ${isActive ? "text-white" : "text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/*Render animated list of friend review cards*/}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-3"
                        >
                            {sortedReviews.map((r, index) => {
                                // Build display name from first/last name, falling back to username
                                const displayName =
                                    [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || r.username;

                                // Use review text if present, otherwise show fallback text
                                const reviewText = r.review?.trim() || "No written review.";

                                // Check whether this review is currently expanded
                                const isExpanded = !!expandedReviews[r.reviewId];

                                // Check whether the review is long enough to need truncation
                                const isLongReview = reviewText.length > 250;

                                return (
                                    <motion.div
                                        key={r.reviewId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
                                    >
                                        <Card
                                            className={`border-orange-300 bg-orange-100 shadow-sm transition-all duration-200 ${isLongReview ? "hover:border-orange-400 hover:shadow-md" : ""
                                                }`}
                                        >
                                            <div className="block w-full bg-transparent text-left">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-orange-300 bg-orange-200">
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

                                                                <div className="shrink-0 flex items-center gap-1 rounded-full border border-orange-300 bg-white px-3 py-1">
                                                                    <Star className="h-4 w-4 fill-[#F3B413] text-[#F3B413]" />
                                                                    <span className="text-sm font-semibold text-blue-700">
                                                                        {r.reviewRating.toFixed(1)}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">/10</span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 border-t border-orange-200 pt-2">
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