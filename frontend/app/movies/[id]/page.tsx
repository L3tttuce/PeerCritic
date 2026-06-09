"use client";

import MediaDetailPage from "@/components/media/MediaDetailPage";
import type { MediaDetail } from "@/lib/types/media";
import { MEDIA_CONFIG } from "@/lib/types/media";

const config = MEDIA_CONFIG.movie;

export default function Page() {
  return (
    <MediaDetailPage
      mediaType="movie"
      apiPath={config.api}
      routePath={config.route}
      similarLabel="Similar Movies"
      videoLabel="Official Trailer"
      renderInfoCard={(media: MediaDetail) => (
        <div className="bg-orange-300 w-90 border-orange-400 border-3 rounded-lg mt-2 p-3">
          <div>
            <strong>Directors: </strong>
            {media.directors?.join(", ")}
          </div>
          <div>
            <strong>Writers: </strong>
            {media.writers?.join(", ")}
          </div>
          <div>
            <strong>Actors: </strong>
            {media.actors?.join(", ")}
          </div>
          <div>
            <strong>Release Year: </strong>
            {media.year}
          </div>
          <div>
            <strong>Runtime: </strong>
            {media.length}
          </div>
        </div>
      )}
    />
  );
}
