import React from 'react';
import { Heart } from 'lucide-react';
import { type Exercise } from '../types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  onClick,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(exercise.id);
  };

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#161922] transition-all duration-300 hover:-translate-y-1 hover:border-[#06b6d4]/50 hover:shadow-[0_8px_30px_rgb(6,182,212,0.15)] cursor-pointer exercise-card-visibility"
    >
      {/* Favorite Button Overlay (Top Right) */}
      <button
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className="heart-pulse absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-gray-300 transition-all hover:bg-black/60 hover:text-red-500"
      >
        <Heart
          className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
            isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'
          }`}
        />
      </button>

      {/* Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-900/50">
        <img
          src={`${import.meta.env.BASE_URL}exercises/${exercise.images[0]}`}
          alt={exercise.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2500/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
          }}
        />
        {exercise.images.length > 1 && (
          <img
            src={`${import.meta.env.BASE_URL}exercises/${exercise.images[1]}`}
            alt={`${exercise.name} preview`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
            }}
          />
        )}
        {/* Soft bottom vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161922] via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-heading text-lg font-bold text-white transition-colors group-hover:text-[#06b6d4]">
          {exercise.name}
        </h3>

        {/* Badges/Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exercise.primaryMuscles.slice(0, 2).map((muscle) => (
            <span
              key={muscle}
              className="inline-flex items-center rounded-md bg-[#06b6d4]/10 px-2 py-0.5 text-xs font-semibold text-[#22d3ee] border border-[#06b6d4]/10"
            >
              {muscle}
            </span>
          ))}
          {exercise.equipment && (
            <span
              key={exercise.equipment}
              className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/10 capitalize"
            >
              {exercise.equipment}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
