import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";

interface RecipeCardProps {
  slug: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string | null;
  servings?: string | null;
  totalTime?: string | null;
  compact?: boolean;
}

export default function RecipeCard({
  slug,
  name,
  description,
  imageUrl,
  category,
  servings,
  totalTime,
  compact,
}: RecipeCardProps) {
  return (
    <Link
      to="/recipes/$slug"
      params={{ slug }}
      className={`block overflow-hidden rounded-2xl border border-border-1 bg-surface-1 transition-colors active:border-primary-3 ${
        compact ? "" : "hover:border-primary-3"
      }`}
    >
      {imageUrl && (
        <div className={compact ? "aspect-[16/9]" : "aspect-[4/3]"}>
          <img
            src={imageUrl}
            alt={name ?? slug}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h3
          className={`font-semibold text-secondary-1 ${compact ? "text-sm" : "text-base"}`}
        >
          {name ?? slug}
        </h3>
        {description && !compact && (
          <p className="mt-1 line-clamp-2 text-sm text-secondary-2">
            {description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-secondary-3">
          {category && (
            <span className="rounded-full bg-primary-4 px-2 py-0.5 text-primary-1">
              {category}
            </span>
          )}
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {totalTime}
            </span>
          )}
          {servings && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {servings}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
