import axios from "axios";
import type { UserProfile, UserProfileUpdate } from "./types";

function authHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("accessToken"),
    Accept: "application/json",
  };
}

// Fetch the current (logged in) user's profile.
export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  const res = await axios.get("http://localhost:8000/current_user", {
    headers: authHeaders(),
  });

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

// Update profile with the user's changes.
export async function updateUserProfile(userId: number, payload: UserProfileUpdate): Promise<UserProfile> {
  const res = await axios.put(`http://localhost:8000/users/${userId}`, payload, {
    headers: authHeaders(),
  });

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
  const res = await axios.post(
    "http://localhost:8000/recovery-code",
    {},
    {
      headers: authHeaders(),
    }
  );

  return res.data.recovery_code;
}