import { useState, useEffect, useMemo, useRef } from 'react';
import { Flame, Sparkles, RefreshCw, BookOpen, ClipboardList } from 'lucide-react';
import exercisesData from './data/exercises.json';
import { type Exercise, type WorkoutRoutine } from './types/exercise';
import { FilterBar } from './components/FilterBar';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseModal } from './components/ExerciseModal';
import { WorkoutPlanner } from './components/WorkoutPlanner';
import { WorkoutPlayer } from './components/WorkoutPlayer';

// Cast imported JSON data to Exercise types
const exercisesList = exercisesData as unknown as Exercise[];

function App() {
  // --- Tab Navigation ---
  const [activeTab, setActiveTab] = useState<'library' | 'planner'>('library');

  // --- Active Workout Player State ---
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRoutine | null>(null);



  // --- Favorites State ---
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fitness:favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fitness:favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // --- Workout Routines / Sets State ---
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => {
    try {
      const stored = localStorage.getItem('fitness:routines');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as WorkoutRoutine[];
      // Sanitize: ensure exerciseIds is always a valid string array
      return parsed.map((r) => ({
        ...r,
        exerciseIds: Array.isArray(r.exerciseIds)
          ? r.exerciseIds
          : typeof r.exerciseIds === 'string' && r.exerciseIds
          ? [r.exerciseIds]
          : [],
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fitness:routines', JSON.stringify(routines));
  }, [routines]);

  const handleCreateRoutine = (name: string, initialExerciseIds: string | string[] = []) => {
    const ids = typeof initialExerciseIds === 'string' ? [initialExerciseIds] : initialExerciseIds;
    const newRoutine: WorkoutRoutine = {
      id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      exerciseIds: ids,
      createdAt: Date.now(),
    };
    setRoutines((prev) => [newRoutine, ...prev]);
  };

  const handleToggleExerciseInRoutine = (routineId: string, exerciseId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        
        const isPresent = routine.exerciseIds.includes(exerciseId);
        const exerciseIds = isPresent
          ? routine.exerciseIds.filter((id) => id !== exerciseId)
          : [...routine.exerciseIds, exerciseId];
          
        return { ...routine, exerciseIds };
      })
    );
  };

  const handleUpdateRoutine = (updatedRoutine: WorkoutRoutine) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === updatedRoutine.id ? updatedRoutine : r))
    );
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  };

  // --- Filtering State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isBodyweightOnly, setIsBodyweightOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // --- Modal View State ---
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // --- Pagination / Infinite Scroll State ---
  const [visibleCount, setVisibleCount] = useState(40);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // --- Dynamic Option Collections ---
  const allMuscles = useMemo(() => {
    const muscles = new Set<string>();
    exercisesList.forEach((ex) => {
      ex.primaryMuscles.forEach((m) => {
        if (m) muscles.add(m);
      });
    });
    return Array.from(muscles).sort();
  }, []);

  const allEquipment = useMemo(() => {
    const equipment = new Set<string>();
    exercisesList.forEach((ex) => {
      if (ex.equipment) equipment.add(ex.equipment);
    });
    return Array.from(equipment).sort();
  }, []);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    exercisesList.forEach((ex) => {
      if (ex.category) categories.add(ex.category);
    });
    return Array.from(categories).sort();
  }, []);

  const allLevels = useMemo(() => {
    const levels = new Set<string>();
    exercisesList.forEach((ex) => {
      if (ex.level) levels.add(ex.level);
    });
    return Array.from(levels).sort();
  }, []);

  // Reset pagination count whenever filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [
    searchQuery,
    selectedMuscles,
    selectedEquipment,
    isBodyweightOnly,
    selectedCategory,
    selectedLevel,
    showFavoritesOnly,
  ]);

  // --- Filter Logic ---
  const filteredExercises = useMemo(() => {
    return exercisesList.filter((exercise) => {
      // 1. Text Search Filter (name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        if (!exercise.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Muscle Filter (OR matches within selected muscles)
      if (selectedMuscles.length > 0) {
        const hasMuscle = exercise.primaryMuscles.some((m) =>
          selectedMuscles.includes(m)
        );
        if (!hasMuscle) return false;
      }

      // 3. Equipment Filter (OR matches within selected equipment)
      if (selectedEquipment.length > 0) {
        if (!exercise.equipment || !selectedEquipment.includes(exercise.equipment)) {
          return false;
        }
      }

      // 4. Quick Bodyweight Toggled Filter
      if (isBodyweightOnly) {
        const equip = exercise.equipment?.toLowerCase() || '';
        const isBw = equip === 'body only' || equip === 'none' || equip === '';
        if (!isBw) return false;
      }

      // 5. Category Filter
      if (selectedCategory && exercise.category !== selectedCategory) {
        return false;
      }

      // 6. Level Filter
      if (selectedLevel && exercise.level !== selectedLevel) {
        return false;
      }

      // 7. Favorites Filter
      if (showFavoritesOnly && !favorites.includes(exercise.id)) {
        return false;
      }

      return true;
    });
  }, [
    searchQuery,
    selectedMuscles,
    selectedEquipment,
    isBodyweightOnly,
    selectedCategory,
    selectedLevel,
    showFavoritesOnly,
    favorites,
  ]);

  // Paginated Subset of filtered exercises
  const paginatedExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount);
  }, [filteredExercises, visibleCount]);

  // --- Infinite Scroll Setup (IntersectionObserver) ---
  useEffect(() => {
    if (activeTab !== 'library') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && visibleCount < filteredExercises.length) {
          setVisibleCount((prev) => Math.min(prev + 40, filteredExercises.length));
        }
      },
      {
        root: null, // Viewport
        rootMargin: '200px', // Trigger ahead of time
        threshold: 0.1,
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [filteredExercises.length, visibleCount, activeTab]);

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setIsBodyweightOnly(false);
    setSelectedCategory('');
    setSelectedLevel('');
    setShowFavoritesOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#06070a] pb-32 text-gray-300 relative overflow-hidden">
      {/* Decorative Ambient Background Glows */}
      <div className="glow-blob w-[400px] h-[400px] bg-cyan-500/10 -top-40 -left-20" />
      <div className="glow-blob w-[450px] h-[450px] bg-indigo-500/10 top-[15%] -right-40" />
      <div className="glow-blob w-[350px] h-[350px] bg-purple-500/5 bottom-[10%] -left-20" />

      {/* Header Area */}
      <header className="relative py-10 px-6 overflow-hidden border-b border-gray-900 bg-gradient-to-b from-[#08090d] to-[#06070a]">
        {/* Glow indicator line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-[#06b6d4]/40 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
        
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee] text-xs font-semibold tracking-wide uppercase">
              <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              Static Gym Companion
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white font-heading tracking-tight flex items-center justify-center gap-2">
              <span>FIT</span>
              <span className="text-gradient">BROWSE</span>
            </h1>
            <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
              Quick, static, offline-capable database of over 850 exercise patterns. Filter muscles and gear instantly in the gym.
            </p>
          </div>
        </div>
      </header>

      {/* RENDER VIEW: Library Tab */}
      {activeTab === 'library' && (
        <div className="animate-fade-in">
          {/* Sticky Interactive Filter Panel */}
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMuscles={selectedMuscles}
            setSelectedMuscles={setSelectedMuscles}
            allMuscles={allMuscles}
            selectedEquipment={selectedEquipment}
            setSelectedEquipment={setSelectedEquipment}
            allEquipment={allEquipment}
            isBodyweightOnly={isBodyweightOnly}
            setIsBodyweightOnly={setIsBodyweightOnly}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            allCategories={allCategories}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            allLevels={allLevels}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            totalResultsCount={filteredExercises.length}
          />

          {/* Main Grid View */}
          <main className="max-w-6xl mx-auto px-4 mt-8">
            {paginatedExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={favorites.includes(exercise.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() => setSelectedExercise(exercise)}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search/Filter State */
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#161922]/30 border border-gray-900 rounded-3xl max-w-sm mx-auto space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">No exercises found</h3>
                  <p className="text-xs text-gray-500 mt-1">Try relaxing your filter options or clear them below.</p>
                </div>
                <button
                  onClick={handleResetAll}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-black font-bold text-xs transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Filters
                </button>
              </div>
            )}

            {/* Sentinel div for infinite scroll */}
            <div 
              ref={loaderRef} 
              className="h-10 mt-12 flex items-center justify-center text-xs text-gray-600 font-semibold"
            >
              {visibleCount < filteredExercises.length ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-cyan-500" />
                  <span>Loading more exercises...</span>
                </div>
              ) : (
                filteredExercises.length > 0 && <span>Showing all {filteredExercises.length} results</span>
              )}
            </div>
          </main>
        </div>
      )}

      {/* RENDER VIEW: Workout Planner Tab */}
      {activeTab === 'planner' && (
        <div className="animate-fade-in">
          <WorkoutPlanner
            exercises={exercisesList}
            routines={routines}
            onToggleExerciseInRoutine={handleToggleExerciseInRoutine}
            onCreateRoutine={handleCreateRoutine}
            onUpdateRoutine={handleUpdateRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onOpenExerciseDetails={(ex) => setSelectedExercise(ex)}
            onStartWorkout={(routine) => setActiveWorkout(routine)}
          />
        </div>
      )}

      {/* Sticky Bottom Tab Navigation Bar (Floating Dock Style) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] rounded-2xl glass-panel shadow-[0_16px_40px_rgba(0,0,0,0.6)] px-3 py-2 flex justify-around border border-white/10">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold rounded-xl transition-all ${
            activeTab === 'library'
              ? 'text-cyan-400 bg-cyan-500/5'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Library</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold rounded-xl transition-all ${
            activeTab === 'planner'
              ? 'text-cyan-400 bg-cyan-500/5'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span>Planner</span>
        </button>
      </nav>

      {/* Detailed Modal Drawer */}
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          isFavorite={favorites.includes(selectedExercise.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedExercise(null)}
          routines={routines}
          onToggleExerciseInRoutine={handleToggleExerciseInRoutine}
          onCreateRoutine={handleCreateRoutine}
        />
      )}

      {/* Fullscreen Workout Player */}
      {activeWorkout && (
        <WorkoutPlayer
          routine={activeWorkout}
          exercises={exercisesList}
          onClose={() => setActiveWorkout(null)}
        />
      )}
    </div>
  );
}

export default App;
