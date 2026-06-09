"use client";

import MediaListPage from "@/components/media/MediaListPage";
import { GENRE_API_PATH, MEDIA_CONFIG } from "@/lib/types/media";

const config = MEDIA_CONFIG.movie;

export default function Page() {
  return (
    <MediaListPage
      title={config.label}
      routePath={config.route}
      emptyMessage="No movies matched your search."
      headerIcon={{ src: "/camera.png", alt: "camera" }}
      listConfig={{
        apiPath: config.api,
        routePath: config.route,
        filters: ["year", "writer", "actor", "director", "genre"],
        genreApiPath: GENRE_API_PATH.movie,
      }}
    />
  );
}
