import React, { useEffect, useState } from 'react';
import { X, Heart, Dumbbell, ShieldAlert, Activity, GitFork, ArrowUpDown, AlignLeft } from 'lucide-react';
import { type Exercise, type WorkoutRoutine } from '../types/exercise';
import { translateExercise } from '../utils/translate';

interface ExerciseModalProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  routines: WorkoutRoutine[];
  onToggleExerciseInRoutine: (routineId: string, exerciseId: string) => void;
  onCreateRoutine: (name: string, initialExerciseId?: string) => void;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  exercise,
  isFavorite,
  onToggleFavorite,
  onClose,
  routines,
  onToggleExerciseInRoutine,
  onCreateRoutine,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Translation States ---
  const [translatedData, setTranslatedData] = useState<{ name: string; instructions: string[] } | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  // Reset translation cache when active exercise changes
  useEffect(() => {
    setTranslatedData(null);
    setIsTranslated(false);
  }, [exercise]);

  const handleManualTranslateToggle = async () => {
    if (isTranslated) {
      setIsTranslated(false);
    } else {
      if (translatedData) {
        setIsTranslated(true);
      } else {
        setIsLoadingTranslation(true);
        const result = await translateExercise(exercise.name, exercise.instructions);
        setTranslatedData(result);
        setIsTranslated(true);
        setIsLoadingTranslation(false);
      }
    }
  };

  // Animate between image 0 and image 1 every 800ms
  useEffect(() => {
    if (exercise.images.length < 2) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
    }, 800);

    return () => clearInterval(interval);
  }, [exercise.images]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Determine current active content
  const activeName = isTranslated && translatedData ? translatedData.name : exercise.name;
  const activeInstructions = isTranslated && translatedData ? translatedData.instructions : exercise.instructions;
  const isRtl = isTranslated;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      id="exercise-modal-overlay"
    >
      <div
        className="glass-modal w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div 
          className={`flex items-center justify-between p-5 border-b border-gray-800 bg-[#0d1017] ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
        >
          <h2 
            id="modal-title" 
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`text-xl font-bold font-heading text-white line-clamp-1 pr-4 flex-1 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            {activeName}
          </h2>
          
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Translate Button */}
            <button
              onClick={handleManualTranslateToggle}
              disabled={isLoadingTranslation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                isLoadingTranslation
                  ? 'bg-gray-900 border-gray-850 text-gray-500 cursor-wait'
                  : isTranslated
                  ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee] shadow-sm'
                  : 'bg-gray-800/80 hover:bg-gray-700/80 border-transparent text-gray-300'
              }`}
            >
              {isLoadingTranslation ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-750 border-t-cyan-500" />
                  <span>מתרגם...</span>
                </>
              ) : isTranslated ? (
                <span>English (Original)</span>
              ) : (
                <span>עברית (Translate)</span>
              )}
            </button>

            <button
              onClick={() => onToggleFavorite(exercise.id)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="heart-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
            </button>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Animated Demonstration Image */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gray-800">
            {exercise.images.map((imageName, index) => {
              const imageSrc = `${import.meta.env.BASE_URL}exercises/${imageName}`;
              return (
                <img
                  key={imageName}
                  src={imageSrc}
                  alt={`${exercise.name} step ${index + 1}`}
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                  }}
                />
              );
            })}
            
            {/* Visual Indicator of Step (0/1) */}
            {exercise.images.length > 1 && (
              <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] uppercase font-bold tracking-wider text-cyan-400 border border-cyan-400/20">
                Step {currentImageIndex + 1} of 2
              </div>
            )}
          </div>

          {/* Quick Technical Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-900/40 border border-gray-800">
              <Dumbbell className="h-5 w-5 text-cyan-400 mb-1.5" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Equipment</span>
              <span className="text-sm font-semibold text-white capitalize text-center mt-0.5 truncate max-w-full">
                {exercise.equipment || 'None'}
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-900/40 border border-gray-800">
              <ShieldAlert className="h-5 w-5 text-emerald-400 mb-1.5" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Level</span>
              <span className="text-sm font-semibold text-white capitalize text-center mt-0.5 truncate max-w-full">
                {exercise.level}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-900/40 border border-gray-800">
              <ArrowUpDown className="h-5 w-5 text-indigo-400 mb-1.5" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Force</span>
              <span className="text-sm font-semibold text-white capitalize text-center mt-0.5 truncate max-w-full">
                {exercise.force || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-900/40 border border-gray-800">
              <GitFork className="h-5 w-5 text-pink-400 mb-1.5" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Mechanic</span>
              <span className="text-sm font-semibold text-white capitalize text-center mt-0.5 truncate max-w-full">
                {exercise.mechanic || 'N/A'}
              </span>
            </div>
          </div>

          {/* Add to Workout Routines / Sets */}
          <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Dumbbell className="h-4 w-4" />
                <h4 className="text-xs uppercase font-bold tracking-wider">Workout Sets Planner</h4>
              </div>
            </div>
            
            {routines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {routines.map((routine) => {
                  const inRoutine = routine.exerciseIds.includes(exercise.id);
                  return (
                    <button
                      key={routine.id}
                      onClick={() => onToggleExerciseInRoutine(routine.id, exercise.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        inRoutine
                          ? 'bg-[#06b6d4]/20 border-[#06b6d4]/40 text-[#22d3ee] shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                          : 'bg-gray-950 border-gray-850 text-gray-400 hover:border-gray-700 hover:text-white'
                      }`}
                    >
                      {inRoutine ? '✓ ' : '+ '}
                      {routine.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No saved sets. Type a name below to create a workout set containing this exercise!</p>
            )}

            {/* Inline Create Set Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('newSetName') as HTMLInputElement;
                const name = input.value.trim();
                if (name) {
                  onCreateRoutine(name, exercise.id);
                  input.value = '';
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="newSetName"
                placeholder="Create new set with this exercise..."
                className="flex-1 bg-gray-950 border border-gray-850 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-700"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#06b6d4] hover:bg-[#0891b2] text-black font-bold text-xs transition-colors shrink-0"
              >
                Create Set
              </button>
            </form>
          </div>

          {/* Muscle Target Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Activity className="h-4 w-4" />
                <h4 className="text-xs uppercase font-bold tracking-wider">Primary Muscles</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map((muscle) => (
                  <span key={muscle} className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/15 capitalize">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800">
              <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <Activity className="h-4 w-4" />
                <h4 className="text-xs uppercase font-bold tracking-wider">Secondary Muscles</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.length > 0 ? (
                  exercise.secondaryMuscles.map((muscle) => (
                    <span key={muscle} className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 capitalize">
                      {muscle}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">None targeting</span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions List */}
          <div className="space-y-3">
            <div 
              className={`flex items-center gap-2 text-white border-b border-gray-800 pb-2 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
            >
              <AlignLeft className="h-4 w-4 text-cyan-400" />
              <h4 className={`font-heading text-lg font-bold flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'הוראות ביצוע שלב אחר שלב' : 'Step-by-Step Instructions'}
              </h4>
            </div>
            
            <ol className="space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
              {activeInstructions.map((step, idx) => (
                <li 
                  key={idx} 
                  className={`flex items-start gap-3.5 text-gray-300 text-sm leading-relaxed ${
                    isRtl ? 'flex-row-reverse text-right' : 'text-left'
                  }`}
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
};
