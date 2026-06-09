import api from "@/app/apiClient";
import type { Review } from "./types";

export async function fetchMyReviewsApi(): Promise<Review[]> {
  const res = await api.get("/my/reviews");
  return res.data ?? [];
}

export async function deleteMyReviewApi(reviewId: number): Promise<void> {
  await api.delete(`/my/reviews/${reviewId}`);
}
