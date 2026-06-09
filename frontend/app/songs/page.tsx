"use client";

import MediaListPage from "@/components/media/MediaListPage";
import { GENRE_API_PATH, MEDIA_CONFIG } from "@/lib/types/media";

const config = MEDIA_CONFIG.song;

export default function Page() {
  return (
    <MediaListPage
      title={config.label}
      routePath={config.route}
      emptyMessage="No songs matched your search."
      headerIcon={{ src: "/radio.png", alt: "radio" }}
      listConfig={{
        apiPath: config.api,
        routePath: config.route,
        filters: ["year", "artist", "genre"],
        genreApiPath: GENRE_API_PATH.song,
      }}
    />
  );
}
