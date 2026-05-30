/**
 * Responsibilities:
 * - Receive all data + handlers from (Page/useFriends hook)
 * - Handle UI state
 */

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Plus, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import type { Friend, FriendsMode, FriendsTab } from "./types";
import Link from "next/link";

type Props = {
    // Data lists
    friends: Friend[];
    receivedRequests: Friend[];
    sentRequests: Friend[];

    // Loading flags
    loadingFriends: boolean;
    loadingRequests: boolean;

    //UI mode + tab selection
    friendsMode: FriendsMode;
    setFriendsMode: (v: FriendsMode) => void;

    friendsTab: FriendsTab;
    setFriendsTab: (v: FriendsTab) => void;

    // Search Input for friends
    friendQuery: string;
    setFriendQuery: (v: string) => void;

    // Search Input for finding users
    userSearchQuery: string;
    setUserSearchQuery: (v: string) => void;
    userSearchResults: Friend[];
    loadingUserSearch: boolean;

    // Event handlers
    sendFriendRequest: (addresseeId: number) => void;
    acceptRequest: (requesterId: number) => void;
    declineRequest: (requesterId: number) => void;
    undoSentRequest: (addresseeId: number) => void;
    removeFriend: (friendId: number) => void;
};

export default function FriendsPanel({
    friends,
    receivedRequests,
    sentRequests,
    loadingFriends,
    loadingRequests,
    friendsMode,
    setFriendsMode,
    friendsTab,
    setFriendsTab,
    friendQuery,
    setFriendQuery,
    userSearchQuery,
    setUserSearchQuery,
    userSearchResults,
    loadingUserSearch,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    undoSentRequest,
    removeFriend,
}: Props) {
    // keep track of which friend row has its "more" menu open
    const [openFriendKebab, setOpenFriendKebab] = useState<number | null>(null);
    // Screen coordinates where the kebab menu opens
    const [kebabPos, setKebabPos] = useState<{ top: number; left: number } | null>(null);

    // Close kebab menu when clicking anywhere outside
    useEffect(() => {
        function onDocMouseDown() {
            if (openFriendKebab !== null) {
                setOpenFriendKebab(null);
                setKebabPos(null);
            }
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [openFriendKebab]);

    // Tab badge counts from source arrays
    const tabCounts = {
        friends: friends.length,
        received: receivedRequests.length,
        sent: sentRequests.length,
    };

    // Choose active list based on current tab
    const currentList =
        friendsTab === "friends" ? friends : friendsTab === "received" ? receivedRequests : sentRequests;

    // Client-side username filtering
    const filteredCurrentList = currentList.filter((f) =>
        f.username.toLowerCase().includes(friendQuery.toLowerCase())
    );

    const isLoadingFriendsSection = loadingFriends || loadingRequests;

    return (
        <div className="w-full lg:col-span-1 self-start">
            <div className="rounded-lg border border-orange-200 bg-orange-50/80 backdrop-blur-sm shadow-sm flex flex-col min-h-0 max-h-[calc(100vh-16rem)]">
                {/*Header*/}
                <div className="px-4 pt-4 pb-3 border-b border-orange-200">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold leading-none">Friends</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {friendsMode === "add"
                                    ? loadingUserSearch
                                        ? "Searching..."
                                        : "Find users to add"
                                    : isLoadingFriendsSection
                                        ? "Loading..."
                                        : `${currentList.length} total`}
                            </p>
                        </div>

                        {/*Add/List friends button*/}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"

                            // Toggle between "list" and "add" modes
                            onClick={() => {
                                const next = friendsMode === "list" ? "add" : "list";
                                setFriendsMode(next);
                                setUserSearchQuery("");
                            }}
                            aria-label={friendsMode === "list" ? "Add friend" : "Close add friend"}
                            title={friendsMode === "list" ? "Add friend" : "Close"}
                        >
                            {friendsMode === "list" ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                    </div>

                    {friendsMode === "add" ? (
                        <div className="mt-3">
                            <Input
                                placeholder="Search users by username…"
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="h-9 text-sm border-orange-200 bg-orange-100 text-gray-800 placeholder:text-gray-500 focus-visible:ring-orange-300"
                            />
                        </div>
                    ) : (
                        <>
                            {/*Tabs*/}
                            <div className="mt-3 flex flex-wrap items-center gap-1">
                                {(
                                    [
                                        { key: "friends", label: "My Friends", count: tabCounts.friends },
                                        { key: "received", label: "Received", count: tabCounts.received },
                                        { key: "sent", label: "Sent", count: tabCounts.sent },
                                    ] as const
                                ).map((t) => (
                                    <Button
                                        key={t.key}
                                        size="sm"
                                        variant={friendsTab === t.key ? "default" : "ghost"}
                                        onClick={() => setFriendsTab(t.key)}
                                        className={`rounded-full px-4 border-orange-300 ${friendsTab === t.key
                                            ? "bg-orange-400 text-white hover:bg-orange-500"
                                            : "bg-orange-100 text-gray-800 hover:bg-orange-200"
                                            }`}
                                    >
                                        <span className="mr-2">{t.label}</span>
                                        <span
                                            className={`text-xs ${friendsTab === t.key
                                                ? "text-primary-foreground/90"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            ({t.count})
                                        </span>
                                    </Button>
                                ))}
                            </div>

                            {/*Search*/}
                            <div className="mt-3">
                                <Input
                                    placeholder={
                                        friendsTab === "friends"
                                            ? "Search friends…"
                                            : friendsTab === "received"
                                                ? "Search friend requests received…"
                                                : "Search requests you've sent…"
                                    }
                                    value={friendQuery}
                                    onChange={(e) => setFriendQuery(e.target.value)}
                                    className="h-9 text-sm border-orange-200 bg-orange-100 text-gray-800 placeholder:text-gray-500 focus-visible:ring-orange-300"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/*Body*/}
                <div className="flex-1 overflow-y-auto min-h-0 p-2">
                    {friendsMode === "add" ? (
                        <>
                            {loadingUserSearch ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">Searching…</div>
                            ) : userSearchQuery.trim() && userSearchResults.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">No users found.</div>
                            ) : userSearchResults.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">Type a username to search.</div>
                            ) : (
                                <div className="space-y-1">
                                    {userSearchResults.map((u) => {
                                        const isFriend = friends.some((f) => f.userId === u.userId);
                                        const isPending = sentRequests.some((r) => r.userId === u.userId);
                                        const label = isFriend ? "Already Friends" : isPending ? "Request Pending" : "Add";

                                        return (
                                            <div
                                                key={u.userId}
                                                className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-orange-200 hover:bg-orange-100"
                                            >
                                                <div className="h-9 w-9 overflow-hidden rounded-full border border-orange-200 bg-orange-100 shrink-0">
                                                    {u.avatar ? (
                                                        <img
                                                            src={u.avatar}
                                                            alt={u.username}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">
                                                            ?
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <Link href={`/users/${u.userId}`} className="truncate text-sm font-medium hover:underline">
                                                        {u.username}
                                                    </Link>
                                                    <div className="truncate text-[11px] text-muted-foreground leading-tight">
                                                        {u.firstName} {u.lastName}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className={`rounded-full border-orange-300 ${isFriend || isPending ? "opacity-60 cursor-not-allowed" : "bg-orange-400 text-white hover:bg-orange-500"}`}
                                                    disabled={isFriend || isPending}
                                                    onClick={() => sendFriendRequest(u.userId)}
                                                    title={label}
                                                    variant={isFriend || isPending ? "outline" : "default"}
                                                >
                                                    {label}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {isLoadingFriendsSection ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">Loading…</div>
                            ) : filteredCurrentList.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">
                                    {currentList.length === 0
                                        ? friendsTab === "friends"
                                            ? "No friends yet."
                                            : friendsTab === "received"
                                                ? "No received friend requests."
                                                : "No sent friend requests."
                                        : "No one with that username could be found."}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredCurrentList.map((f) => (
                                        <div
                                            key={f.userId}
                                            className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60 transition-colors"
                                        >
                                            <div className="h-9 w-9 overflow-hidden rounded-full border border-orange-200 bg-orange-100 shrink-0">
                                                {f.avatar ? (
                                                    <img
                                                        src={f.avatar}
                                                        alt={f.username}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">
                                                        ?
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <Link href={`/users/${f.userId}`} className="truncate text-sm font-medium leading-tight hover:underline">
                                                    {f.username}
                                                </Link>
                                                <div className="truncate text-[11px] text-muted-foreground leading-tight">
                                                    {f.firstName} {f.lastName}
                                                </div>
                                            </div>

                                            {friendsTab === "received" ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 shrink-0 border border-transparent text-green-600 hover:bg-green-600 hover:text-white transition-colors"
                                                        onClick={() => acceptRequest(f.userId)}
                                                        title="Accept"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 shrink-0 border border-transparent text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                                        onClick={() => declineRequest(f.userId)}
                                                        title="Decline"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : friendsTab === "sent" ? (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 shrink-0 border border-transparent text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                                    onClick={() => undoSentRequest(f.userId)}
                                                    title="Undo request"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <div className="relative flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 shrink-0 opacity-80 group-hover:opacity-100"
                                                        onClick={() => console.log("Message friend", f.userId)}
                                                        title="Message"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                                        </svg>
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 shrink-0 opacity-80 group-hover:opacity-100"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();

                                                            const btn = e.currentTarget as HTMLButtonElement;
                                                            const rect = btn.getBoundingClientRect();

                                                            const isOpen = openFriendKebab === f.userId;
                                                            if (isOpen) {
                                                                setOpenFriendKebab(null);
                                                                setKebabPos(null);
                                                                return;
                                                            }

                                                            setOpenFriendKebab(f.userId);
                                                            setKebabPos({
                                                                top: rect.bottom + window.scrollY + 6,
                                                                left: rect.right + window.scrollX,
                                                            });
                                                        }}
                                                        title="More"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>

                                                    {openFriendKebab === f.userId && kebabPos &&
                                                        createPortal(
                                                            <div
                                                                className="fixed z-[9999]"
                                                                style={{
                                                                    top: kebabPos.top,
                                                                    left: kebabPos.left,
                                                                    transform: "translateX(-100%)",
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="w-44 rounded-md border border-orange-200 bg-orange-50 shadow-md p-1">
                                                                    <button
                                                                        className="w-full rounded-sm px-2 py-2 text-left text-sm text-red-600 hover:bg-orange-100"
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            removeFriend(f.userId);
                                                                        }}
                                                                    >
                                                                        Remove Friend
                                                                    </button>
                                                                </div>
                                                            </div>,
                                                            document.body
                                                        )
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}