"use client";

import Navbar from "@/app/navbar";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { MessageCircle, UserPlus, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PublicUserProfile = {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    friendCount: number;
};

type PublicReview = {
    reviewId: number;
    review: string | null;
    reviewRating: number;
    reviewRatingCount: number | null;
    kind: "movie" | "song" | "tv";
    title: string;
    cover?: string | null;
    movieId: number | null;
    songId: number | null;
};

type FriendStatus =
    | "self"
    | "none"
    | "pending_sent"
    | "pending_received"
    | "accepted"
    | "declined"
    | "blocked";

export default function PublicUserProfilePage() {
    const params = useParams();
    const userId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [user, setUser] = useState<PublicUserProfile | null>(null);
    const [reviews, setReviews] = useState<PublicReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

    const [friendStatus, setFriendStatus] = useState<FriendStatus | null>(null);

    const [openFriendMenu, setOpenFriendMenu] = useState(false);

    const friendMenuRef = useRef<HTMLDivElement | null>(null);

    function toggleReview(reviewId: number) {
        setExpandedReviews((prev) => ({
            ...prev,
            [reviewId]: !prev[reviewId],
        }));
    }

    useEffect(() => {
        if (!userId) return;

        async function fetchPublicProfile() {
            try {
                setLoading(true);

                const userResponse = await axios.get(`http://localhost:8000/public/users/${userId}`, {
                    headers: { Accept: "application/json" },
                });

                const reviewsResponse = await axios.get(`http://localhost:8000/public/users/${userId}/reviews`, {
                    headers: { Accept: "application/json" },
                });

                setUser(userResponse.data);
                setReviews(reviewsResponse.data ?? []);

                const token = localStorage.getItem("accessToken");

                if (token) {
                    try {
                        const statusResponse = await axios.get(
                            `http://localhost:8000/my/friends/status/${userId}`,
                            {
                                headers: {
                                    Accept: "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        setFriendStatus(statusResponse.data.status);
                    } catch (error) {
                        console.error(error);
                        setFriendStatus(null);
                    }
                }
            } catch (error: any) {
                console.error("PUBLIC PROFILE ERROR URL:", error?.config?.url);
                console.error("PUBLIC PROFILE ERROR STATUS:", error?.response?.status);
                console.error("PUBLIC PROFILE ERROR DATA:", error?.response?.data);

                setUser(null);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPublicProfile();
    }, [userId]);

    async function handleAddFriend() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = `/login?next=${encodeURIComponent(`/users/${userId}`)}`;
            return;
        }

        try {
            await axios.post(
                `http://localhost:8000/my/friends/request/${userId}`,
                {},
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFriendStatus("pending_sent");
        } catch (error) {
            console.error(error);
            alert("Could not send friend request.");
        }
    }

    async function handleAcceptFriendRequest() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = `/login?next=${encodeURIComponent(`/users/${userId}`)}`;
            return;
        }

        try {
            await axios.post(
                `http://localhost:8000/my/friends/accept/${userId}`,
                {},
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFriendStatus("accepted");
        } catch (error) {
            console.error(error);
            alert("Could not accept friend request.");
        }
    }

    async function handleRemoveFriend() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = `/login?next=${encodeURIComponent(`/users/${userId}`)}`;
            return;
        }

        try {
            await axios.delete(`http://localhost:8000/my/friends/${userId}`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            setFriendStatus("none");
            setOpenFriendMenu(false);
        } catch (error) {
            console.error(error);
            alert("Could not remove friend.");
        }
    }

    async function handleMessageUser() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            window.location.href = `/login?next=${encodeURIComponent(`/users/${userId}`)}`;
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8000/messages/dm/${userId}`,
                {},
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            window.location.href = `/messages?conversationId=${response.data.conversationId}`;
        } catch (error) {
            console.error(error);
            alert("Could not open conversation.");
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                friendMenuRef.current &&
                !friendMenuRef.current.contains(event.target as Node)
            ) {
                setOpenFriendMenu(false);
            }
        }

        if (openFriendMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openFriendMenu]);

    return (
        <div className="mx-auto min-h-screen bg-orange-50/40">
            <Navbar />

            <main className="mx-auto max-w-5xl px-6 py-8">
                {loading ? (
                    <div className="text-gray-600">Loading profile...</div>
                ) : !user ? (
                    <div className="text-gray-600">User not found.</div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                        <section className="self-start rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="h-28 w-28 overflow-hidden rounded-full border border-orange-300 bg-orange-100">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-700">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                                    {user.firstName} {user.lastName}
                                </h1>
                                <div className="mt-1 text-gray-600">@{user.username}</div>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    {friendStatus !== "self" && (
                                        <>
                                            <Button
                                                className="bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-70"
                                                title={friendStatus === "pending_received" ? "Accept friend request" : undefined}
                                                onClick={
                                                    friendStatus === "pending_received"
                                                        ? handleAcceptFriendRequest
                                                        : handleAddFriend
                                                }
                                                disabled={friendStatus === "pending_sent" || friendStatus === "accepted"}
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                {friendStatus === "accepted"
                                                    ? "Friends"
                                                    : friendStatus === "pending_sent"
                                                        ? "Request Pending"
                                                        : friendStatus === "pending_received"
                                                            ? "Accept"
                                                            : "Add Friend"}
                                            </Button>

                                            {friendStatus === "accepted" && (
                                                <Button
                                                    variant="outline"
                                                    className="border-orange-300 bg-orange-100 hover:bg-orange-200"
                                                    onClick={handleMessageUser}
                                                >
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Message
                                                </Button>
                                            )}

                                            {friendStatus === "accepted" && (
                                                <div className="relative">
                                                    {friendStatus === "accepted" && (
                                                        <div className="relative" ref={friendMenuRef}>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="border-orange-300 bg-orange-100 hover:bg-orange-200"
                                                                onClick={() => setOpenFriendMenu((prev) => !prev)}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>

                                                            {openFriendMenu && (
                                                                <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-orange-200 bg-orange-50 p-1 shadow-md">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleRemoveFriend}
                                                                        className="w-full rounded-sm px-2 py-2 text-left text-sm text-red-600 hover:bg-orange-100"
                                                                    >
                                                                        Remove Friend
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {openFriendMenu && (
                                                        <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-orange-200 bg-orange-50 p-1 shadow-md">
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveFriend}
                                                                className="w-full rounded-sm px-2 py-2 text-left text-sm text-red-600 hover:bg-orange-100"
                                                            >
                                                                Remove Friend
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-3 text-center">
                                <div className="rounded-lg border border-orange-200 bg-orange-100 p-3">
                                    <div className="text-xl font-bold text-gray-900">{reviews.length}</div>
                                    <div className="text-sm text-gray-600">Reviews</div>
                                </div>

                                <div className="rounded-lg border border-orange-200 bg-orange-100 p-3">
                                    <div className="text-xl font-bold text-gray-900">{user.friendCount}</div>
                                    <div className="text-sm text-gray-600">Friends</div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-orange-200 bg-orange-50/80 p-6 shadow-sm">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user.firstName}&apos;s Reviews
                                </h2>
                            </div>

                            <div className="mt-4 space-y-3">
                                {reviews.length === 0 ? (
                                    <Card className="border-orange-200 bg-orange-50 p-4 text-sm text-gray-600">
                                        This user has not written any reviews yet.
                                    </Card>
                                ) : (
                                    reviews.map((r) => {
                                        const reviewText = r.review?.trim() || "No written review.";
                                        const isExpanded = !!expandedReviews[r.reviewId];
                                        const isLongReview = reviewText.length > 250;

                                        return (
                                            <Card
                                                key={r.reviewId}
                                                className="border-orange-200 bg-orange-50 shadow-sm"
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-start gap-4">
                                                        <Link
                                                            href={r.kind === "song" ? `/songs/${r.songId}` : `/movies/${r.movieId}`}
                                                            className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-orange-200 bg-orange-100"
                                                        >
                                                            {r.cover ? (
                                                                <img
                                                                    src={r.cover}
                                                                    alt={r.title}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                                                                    No cover
                                                                </div>
                                                            )}
                                                        </Link>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={r.kind === "song" ? `/songs/${r.songId}` : `/movies/${r.movieId}`}
                                                                        className="block truncate font-medium text-gray-900 hover:underline"
                                                                    >
                                                                        {r.title}
                                                                    </Link>

                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                                        <span className="rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-gray-600">
                                                                            {r.kind === "movie"
                                                                                ? "Movie"
                                                                                : r.kind === "song"
                                                                                    ? "Song"
                                                                                    : "TV Show"}
                                                                        </span>

                                                                        {r.reviewRatingCount != null && (
                                                                            <span>{r.reviewRatingCount} ratings</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 flex items-center gap-1 rounded-full border border-orange-300 bg-orange-200/70 px-3 py-1">
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
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}