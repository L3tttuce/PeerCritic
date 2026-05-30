import axios from "axios";
import type { Friend } from "./types";

// API layer for Friends

const BASE_URL = "http://localhost:8000";

function authHeaders() {
  return {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      Accept: "application/json",
    },
  };
}

// Fetch all accepted friends of the current user.
export async function fetchFriendsApi(): Promise<Friend[]> {
  const res = await axios.get(`${BASE_URL}/my/friends`, authHeaders());
  return res.data ?? [];
}

// Fetch incoming requests.
export async function fetchReceivedRequestsApi(): Promise<Friend[]> {
  const res = await axios.get(`${BASE_URL}/my/friend_requests/received`, authHeaders());
  return res.data ?? [];
}

// Fetch outgoing requests.
export async function fetchSentRequestsApi(): Promise<Friend[]> {
  const res = await axios.get(`${BASE_URL}/my/friend_requests/sent`, authHeaders());
  return res.data ?? [];
}

// Send a friend request to another user.
export async function sendFriendRequestApi(addresseeId: number) {
  await axios.post(`${BASE_URL}/my/friends/request/${addresseeId}`, null, authHeaders());
}

// Accept request from another user.
export async function acceptRequestApi(requesterId: number) {
  await axios.post(`${BASE_URL}/my/friends/accept/${requesterId}`, null, authHeaders());
}

// Decline request from another user.
export async function declineRequestApi(requesterId: number) {
  await axios.post(`${BASE_URL}/my/friends/decline/${requesterId}`, null, authHeaders());
}

// Remove an existing friend.
export async function removeFriendApi(friendId: number) {
  await axios.delete(`${BASE_URL}/my/friends/${friendId}`, authHeaders());
}

// Cancel an outgoing friend request.
export async function undoSentRequestApi(addresseeId: number) {
  await axios.delete(`${BASE_URL}/my/friends/request/${addresseeId}`, authHeaders());
}

// Returns users that match the search.
export async function searchUsersByUsernameApi(username: string): Promise<Friend[]> {
  const res = await axios.get(`${BASE_URL}/users/by-username/search`, {
    ...authHeaders(),
    params: { username },
  });
  return res.data ?? [];
}