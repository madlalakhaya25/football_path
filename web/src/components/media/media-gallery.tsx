"use client";

import { Badge } from "@/components/ui/badge";

interface MediaItem {
  id: string;
  url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  tagged_players?: { full_name: string }[];
}

interface Props {
  items: MediaItem[];
  onDelete?: (id: string) => void;
}

export function MediaGallery({ items, onDelete }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.id} className="relative group space-y-1.5">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {item.media_type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.caption ?? "Media"}
                className="size-full object-cover"
              />
            ) : (
              <video
                src={item.url}
                controls
                className="size-full rounded-xl object-cover"
                style={{ maxHeight: "240px" }}
              />
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                aria-label="Delete media"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {item.caption && (
            <p className="text-xs text-muted-foreground leading-snug px-0.5 truncate">
              {item.caption}
            </p>
          )}

          {item.tagged_players && item.tagged_players.length > 0 && (
            <div className="flex flex-wrap gap-1 px-0.5">
              {item.tagged_players.map((p) => (
                <Badge key={p.full_name} variant="brand" className="text-[10px] px-1.5 py-0">
                  {p.full_name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
