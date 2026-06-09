"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/app/apiClient";
import { buildReviewEndpoint } from "@/lib/reviewEndpoints";
import type { MediaType } from "@/lib/types/media";

type ReviewFormProps = {
  mediaType: MediaType;
  mediaId: number;
  mediaTitle: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const MAX_REVIEW_CHARS = 1500;

export default function ReviewForm({
  mediaType,
  mediaId,
  mediaTitle,
  open,
  onClose,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sparkleKey, setSparkleKey] = useState(0);
  const [sparkleRating, setSparkleRating] = useState(0);

  const reviewCharCount = review.length;
  const isReviewTooLong = reviewCharCount > MAX_REVIEW_CHARS;
  const reviewHasContent = review.trim().length > 0;

  function triggerSparkles(finalRating: number) {
    if (finalRating >= 4) {
      setSparkleRating(finalRating);
      setSparkleKey((prev) => prev + 1);
    }
  }

  const endpoint = useMemo(
    () => buildReviewEndpoint("my", mediaType, mediaId),
    [mediaType, mediaId]
  );

  useEffect(() => {
    if (open) {
      setRating(0);
      setReview("");
      setSubmitting(false);
      setError("");
      setSparkleKey(0);
      setSparkleRating(0);
    }
  }, [open, mediaId, mediaType]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Please log in to write a review.");
      return;
    }

    if (rating < 0 || rating > 10) {
      setError("Please choose a rating from 0 to 10.");
      return;
    }

    if (!reviewHasContent) {
      setError("Review cannot be empty.");
      return;
    }

    if (isReviewTooLong) {
      setError(`Review must be ${MAX_REVIEW_CHARS} characters or fewer.`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post(
        endpoint,
        {
          review: review.trim() || null,
          reviewRating: rating,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError("Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  }

  const sparkleCount =
    sparkleRating >= 9 ? 8 :
      sparkleRating >= 7 ? 6 :
        sparkleRating >= 4 ? 5 : 4;

  const sparkleDistance =
    sparkleRating >= 9 ? 30 :
      sparkleRating >= 7 ? 24 :
        sparkleRating >= 4 ? 20 : 16;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-orange-300 bg-orange-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-200 px-5 py-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Write a Review</div>
            <div className="text-sm text-gray-600">{mediaTitle}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 transition hover:bg-orange-100 hover:text-gray-900"
            aria-label="Close review form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Your Rating
            </label>

            <div className="rounded-xl border border-orange-200 bg-orange-100/70 p-4">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <motion.div
                    animate={{
                      scale:
                        rating >= 9 ? 1.18 :
                          rating >= 8 ? 1.12 :
                            rating >= 7 ? 1.08 :
                              rating >= 5 ? 1.04 :
                                1,
                      rotate:
                        rating >= 9 ? [0, -3, 3, -2, 2, 0] :
                          rating >= 7 ? [0, -1, 1, 0] :
                            0,
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 220, damping: 16 },
                      rotate: {
                        duration: rating >= 9 ? 0.45 : 0.35,
                        repeat: rating >= 7 ? Infinity : 0,
                        repeatDelay: 0.8,
                      },
                    }}
                    style={{
                      filter:
                        rating >= 9
                          ? "drop-shadow(0 0 14px rgba(245,158,11,0.55))"
                          : rating >= 7
                            ? "drop-shadow(0 0 10px rgba(245,158,11,0.35))"
                            : rating >= 5
                              ? "drop-shadow(0 0 6px rgba(245,158,11,0.22))"
                              : "drop-shadow(0 0 2px rgba(245,158,11,0.10))",
                    }}
                  >
                    <Star
                      className="h-8 w-8"
                      fill={
                        rating >= 9 ? "#F59E0B" :
                          rating >= 7 ? "#F3B413" :
                            "#F4C542"
                      }
                      color={
                        rating >= 9 ? "#F59E0B" :
                          rating >= 7 ? "#F3B413" :
                            "#F4C542"
                      }
                    />
                  </motion.div>

                  <motion.div
                    key={sparkleKey}
                    className="pointer-events-none absolute inset-0"
                    initial="idle"
                    animate="burst"
                  >
                    {Array.from({ length: sparkleCount }).map((_, i) => {
                      const angle = (360 / sparkleCount) * i;

                      return (
                        <motion.span
                          key={i}
                          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-yellow-400"
                          initial={{
                            x: "-50%",
                            y: "-50%",
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            x: `calc(-50% + ${Math.cos((angle * Math.PI) / 180) * sparkleDistance}px)`,
                            y: `calc(-50% + ${Math.sin((angle * Math.PI) / 180) * sparkleDistance}px)`,
                            scale: [0, 1.2, 0.6],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: sparkleRating >= 9 ? 0.75 : sparkleRating >= 7 ? 0.6 : 0.45,
                            ease: "easeOut",
                            delay: 0.02 * i,
                          }}
                        />
                      );
                    })}
                  </motion.div>
                </div>

                <motion.div
                  key={rating}
                  initial={{ scale: 0.94, opacity: 0.7, y: 4 }}
                  animate={{
                    scale:
                      rating >= 9 ? 1.08 :
                        rating >= 7 ? 1.04 :
                          rating >= 4 ? 1.01 : 1,
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{ duration: 0.18 }}
                  className="w-[96px] rounded-full border border-orange-300 bg-white px-5 py-1.5 text-center text-2xl font-bold text-blue-700 shadow-sm tabular-nums"
                >
                  {rating.toFixed(1)}
                </motion.div>

                <span className="text-sm font-medium text-gray-600">/10</span>
              </div>

              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={rating}
                onChange={(e) => {
                  setRating(Number(e.target.value));
                }}
                onMouseUp={(e) => {
                  triggerSparkles(Number(e.currentTarget.value));
                }}
                onTouchEnd={(e) => {
                  triggerSparkles(Number(e.currentTarget.value));
                }}
                className="w-full cursor-pointer accent-orange-400"
              />

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Review
            </label>

            <textarea
              maxLength={MAX_REVIEW_CHARS}
              value={review}
              onChange={(e) => {
                const value = e.target.value;
                const cleaned = value
                  .replace(/^\s+/, "")
                  .replace(/[ ]{2,}/g, " ")
                  .replace(/\n{3,}/g, "\n\n");

                setReview(cleaned);
              }}
              rows={5}
              placeholder="Write your thoughts..."
              className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-orange-400"
            />
            <div
              className={`mt-1 text-right text-xs ${
                isReviewTooLong ? "text-red-600" : "text-gray-500"
              }`}
            >
              {reviewCharCount}/{MAX_REVIEW_CHARS} characters
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-orange-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || isReviewTooLong || !reviewHasContent}
              className="rounded-lg bg-orange-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
