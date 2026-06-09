"use client";

import MediaDetailPage from "@/components/media/MediaDetailPage";
import { Star } from "lucide-react";
import type { SongMedia } from "@/lib/types/media";
import { MEDIA_CONFIG } from "@/lib/types/media";

const config = MEDIA_CONFIG.song;

export default function Page() {
  return (
    <MediaDetailPage
      mediaType="song"
      apiPath={config.api}
      routePath={config.route}
      similarLabel="Similar Songs"
      videoLabel="Listen on Spotify"
      renderInfoCard={(media) => {
        const song = media as SongMedia;
        return (
        <div className="bg-orange-300 w-90 border-orange-400 border-3 rounded-lg mt-2 p-3">
          <div>
            <strong>Artist: </strong>
            {song.artists.join(", ")}
          </div>
          <div>
            <strong>Release Year: </strong>
            {song.year}
          </div>
          <div>
            <strong>Runtime: </strong>
            {song.length}
          </div>
        </div>
        );
      }}
      renderSimilarMeta={(item) => {
        const song = item as SongMedia;
        return (
          <>
            <div className="max-w-[140px] truncate">{song.artists?.join(", ")}</div>
            <div>{item.year}</div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" fill="#F3B413" color="#F3B413" />
              <div className="font-bold">{item.rating}</div>
            </div>
          </>
        );
      }}
    />
  );
}
