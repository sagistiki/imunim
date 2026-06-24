import React, { useState } from 'react';
import { 
  Play, Trash2, Edit2, Check, Save, Dumbbell, 
  RotateCcw, Sparkles, X, Eye
} from 'lucide-react';
import { type Exercise, type WorkoutRoutine, type FocusArea } from '../types/exercise';

interface WorkoutPlannerProps {
  exercises: Exercise[];
  routines: WorkoutRoutine[];
  onToggleExerciseInRoutine: (routineId: string, exerciseId: string) => void;
  onCreateRoutine: (name: string, initialExerciseIds: string[]) => void;
  onUpdateRoutine: (routine: WorkoutRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenExerciseDetails: (exercise: Exercise) => void;
  onStartWorkout: (routine: WorkoutRoutine) => void;
}

// Muscles grouping helper
const MUSCLE_GROUPS = {
  upper: ['biceps', 'triceps', 'chest', 'shoulders', 'lats', 'middle back', 'trapezius', 'forearms', 'neck'],
  lower: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['lats', 'middle back', 'biceps', 'forearms', 'trapezius'],
  core: ['abdominals', 'lower back']
};

export const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({
  exercises,
  routines,
  onToggleExerciseInRoutine,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onOpenExerciseDetails,
  onStartWorkout,
}) => {
  // --- Tab States ---
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'generator'>('saved');

  // --- Editing Routine State ---
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  // --- Smart Generator States ---
  const [focusArea, setFocusArea] = useState<FocusArea>('full');
  const [equipConstraint, setEquipConstraint] = useState<'any' | 'bodyweight'>('any');
  const [diffConstraint, setDiffConstraint] = useState<string>('any');
  const [exCount, setExCount] = useState<number>(6);
  
  // Generated workspace
  const [generatedExercises, setGeneratedExercises] = useState<Exercise[]>([]);
  const [generatedName, setGeneratedName] = useState('');

  // --- Smart Workout Generator Algorithm ---
  const generateWorkout = () => {
    const candidates = exercises.filter((ex) => {
      // Equipment Constraint
      if (equipConstraint === 'bodyweight') {
        const eq = ex.equipment?.toLowerCase() || '';
        if (eq !== 'body only' && eq !== 'none' && eq !== '') return false;
      }
      
      // Difficulty Constraint
      if (diffConstraint !== 'any' && ex.level !== diffConstraint) {
        return false;
      }

      // Focus Area / Muscle Split Constraint
      if (focusArea !== 'full') {
        const targetMuscles = MUSCLE_GROUPS[focusArea];
        const hitsTarget = ex.primaryMuscles.some((m) => targetMuscles.includes(m));
        if (!hitsTarget) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      alert("No exercises match your constraint configuration. Try relaxing difficulty or equipment splits.");
      return;
    }

    const compounds = candidates.filter((ex) => ex.mechanic === 'compound');
    const isolations = candidates.filter((ex) => ex.mechanic === 'isolation' || !ex.mechanic);

    const shuffle = (array: Exercise[]) => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledCompounds = shuffle(compounds);
    const shuffledIsolations = shuffle(isolations);

    const targetCompCount = Math.min(
      Math.ceil(exCount * 0.6), 
      shuffledCompounds.length
    );

    const selectedList: Exercise[] = [];
    
    for (let i = 0; i < targetCompCount; i++) {
      selectedList.push(shuffledCompounds[i]);
    }

    const remainingToFill = exCount - selectedList.length;
    const isolationsToTake = Math.min(remainingToFill, shuffledIsolations.length);
    for (let i = 0; i < Math.min(isolationsToTake, remainingToFill); i++) {
      selectedList.push(shuffledIsolations[i]);
    }

    if (selectedList.length < exCount) {
      const allShuffledCandidates = shuffle(candidates.filter(c => !selectedList.some(s => s.id === c.id)));
      const extraNeeded = exCount - selectedList.length;
      for (let i = 0; i < Math.min(extraNeeded, allShuffledCandidates.length); i++) {
        selectedList.push(allShuffledCandidates[i]);
      }
    }

    setGeneratedExercises(selectedList);

    const titleCaseFocus = focusArea === 'full' ? 'Full Body' : focusArea.charAt(0).toUpperCase() + focusArea.slice(1);
    const equipLabel = equipConstraint === 'bodyweight' ? 'Bodyweight' : 'Gym';
    setGeneratedName(`Smart ${titleCaseFocus} ${equipLabel} Set`);
  };

  // --- Swap / Re-roll Individual Exercise ---
  const handleSwapExercise = (indexToSwap: number) => {
    const candidates = exercises.filter((ex) => {
      if (equipConstraint === 'bodyweight') {
        const eq = ex.equipment?.toLowerCase() || '';
        if (eq !== 'body only' && eq !== 'none' && eq !== '') return false;
      }
      if (diffConstraint !== 'any' && ex.level !== diffConstraint) return false;
      if (focusArea !== 'full') {
        const targetMuscles = MUSCLE_GROUPS[focusArea];
        const hitsTarget = ex.primaryMuscles.some((m) => targetMuscles.includes(m));
        if (!hitsTarget) return false;
      }

      const isAlreadyInRoutine = generatedExercises.some((s) => s.id === ex.id);
      if (isAlreadyInRoutine) return false;

      return true;
    });

    if (candidates.length === 0) {
      alert("No alternate exercises available matching constraints.");
      return;
    }

    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    const updated = [...generatedExercises];
    updated[indexToSwap] = replacement;
    setGeneratedExercises(updated);
  };

  // --- Save Generated Set ---
  const handleSaveGeneratedSet = () => {
    const name = generatedName.trim() || 'My Smart Workout Set';
    const exerciseIds = generatedExercises.map((ex) => ex.id);
    if (exerciseIds.length === 0) return;
    
    onCreateRoutine(name, exerciseIds);
    setGeneratedExercises([]);
    setGeneratedName('');
    setActiveSubTab('saved');
  };

  // --- Inline Edit Routines ---
  const startEditingName = (routine: WorkoutRoutine) => {
    setEditingRoutineId(routine.id);
    setEditingName(routine.name);
  };

  const saveEditingName = (routine: WorkoutRoutine) => {
    if (editingName.trim()) {
      onUpdateRoutine({
        ...routine,
        name: editingName.trim()
      });
    }
    setEditingRoutineId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      
      {/* Sub Tabs switcher */}
      <div className="flex bg-gray-900/60 border border-gray-800 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'saved'
              ? 'bg-[#06b6d4] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Saved Workout Sets ({routines.length})
        </button>
        <button
          onClick={() => setActiveSubTab('generator')}
          className={`flex-grow-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'generator'
              ? 'bg-[#06b6d4] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Smart Routine Generator
        </button>
      </div>

      {/* SUB TAB 1: Saved Routines */}
      {activeSubTab === 'saved' && (
        <div className="space-y-4">
          {routines.length > 0 ? (
            routines.map((routine) => {
              const isExpanded = expandedRoutineId === routine.id;
              const routineIds = Array.isArray(routine.exerciseIds) 
                ? routine.exerciseIds 
                : typeof routine.exerciseIds === 'string' 
                ? [routine.exerciseIds] 
                : [];
              
              return (
                <div 
                  key={routine.id}
                  className="rounded-2xl border border-gray-800 bg-[#161922] overflow-hidden transition-colors hover:border-gray-700"
                >
                  {/* Routine List Header */}
                  <div 
                    onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                    className="flex items-center justify-between p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee]">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      
                      {/* Name editing vs display */}
                      {editingRoutineId === routine.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-black text-white text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-gray-800 focus:border-cyan-400 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditingName(routine)}
                            className="p-1.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white font-heading truncate">
                            {routine.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {routineIds.length} exercises • Created {new Date(routine.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onStartWorkout(routine)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#06b6d4] hover:bg-[#0891b2] text-black font-bold text-xs transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-black" />
                        Start
                      </button>
                      <button
                        onClick={() => editingRoutineId === routine.id ? setEditingRoutineId(null) : startEditingName(routine)}
                        className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                        aria-label="Rename routine"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${routine.name}"?`)) {
                            onDeleteRoutine(routine.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40"
                        aria-label="Delete routine"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Routine Expanded Exercises list */}
                  {isExpanded && (
                    <div className="border-t border-gray-850 bg-black/30 p-4 space-y-2 animate-fade-in">
                      {routineIds.length > 0 ? (
                        <div className="space-y-2">
                          {routineIds.map((exId) => {
                            const ex = exercises.find((e) => e.id === exId);
                            if (!ex) return null;
                            
                            const thumbnail = `${import.meta.env.BASE_URL}exercises/${ex.images[0]}`;
                            
                            return (
                              <div 
                                key={ex.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-gray-900/40 border border-gray-850/80 hover:border-gray-800 transition-colors"
                              >
                                <div 
                                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                  onClick={() => onOpenExerciseDetails(ex)}
                                >
                                  <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-black border border-gray-800">
                                    <img src={thumbnail} alt={ex.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-gray-200 line-clamp-1 hover:text-[#06b6d4] transition-colors">
                                      {ex.name}
                                    </h4>
                                    <div className="flex gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-gray-500 font-semibold uppercase">{ex.equipment || 'None'}</span>
                                      <span className="text-[10px] text-gray-600 font-bold">•</span>
                                      <span className="text-[10px] text-cyan-400 font-semibold uppercase">{ex.primaryMuscles[0]}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => onToggleExerciseInRoutine(routine.id, ex.id)}
                                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                  aria-label="Remove exercise from set"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic py-2 text-center">
                          This workout routine is empty. Go back to the Exercise Library to add exercises manually!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Empty Saved State */
            <div className="text-center py-12 px-6 rounded-2xl bg-gray-900/20 border border-gray-850 max-w-md mx-auto space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gray-500 mx-auto">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">No custom sets saved yet</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create manually by clicking "Add to Workout Set" in any exercise card details modal, or generate a structured set in the generator tool.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('generator')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-[#0891b2] text-black font-bold text-xs transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Try Smart Generator
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: Smart Workout Generator */}
      {activeSubTab === 'generator' && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="p-5 rounded-2xl border border-gray-800 bg-[#161922] space-y-4">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              Configure Generator Specs
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Focus Area Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Focus Split</label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value as FocusArea)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
                >
                  <option value="full">Full Body</option>
                  <option value="upper">Upper Body</option>
                  <option value="lower">Lower Body</option>
                  <option value="push">Push (Chest/Shoulders/Triceps)</option>
                  <option value="pull">Pull (Back/Biceps/Traps)</option>
                  <option value="core">Core (Abs/Lower Back)</option>
                </select>
              </div>

              {/* Gear Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Gear Type</label>
                <select
                  value={equipConstraint}
                  onChange={(e) => setEquipConstraint(e.target.value as 'any' | 'bodyweight')}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="any">Any Gear</option>
                  <option value="bodyweight">💪 Bodyweight Only</option>
                </select>
              </div>

              {/* Difficulty Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Difficulty</label>
                <select
                  value={diffConstraint}
                  onChange={(e) => setDiffConstraint(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
                >
                  <option value="any">Any Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {/* Exercise Count Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Workout Size</label>
                <select
                  value={exCount}
                  onChange={(e) => setExCount(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value={4}>4 Exercises</option>
                  <option value={6}>6 Exercises</option>
                  <option value={8}>8 Exercises</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateWorkout}
              className="w-full py-2.5 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-black font-bold text-sm transition-colors shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Generate Smart Set
            </button>
          </div>

          {/* Generated Result Preview Workspace */}
          {generatedExercises.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
                  Preview Generated Set
                </h4>
                <span className="text-xs text-gray-500 font-semibold">{generatedExercises.length} Exercises Selected</span>
              </div>

              {/* Generated Exercises Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedExercises.map((ex, index) => {
                  const thumbnail = `${import.meta.env.BASE_URL}exercises/${ex.images[0]}`;
                  
                  return (
                    <div 
                      key={ex.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => onOpenExerciseDetails(ex)}
                      >
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-black border border-gray-800 shrink-0">
                          <img src={thumbnail} alt={ex.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white line-clamp-1 hover:text-[#06b6d4] transition-colors">
                            {index + 1}. {ex.name}
                          </h4>
                          <div className="flex gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-500 capitalize">{ex.equipment || 'None'}</span>
                            <span className="text-[10px] text-gray-600">•</span>
                            <span className="text-[10px] text-[#22d3ee] capitalize">{ex.primaryMuscles[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenExerciseDetails(ex)}
                          className="p-1.5 rounded-lg bg-gray-950 border border-gray-850 text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleSwapExercise(index)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-850 text-[#22d3ee] hover:border-[#06b6d4] text-[10px] font-bold transition-all"
                          title="Swap exercise"
                        >
                          Swap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Panel Box */}
              <div className="p-4 rounded-xl border border-emerald-950/30 bg-emerald-950/5 flex flex-col sm:flex-row items-center gap-3 mt-4">
                <input
                  type="text"
                  value={generatedName}
                  onChange={(e) => setGeneratedName(e.target.value)}
                  placeholder="Workout routine name..."
                  className="w-full sm:flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveGeneratedSet}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  Save Workout Set
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
