"use client";

import Navbar from "@/app/navbar";
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, X, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MemberRow = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  unreadCount: number;
};

type CurrentUser = {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
};

type FriendRow = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
};

type ConversationRow = {
  conversationId: number;
  isGroup: boolean;
  conversationName: string | null;
  otherUser: null | {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  unreadCount: number;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  lastMessageFromUserId: number | null;
};

type MsgRow = {
  messageId: number;
  conversationId: number;
  fromUserId: number;
  messageText: string;
  messageType: "text" | "review_share" | "media_share";
  sharedReviewId: number | null;
  sharedReview: SharedReview | null;
  sharedMovieId: number | null;
  sharedSongId: number | null;
  sharedMedia: SharedMedia | null;
  sentDatetime: string;
};

type SharedReview = {
  reviewId: number;
  review: string | null;
  reviewRating: number;
  reviewRatingCount: number | null;
  kind: "movie" | "song" | "tv";
  title: string;
  cover?: string | null;
  year: number;
  movieId: number | null;
  songId: number | null;
};

type SharedMedia = {
  kind: "movie" | "tv" | "song";
  id: number;
  title: string;
  cover: string | null;
  year: number;
  rating: number;
  href: string;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ReviewShareCard({ review }: { review: SharedReview }) {
  const href =
    review.kind === "song"
      ? `/songs/${review.songId}`
      : `/movies/${review.movieId}`;

  const reviewText = review.review?.trim() || "No written review.";

  return (
    <div className="mt-1 block max-w-md rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm transition hover:border-orange-300 hover:bg-orange-100">
      <Link href={href} className="flex gap-3">
        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-orange-200 bg-orange-100">
          {review.cover ? (
            <img
              src={review.cover}
              alt={review.title}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
              No cover
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900 hover:underline">
                {review.title}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {review.kind === "movie"
                  ? "Movie"
                  : review.kind === "song"
                    ? "Song"
                    : "TV Show"}{" "}
                · {review.year}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 rounded-full border border-orange-300 bg-orange-200/70 px-2 py-0.5">
              <Star className="h-3.5 w-3.5 fill-[#F3B413] text-[#F3B413]" />
              <span className="text-xs font-semibold text-blue-700">
                {review.reviewRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <p className="mt-3 text-xs leading-5 text-gray-700 whitespace-pre-wrap break-words">
        {reviewText}
      </p>
    </div>
  );
}

function formatTimestamp(dateString: string) {
  const normalizedDateString = dateString.endsWith("Z")
    ? dateString
    : `${dateString}Z`;

  const date = new Date(normalizedDateString);
  const now = new Date();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function MediaShareCard({ media }: { media: SharedMedia }) {
  return (
    <Link
      href={media.href}
      className="mt-1 block max-w-md rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
    >
      <div className="flex gap-3">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-orange-200 bg-orange-100">
          {media.cover ? (
            <img
              src={media.cover}
              alt={media.title}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
              No cover
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">
            {media.title}
          </div>

          <div className="mt-1 text-xs text-gray-600">
            {media.kind === "movie"
              ? "Movie"
              : media.kind === "song"
                ? "Song"
                : "TV Show"}{" "}
            · {media.year}
          </div>

          <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-200/70 px-2 py-0.5">
            <Star className="h-3.5 w-3.5 fill-[#F3B413] text-[#F3B413]" />
            <span className="text-xs font-semibold text-blue-700">
              {media.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Messages() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [draft, setDraft] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [memberMap, setMemberMap] = useState<Record<number, MemberRow>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedConvRef = useRef<number | null>(null);
  const selectedRef = useRef<ConversationRow | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");
  const router = useRouter();

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  async function loadOlderMessages() {
    if (!selected || loadingOlder || !hasMoreOlder || messages.length === 0) return;

    const container = messagesContainerRef.current;
    const oldestMessageId = messages[0]?.messageId;
    if (!oldestMessageId) return;

    setLoadingOlder(true);

    const previousScrollHeight = container?.scrollHeight ?? 0;

    try {
      const res = await api.get<MsgRow[]>(
        `/messages/conversations/${selected.conversationId}/messages?limit=50&before_message_id=${oldestMessageId}`,
        { headers: authHeaders() }
      );

      const older = res.data;

      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.messageId));
        const dedupedOlder = older.filter((m) => !existingIds.has(m.messageId));
        return [...dedupedOlder, ...prev];
      });

      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (!el) return;

        const newScrollHeight = el.scrollHeight;
        const heightDiff = newScrollHeight - previousScrollHeight;
        el.scrollTop = el.scrollTop + heightDiff;
      });

      if (older.length < 50) {
        setHasMoreOlder(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }

  const loadMembers = useCallback(async (conversationId: number) => {
    const res = await api.get<MemberRow[]>(
      `/messages/conversations/${conversationId}/members`,
      { headers: authHeaders() }
    );
    const map: Record<number, MemberRow> = {};
    for (const m of res.data) map[m.userId] = m;
    setMemberMap(map);
  }, []);

  async function fetchMe() {
    const res = await api.get<CurrentUser>("/current_user", {
      headers: authHeaders(),
    });
    setMe(res.data);
  }

  async function loadFriends() {
    setLoadingFriends(true);
    try {
      const res = await api.get<FriendRow[]>("/my/friends", {
        headers: authHeaders(),
      });
      setFriends(res.data);
    } finally {
      setLoadingFriends(false);
    }
  }

  function isNearBottom(el: HTMLDivElement, threshold = 120) {
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= threshold;
  }

  function handleMessagesScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;

    shouldStickToBottomRef.current = isNearBottom(el);

    if (el.scrollTop <= 120) {
      loadOlderMessages().catch(console.log);
    }
  }

  const refreshConversations = useCallback(async () => {
    const res = await api.get<ConversationRow[]>("/messages/conversations", {
      headers: authHeaders(),
    });
    setConversations(res.data);
  }, []);

  const ensureWs = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No access token found for WebSocket");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://localhost:8000/ws/messages?token=${encodeURIComponent(token)}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS open");
    };

    ws.onmessage = (event) => {
      console.log("WS raw message:", event.data);

      try {
        const data = JSON.parse(event.data);

        if (data.type === "message" && data.message) {
          const m = data.message as MsgRow;

          const isCurrentConversation =
            !!selectedRef.current &&
            m.conversationId === selectedRef.current.conversationId;

          setMessages((prev) => {
            if (!isCurrentConversation) return prev;
            if (prev.some((x) => x.messageId === m.messageId)) return prev;
            return [...prev, m];
          });

          const refresh = () => refreshConversations().catch(console.log);

          if (isCurrentConversation) {
            api.post(
              `/messages/conversations/${m.conversationId}/read`,
              {},
              { headers: authHeaders() }
            )
              .then(refresh)
              .catch(console.log);
          } else {
            refresh();
          }
        }

        if (data.type === "message_deleted") {
          setMessages((prev) =>
            prev.filter((m) => m.messageId !== data.messageId)
          );

          refreshConversations().catch(console.log);
        }

        if (data.type === "conversation_update") {
          refreshConversations().catch(console.log);
        }

        if (data.type === "inbox_update") {
          refreshConversations().catch(console.log);
        }

        if (data.type === "error") {
          console.log("WS server error message:", data.message);
        }

        if (data.type === "connected") {
          console.log("WS connected ack:", data);
        }

        if (data.type === "subscribed") {
          console.log("WS subscribed ack:", data);
        }

        if (data.type === "unsubscribed") {
          console.log("WS unsubscribed ack:", data);
        }
      } catch (e) {
        console.log("WS message parse error:", e);
      }
    };

    ws.onerror = () => {
      console.log("WS error event fired");
    };

    ws.onclose = (event) => {
      console.log(
        `WS close code=${event.code} reason="${event.reason}" clean=${event.wasClean}`
      );
      wsRef.current = null;
      subscribedConvRef.current = null;
    };
  }, [refreshConversations]);

  async function createDmWith(friendUserId: number) {
    const res = await api.post<{ conversationId: number }>(
      `/messages/dm/${friendUserId}`,
      {},
      { headers: authHeaders() }
    );

    // refresh conversations and open the created one
    await refreshConversations();
    const convoId = res.data.conversationId;

    const conv =
      conversations.find((c) => c.conversationId === convoId) ??
      (await api
        .get<ConversationRow[]>("/messages/conversations", { headers: authHeaders() })
        .then((r) => r.data.find((c) => c.conversationId === convoId)));

    if (conv) {
      await openConversation(conv);
    }

    setNewOpen(false);
    setFriendQuery("");
  }

  async function deleteConversation(conv: ConversationRow) {
    const isCurrentlySelected = selected?.conversationId === conv.conversationId;
    const previousSelected = selected;
    const previousMessages = messages;
    const previousMemberMap = memberMap;
    const ws = wsRef.current;

    if (isCurrentlySelected) {
      setSelected(null);
      setMessages([]);
      setMemberMap({});
    }

    if (
      ws &&
      ws.readyState === WebSocket.OPEN &&
      subscribedConvRef.current === conv.conversationId
    ) {
      ws.send(
        JSON.stringify({
          action: "unsubscribe",
          conversationId: conv.conversationId,
        })
      );
      subscribedConvRef.current = null;
    }

    try {
      await api.delete(`/messages/conversations/${conv.conversationId}`, {
        headers: authHeaders(),
      });

      await refreshConversations();
    } catch (err) {
      if (isCurrentlySelected) {
        setSelected(previousSelected);
        setMessages(previousMessages);
        setMemberMap(previousMemberMap);
      }
      throw err;
    }
  }

  const openConversation = useCallback(async (conv: ConversationRow) => {
    shouldStickToBottomRef.current = true;
    setHasMoreOlder(true);
    setLoadingOlder(false);
    setSelected(conv);

    ensureWs();
    const ws = wsRef.current;

    if (ws) {
      if (
        ws.readyState === WebSocket.OPEN &&
        subscribedConvRef.current &&
        subscribedConvRef.current !== conv.conversationId
      ) {
        ws.send(
          JSON.stringify({
            action: "unsubscribe",
            conversationId: subscribedConvRef.current,
          })
        );
      }

      if (subscribedConvRef.current !== conv.conversationId) {
        const subscribe = () => {
          if (ws.readyState !== WebSocket.OPEN) return;

          ws.send(
            JSON.stringify({
              action: "subscribe",
              conversationId: conv.conversationId,
            })
          );
          subscribedConvRef.current = conv.conversationId;
        };

        if (ws.readyState === WebSocket.OPEN) {
          subscribe();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.addEventListener("open", subscribe, { once: true });
        }
      }
    }

    await loadMembers(conv.conversationId);

    const res = await api.get<MsgRow[]>(
      `/messages/conversations/${conv.conversationId}/messages?limit=80`,
      { headers: authHeaders() }
    );
    setMessages(res.data);

    await api.post(
      `/messages/conversations/${conv.conversationId}/read`,
      {},
      { headers: authHeaders() }
    );

    await refreshConversations();
  }, [ensureWs, loadMembers, refreshConversations]);

  async function sendMessage() {
    if (!selected) return;
    const text = draft.trim();
    if (!text) return;

    setDraft("");

    const res = await api.post<MsgRow>(
      `/messages/conversations/${selected.conversationId}/messages`,
      { messageText: text },
      { headers: authHeaders() }
    );

    const newMsg = res.data;

    setMessages((prev) => {
      if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
      return [...prev, newMsg];
    });

    refreshConversations().catch(console.log);
  }

  function senderInfo(fromUserId: number) {
    const m = memberMap[fromUserId];
    if (m) {
      return {
        username: m.username,
        avatar: m.avatar ?? null,
        isMe: me ? fromUserId === me.userId : false,
      };
    }

    return {
      username: `User ${fromUserId}`,
      avatar: null,
      isMe: me ? fromUserId === me.userId : false,
    };
  }

  async function deleteMessage(messageId: number) {
    await api.delete(`/messages/messages/${messageId}`, {
      headers: authHeaders(),
    });

    setMessages((prev) => prev.filter((m) => m.messageId !== messageId));

    refreshConversations().catch(console.log);
  }


  useEffect(() => {
    const targetConversationId = Number(conversationIdFromUrl);

    if (!targetConversationId || conversations.length === 0) return;

    if (selectedRef.current?.conversationId === targetConversationId) return;

    const targetConversation = conversations.find(
      (c) => c.conversationId === targetConversationId
    );

    if (targetConversation) {
      openConversation(targetConversation)
        .then(() => {
          router.replace("/messages");
        })
        .catch(console.error);
    }
  }, [conversationIdFromUrl, conversations, router, openConversation]);


  useEffect(() => {
    fetchMe().catch(console.error);
    refreshConversations().catch(console.error);

    ensureWs();

    return () => {
      wsRef.current?.close();
    };
  }, [ensureWs, refreshConversations]);

  const headerTitle = selected
    ? selected.isGroup
      ? selected.conversationName ?? "Group"
      : selected.otherUser
        ? `${selected.otherUser.firstName} ${selected.otherUser.lastName}`.trim() ||
        selected.otherUser.username
        : "DM"
    : "";

  const headerAvatar = selected?.isGroup ? null : selected?.otherUser?.avatar ?? null;

  return (
    <>
      <Navbar />

      <div className="h-[calc(100dvh-56px)] bg-muted/30">
        <div className="h-full min-h-0 grid grid-cols-1 md:grid-cols-[340px_1fr]">
          {/*Conversation List*/}
          <aside className="h-full min-h-0 border-r border-orange-200 bg-orange-100/60 dark:border-orange-800 dark:bg-orange-950/55 backdrop-blur supports-[backdrop-filter]:bg-orange-100/50 dark:supports-[backdrop-filter]:bg-orange-950/45">
            <div className="h-full min-h-0 flex flex-col">
              <div className="p-3 border-b border-orange-200 dark:border-orange-800 bg-orange-100/70 dark:bg-orange-950/55">
                <div className="flex items-center justify-between">
                  <h1 className="text-base font-semibold tracking-tight">Messages</h1>

                  <Dialog
                    open={newOpen}
                    onOpenChange={(v) => {
                      setNewOpen(v);
                      if (v) loadFriends().catch(console.error);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
                        aria-label="Create a new chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create a new chat</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3">
                        <Input
                          value={friendQuery}
                          onChange={(e) => setFriendQuery(e.target.value)}
                          placeholder="Search friends…"
                        />

                        <div className="max-h-[320px] overflow-auto rounded-xl border p-2">
                          {loadingFriends ? (
                            <div className="p-3 text-sm text-muted-foreground">Loading…</div>
                          ) : (
                            friends
                              .filter((f) => {
                                const q = friendQuery.trim().toLowerCase();
                                if (!q) return true;
                                const full = `${f.firstName} ${f.lastName} ${f.username}`.toLowerCase();
                                return full.includes(q);
                              })
                              .map((f) => (
                                <button
                                  key={f.userId}
                                  onClick={() => createDmWith(f.userId).catch(console.error)}
                                  className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                                >
                                  {f.avatar ? (
                                    <Image
                                      src={f.avatar}
                                      alt=""
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-full bg-muted" />
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">
                                      {`${f.firstName} ${f.lastName}`.trim() || f.username}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">
                                      @{f.username}
                                    </div>
                                  </div>

                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                </button>
                              ))
                          )}

                          {!loadingFriends && friends.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground">
                              No friends yet.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-2xl bg-orange-100/70 dark:bg-orange-950/55 px-4 py-2 border border-orange-200 dark:border-orange-800">
                  <Input
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Search"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                {conversations.map((c) => {
                  const active = selected?.conversationId === c.conversationId;

                  const title = c.isGroup
                    ? c.conversationName ?? "Group"
                    : c.otherUser
                      ? `${c.otherUser.firstName} ${c.otherUser.lastName}`.trim() ||
                      c.otherUser.username
                      : "DM";

                  const avatar = c.isGroup ? null : c.otherUser?.avatar ?? null;

                  return (
                    <div
                      key={c.conversationId}
                      className={cx(
                        "group w-full rounded-xl transition-colors",
                        "hover:bg-orange-200/50 dark:hover:bg-orange-900/30",
                        active && "bg-orange-200/60 dark:bg-orange-900/35"
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          onClick={() => openConversation(c)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <Image
                                src={avatar}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-orange-200/70 dark:bg-orange-900/40" />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium leading-tight truncate">
                                  {title}
                                </div>

                                {c.unreadCount > 0 && selected?.conversationId !== c.conversationId ? (
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-semibold text-white">
                                    {c.unreadCount}
                                  </span>
                                ) : null}
                              </div>

                              <div className="text-sm text-muted-foreground truncate">
                                {c.lastMessageText ?? "Say Hello!"}
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c).catch(console.error);
                          }}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-orange-300/50 hover:text-foreground group-hover:opacity-100 dark:hover:bg-orange-800/40"
                          aria-label="Delete conversation"
                          title="Delete conversation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {conversations.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground">
                    No conversations yet.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          {/*Current Conversation*/}
          <section className="h-full min-h-0 min-w-0 overflow-hidden">
            {selected ? (
              <div className="h-full min-h-0 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="border-b border-orange-200 bg-orange-100/70 dark:border-orange-800 dark:bg-orange-950/55 backdrop-blur supports-[backdrop-filter]:bg-orange-100/60 dark:supports-[backdrop-filter]:bg-orange-950/45">
                  <div className="px-4 py-3 flex items-center gap-3">
                    {headerAvatar ? (
                      <Image
                        src={headerAvatar}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-orange-200/70 dark:bg-orange-900/40" />
                    )}

                    <div className="min-w-0">
                      {selected.isGroup || !selected.otherUser ? (
                        <div className="font-semibold leading-tight truncate">
                          {headerTitle}
                        </div>
                      ) : (
                        <Link
                          href={`/users/${selected.otherUser.userId}`}
                          className="block font-semibold leading-tight truncate hover:underline"
                        >
                          {headerTitle}
                        </Link>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {selected.isGroup ? "Group chat" : "Direct message"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-yellow-300 bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
                  Messages are not encrypted. Do not share sensitive or personal information.
                </div>

                {/*Messages*/}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-0.5"
                >
                  {messages.map((m, idx) => {
                    const info = senderInfo(m.fromUserId);
                    const prev = messages[idx - 1];
                    const isGrouped = prev && prev.fromUserId === m.fromUserId;

                    return (
                      <div
                        key={m.messageId}
                        className={cx(
                          "group relative flex gap-2.5 rounded-xl px-2",
                          isGrouped ? "py-0.5" : "py-1.5",
                          "hover:bg-orange-100/60 dark:hover:bg-orange-950/30"
                        )}
                      >
                        <div className="w-10 shrink-0">
                          {!isGrouped ? (
                            info.avatar ? (
                              <Image
                                src={info.avatar}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-orange-200/70 dark:bg-orange-900/40" />
                            )
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          {!isGrouped ? (
                            <div className="flex items-baseline gap-2">
                              <div
                                className={cx(
                                  "font-semibold text-sm truncate",
                                  info.isMe && "text-orange-700 dark:text-orange-200"
                                )}
                              >
                                {info.username}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatTimestamp(m.sentDatetime)}
                              </div>
                            </div>
                          ) : null}

                          {info.isMe && (
                            <button
                              type="button"
                              onClick={() => deleteMessage(m.messageId).catch(console.error)}
                              className="absolute right-6 top-2 opacity-0 group-hover:opacity-100 transition
               p-1.5 rounded-md hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {m.messageType === "review_share" && m.sharedReview ? (
                            <ReviewShareCard review={m.sharedReview} />
                          ) : m.messageType === "media_share" && m.sharedMedia ? (
                            <MediaShareCard media={m.sharedMedia} />
                          ) : (
                            <div className="max-w-[650px] whitespace-pre-wrap break-words break-all text-sm leading-tight text-foreground/90">
                              {m.messageText}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}


                  {messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No messages yet. Say hi!
                    </div>
                  ) : null}

                  <div ref={bottomRef} />
                </div>

                {/*Messege Composer*/}
                <div className="border-t border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40">
                  <div className="p-3">
                    <div className="flex items-center gap-2 rounded-2xl bg-orange-50 dark:bg-orange-950/40 px-4 py-3 border border-orange-200 dark:border-orange-800">
                      <Input
                        value={draft}
                        maxLength={2000}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={
                          selected.isGroup
                            ? `Message ${selected.conversationName ?? "group"}`
                            : `Message @${selected.otherUser?.username ?? "user"}`
                        }
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendMessage();
                        }}
                      />
                      <div className="text-xs text-muted-foreground px-1 text-right">
                        {draft.length}/2000
                      </div>
                      <Button
                        onClick={sendMessage}
                        className="bg-orange-500 hover:bg-orange-400"
                      >
                        Send
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground px-1">
                      Press Enter to send
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a conversation
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}