import api from "@/app/apiClient";
import type { UserProfile, UserProfileUpdate } from "./types";

export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  const res = await api.get("/current_user");
  const u = res.data;
  return {
    userId: u.user_id ?? u.userId,
    username: u.username,
    firstName: u.first_name ?? u.firstName ?? "",
    lastName: u.last_name ?? u.lastName ?? "",
    email: u.email ?? null,
    avatar: u.avatar ?? null,
  };
}

export async function updateUserProfile(
  userId: number,
  payload: UserProfileUpdate
): Promise<UserProfile> {
  const res = await api.put(`/users/${userId}`, payload);
  const u = res.data;
  return {
    userId: u.user_id ?? u.userId,
    username: u.username,
    firstName: u.first_name ?? u.firstName ?? "",
    lastName: u.last_name ?? u.lastName ?? "",
    email: u.email ?? null,
    avatar: u.avatar ?? null,
  };
}

export async function generateRecoveryCode(): Promise<string> {
  const res = await api.post("/recovery-code", {});
  return res.data.recovery_code;
}
