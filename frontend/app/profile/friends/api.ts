import api from "@/app/apiClient";
import type { Friend } from "./types";

export async function fetchFriendsApi(): Promise<Friend[]> {
  const res = await api.get("/my/friends");
  return res.data ?? [];
}

export async function fetchReceivedRequestsApi(): Promise<Friend[]> {
  const res = await api.get("/my/friend_requests/received");
  return res.data ?? [];
}

export async function fetchSentRequestsApi(): Promise<Friend[]> {
  const res = await api.get("/my/friend_requests/sent");
  return res.data ?? [];
}

export async function sendFriendRequestApi(addresseeId: number) {
  await api.post(`/my/friends/request/${addresseeId}`);
}

export async function acceptRequestApi(requesterId: number) {
  await api.post(`/my/friends/accept/${requesterId}`);
}

export async function declineRequestApi(requesterId: number) {
  await api.post(`/my/friends/decline/${requesterId}`);
}

export async function removeFriendApi(friendId: number) {
  await api.delete(`/my/friends/${friendId}`);
}

export async function undoSentRequestApi(addresseeId: number) {
  await api.delete(`/my/friends/request/${addresseeId}`);
}

export async function searchUsersByUsernameApi(username: string): Promise<Friend[]> {
  const res = await api.get("/users/by-username/search", { params: { username } });
  return res.data ?? [];
}
