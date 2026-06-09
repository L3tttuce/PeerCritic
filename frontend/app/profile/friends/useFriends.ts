/**
 * This file encapsulates all friend-related state and logic.
 * Responsibilities:
 * - Own all friends UI states (tab + search inputs)
 * - Fetch friends
 * - Keep UI synced
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Friend, FriendsMode, FriendsTab } from "./types";
import {
  fetchFriendsApi,
  fetchReceivedRequestsApi,
  fetchSentRequestsApi,
  sendFriendRequestApi,
  acceptRequestApi,
  declineRequestApi,
  removeFriendApi,
  undoSentRequestApi,
  searchUsersByUsernameApi,
} from "./api";

export function useFriends() {
  // UI State
  const [friendsTab, setFriendsTab] = useState<FriendsTab>("friends");
  const [friendsMode, setFriendsMode] = useState<FriendsMode>("list");
  const [friendQuery, setFriendQuery] = useState("");

  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Data State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [userSearchResults, setUserSearchResults] = useState<Friend[]>([]);

  // Loading State
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingUserSearch, setLoadingUserSearch] = useState(false);

  // Fetch functions
  async function fetchFriends() {
    setLoadingFriends(true);
    try {
      const data = await fetchFriendsApi();
      setFriends(data);
    } catch (e) {
      console.error(e);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }

  async function fetchReceivedRequests() {
    setLoadingRequests(true);
    try {
      const data = await fetchReceivedRequestsApi();
      setReceivedRequests(data);
    } catch (e) {
      console.error(e);
      setReceivedRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function fetchSentRequests() {
    setLoadingRequests(true);
    try {
      const data = await fetchSentRequestsApi();
      setSentRequests(data);
    } catch (e) {
      console.error(e);
      setSentRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  // Actions
  async function sendFriendRequest(addresseeId: number) {
    // Change to pending immediately so the button can grey out.
    const pendingUser = userSearchResults.find((u) => u.userId === addresseeId);
    if (pendingUser) {
      setSentRequests((prev) =>
        prev.some((x) => x.userId === addresseeId) ? prev : [pendingUser, ...prev]
      );
    }

    try {
      await sendFriendRequestApi(addresseeId);
      await Promise.all([fetchSentRequests(), fetchFriends()]);
    } catch (e) {
      console.error(e);
      setSentRequests((prev) => prev.filter((x) => x.userId !== addresseeId));
    }
  }

  async function acceptRequest(requesterId: number) {
    try {
      await acceptRequestApi(requesterId);
      await Promise.all([fetchFriends(), fetchReceivedRequests()]);
    } catch (e) {
      console.error(e);
    }
  }

  async function declineRequest(requesterId: number) {
    // Remove from received list immediately
    setReceivedRequests((prev) => prev.filter((u) => u.userId !== requesterId));
    try {
      await declineRequestApi(requesterId);
      await fetchReceivedRequests();
    } catch (e) {
      console.error(e);
      await fetchReceivedRequests();
    }
  }

  async function removeFriend(friendId: number) {
    // Remove from friends list immediately
    setFriends((prev) => prev.filter((u) => u.userId !== friendId));
    try {
      await removeFriendApi(friendId);
      await fetchFriends();
    } catch (e) {
      console.error(e);
      await fetchFriends();
    }
  }

  async function undoSentRequest(addresseeId: number) {
    // Remove from sent list immediately
    setSentRequests((prev) => prev.filter((u) => u.userId !== addresseeId));
    try {
      await undoSentRequestApi(addresseeId);
      await fetchSentRequests();
    } catch (e) {
      console.error(e);
      await fetchSentRequests();
    }
  }

  // User Search
  async function searchUsersByUsername(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      setUserSearchResults([]);
      return;
    }

    setLoadingUserSearch(true);
    try {
      const data = await searchUsersByUsernameApi(trimmed);
      setUserSearchResults(data);
    } catch (e) {
      console.error(e);
      setUserSearchResults([]);
    } finally {
      setLoadingUserSearch(false);
    }
  }

  useEffect(() => {
    if (friendsMode !== "add") return;

    const t = setTimeout(() => {
      searchUsersByUsername(userSearchQuery);
    }, 300);

    return () => clearTimeout(t);
  }, [friendsMode, userSearchQuery]);

  useEffect(() => {
    void Promise.all([fetchFriends(), fetchReceivedRequests(), fetchSentRequests()]);
  }, []);

  const tabCounts = useMemo(
    () => ({
      friends: friends.length,
      received: receivedRequests.length,
      sent: sentRequests.length,
    }),
    [friends.length, receivedRequests.length, sentRequests.length]
  );

  return {
    // Data
    friends,
    receivedRequests,
    sentRequests,
    userSearchResults,

    // UI state
    friendsTab,
    setFriendsTab,
    friendsMode,
    setFriendsMode,
    friendQuery,
    setFriendQuery,
    userSearchQuery,
    setUserSearchQuery,

    // Loading
    loadingFriends,
    loadingRequests,
    loadingUserSearch,

    // Actions
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    undoSentRequest,

    // Fetch functions
    fetchFriends,
    fetchReceivedRequests,
    fetchSentRequests,

    // Derived data
    tabCounts,
  };
}