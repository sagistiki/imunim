import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Timer, ChevronLeft, ChevronRight, RotateCcw, 
  CheckCircle2, ClipboardList, ChevronDown, ChevronUp, AlignLeft
} from 'lucide-react';
import { type Exercise, type WorkoutRoutine } from '../types/exercise';
import { translateExercise } from '../utils/translate';

interface WorkoutPlayerProps {
  routine: WorkoutRoutine;
  exercises: Exercise[];
  onClose: () => void;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  routine,
  exercises,
  onClose,
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isPlayerImageToggle, setIsPlayerImageToggle] = useState(0);
  
  // Set tracker state (resets per exercise)
  const [completedSets, setCompletedSets] = useState<number>(0);
  const [targetSets, setTargetSets] = useState<number>(3);

  // Player Rest Timer States
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [targetRestTime, setTargetRestTime] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  
  // Collapsed plan outline on mobile
  const [isMobileOutlineOpen, setIsMobileOutlineOpen] = useState(false);

  // --- Translation States ---
  const [translationCache, setTranslationCache] = useState<Record<string, { name: string; instructions: string[] }>>({});
  const [isTranslated, setIsTranslated] = useState(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  const activeExerciseId = routine.exerciseIds[currentPlayerIndex];

  // Reset translation view state when index changes
  useEffect(() => {
    setIsTranslated(false);
  }, [currentPlayerIndex]);

  const triggerTranslation = async (exId: string) => {
    // Return cached translation if already loaded
    if (translationCache[exId]) {
      setIsTranslated(true);
      return;
    }

    const currentEx = exercises.find((e) => e.id === exId);
    if (!currentEx) return;

    setIsLoadingTranslation(true);
    const result = await translateExercise(currentEx.name, currentEx.instructions);
    
    // Save to cache
    setTranslationCache((prev) => ({
      ...prev,
      [exId]: result
    }));
    
    setIsTranslated(true);
    setIsLoadingTranslation(false);
  };

  const handleManualTranslateToggle = () => {
    if (isTranslated) {
      setIsTranslated(false);
    } else {
      triggerTranslation(activeExerciseId);
    }
  };

  // Toggle active player images
  useEffect(() => {
    const currentEx = exercises.find((e) => e.id === activeExerciseId);
    if (!currentEx || currentEx.images.length < 2) return;

    const interval = setInterval(() => {
      setIsPlayerImageToggle((prev) => (prev === 0 ? 1 : 0));
    }, 800);

    return () => clearInterval(interval);
  }, [activeExerciseId, exercises]);

  // Workout Player Rest Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsResting(false);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // Blocks on browser policies
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Reset Completed Sets and setup timer when skipping exercises
  useEffect(() => {
    setCompletedSets(0);
    setIsResting(false);
    setIsTimerRunning(false);
    setTimerSeconds(targetRestTime);
  }, [currentPlayerIndex, targetRestTime]);

  // Find active player exercise details
  const playerExercise = useMemo(() => {
    return exercises.find((e) => e.id === activeExerciseId) || null;
  }, [activeExerciseId, exercises]);

  // Log completed set & trigger rest break automatically
  const handleLogSet = () => {
    if (completedSets < targetSets) {
      const nextSets = completedSets + 1;
      setCompletedSets(nextSets);
      
      // Auto trigger rest timer
      setTimerSeconds(targetRestTime);
      setIsResting(true);
      setIsTimerRunning(true);
    }
  };

  // Adjust Rest Timer during workout
  const adjustRestTime = (amount: number) => {
    setTimerSeconds((prev) => Math.max(0, prev + amount));
    if (isResting) {
      setTargetRestTime((prev) => Math.max(15, prev + amount));
    }
  };

  if (!playerExercise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080a] text-white">
        <div className="text-center space-y-4">
          <p>Unable to load workout exercise. It may have been removed.</p>
          <button onClick={onClose} className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl">Close</button>
        </div>
      </div>
    );
  }

  // Determine current active content strings
  const cacheEntry = translationCache[activeExerciseId];
  const activeName = isTranslated && cacheEntry ? cacheEntry.name : playerExercise.name;
  const activeInstructions = isTranslated && cacheEntry ? cacheEntry.instructions : playerExercise.instructions;
  const isRtl = isTranslated;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07080a] text-gray-200 animate-fade-in font-sans">
      
      {/* PLAYER GRID: 3 columns on tablet/desktop, flex on mobile */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        
        {/* COLUMN 1: LEFT SIDEBAR - WORKOUT PLAN OUTLINE (Desktop/Tablet Only) */}
        <aside className="hidden md:flex flex-col w-64 bg-gray-950 border-r border-gray-900 p-5 shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-900">
            <ClipboardList className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400">Workout Plan</h3>
          </div>
          <div className="space-y-1.5">
            {routine.exerciseIds.map((exId, index) => {
              const ex = exercises.find((e) => e.id === exId);
              if (!ex) return null;
              const isActive = index === currentPlayerIndex;
              const isDone = index < currentPlayerIndex;
              
              return (
                <button
                  key={`${exId}_player_outline_${index}`}
                  onClick={() => setCurrentPlayerIndex(index)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                    isActive
                      ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee]'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold">
                    {isDone ? '✓' : index + 1}
                  </div>
                  <span className="text-xs font-semibold truncate">{ex.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* COLUMN 2: CENTER PANEL - ANIMATED PREVIEW & TIMER */}
        <main className="flex-1 flex flex-col p-5 md:p-8 min-h-0 overflow-y-auto space-y-6">
          
          {/* Top Bar for Mobile navigation & Exit */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Mobile Collapsible Outline toggle */}
            <button
              onClick={() => setIsMobileOutlineOpen(!isMobileOutlineOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-bold text-gray-400"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Plan Outline</span>
              {isMobileOutlineOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* Translate Button */}
            <button
              onClick={handleManualTranslateToggle}
              disabled={isLoadingTranslation}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                isLoadingTranslation
                  ? 'bg-gray-900 border-gray-850 text-gray-500 cursor-wait'
                  : isTranslated
                  ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee]'
                  : 'bg-gray-800/80 hover:bg-gray-700/80 border-transparent text-gray-300'
              }`}
            >
              {isLoadingTranslation ? 'מתרגם...' : isTranslated ? 'Original (EN)' : 'עברית (HE)'}
            </button>

            <button
              onClick={onClose}
              className="flex h-10 px-4 items-center gap-1 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all text-xs font-bold"
            >
              <X className="h-4 w-4" />
              Exit Workout
            </button>
          </div>

          {/* Mobile Outline drawer dropdown */}
          {isMobileOutlineOpen && (
            <div className="md:hidden p-3 rounded-2xl bg-gray-950 border border-gray-900 space-y-1 animate-fade-in">
              {routine.exerciseIds.map((exId, index) => {
                const ex = exercises.find((e) => e.id === exId);
                if (!ex) return null;
                const isActive = index === currentPlayerIndex;
                const isDone = index < currentPlayerIndex;
                return (
                  <button
                    key={`${exId}_player_mobile_${index}`}
                    onClick={() => {
                      setCurrentPlayerIndex(index);
                      setIsMobileOutlineOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left text-xs font-semibold border ${
                      isActive
                        ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee]'
                        : isDone
                        ? 'bg-emerald-950/5 border-emerald-950/10 text-emerald-500'
                        : 'bg-transparent border-transparent text-gray-500'
                    }`}
                  >
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[9px]">
                      {isDone ? '✓' : index + 1}
                    </span>
                    <span className="truncate">{ex.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Progress counter & Bar */}
          <div className="text-center space-y-2 shrink-0">
            <span className="inline-flex px-3.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Exercise {currentPlayerIndex + 1} of {routine.exerciseIds.length}
            </span>
            
            {/* Visual Segmented Progress Bar */}
            <div className="flex gap-1.5 max-w-md mx-auto h-1.5 pt-1">
              {routine.exerciseIds.map((_, index) => (
                <div
                  key={`progress_bar_segment_${index}`}
                  className={`flex-1 rounded-full h-full transition-all duration-300 ${
                    index === currentPlayerIndex
                      ? 'bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]'
                      : index < currentPlayerIndex
                      ? 'bg-emerald-500'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Center Panel Grid (Split on desktop: visual demo vs details) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
            
            {/* Visual Exercise Demonstration Column */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center bg-[#0d0f14] rounded-3xl p-4 border border-gray-900 min-h-[250px] lg:min-h-0 relative group">
              {playerExercise.images.map((imageName, index) => {
                const imageSrc = `${import.meta.env.BASE_URL}exercises/${imageName}`;
                return (
                  <img
                    key={`${imageName}_player_loop`}
                    src={imageSrc}
                    alt={`${playerExercise.name} step ${index + 1}`}
                    className={`absolute inset-4 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] mx-auto my-auto object-contain transition-opacity duration-300 ${
                      index === isPlayerImageToggle ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                );
              })}
              
              {/* Step visual indicator */}
              <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] uppercase font-bold tracking-wider text-cyan-400 border border-cyan-500/10">
                Step {isPlayerImageToggle + 1} of 2
              </div>
            </div>

            {/* Right Details Column (Tracker, Timer & Instructions) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              
              {/* Exercise Title card */}
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-900 space-y-1.5 shrink-0">
                <h3 
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`text-lg font-black text-white font-heading truncate leading-tight ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {activeName}
                </h3>
                <div className={`flex flex-wrap gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#06b6d4]/10 text-cyan-400 border border-[#06b6d4]/20 uppercase">
                    {playerExercise.equipment || 'No Gear'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                    {playerExercise.primaryMuscles[0]}
                  </span>
                </div>
              </div>

              {/* SET TRACKER CONTROLLER */}
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-900 shrink-0 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Sets Tracker</span>
                  <span className="text-white bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                    {completedSets} of {targetSets} Sets Done
                  </span>
                </div>

                {/* Visual Set Check Circles */}
                <div className="flex items-center gap-2.5 py-1">
                  {Array.from({ length: targetSets }).map((_, idx) => {
                    const isDone = idx < completedSets;
                    const isActive = idx === completedSets;
                    return (
                      <div
                        key={`player_set_dot_${idx}`}
                        className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isActive
                            ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-cyan-300 animate-pulse'
                            : 'bg-transparent border-gray-850 text-gray-600'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-black">Set {idx + 1}</span>
                        <div className="h-4.5 w-4.5 rounded-full border border-current flex items-center justify-center mt-1 text-xs font-black">
                          {isDone ? '✓' : idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Log and Sets config controls */}
                <div className="flex gap-2">
                  <select
                    value={targetSets}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTargetSets(val);
                      if (completedSets > val) setCompletedSets(val);
                    }}
                    className="bg-gray-900 border border-gray-850 text-xs font-bold text-gray-300 rounded-xl px-2 focus:outline-none shrink-0"
                  >
                    <option value={3}>3 Sets</option>
                    <option value={4}>4 Sets</option>
                    <option value={5}>5 Sets</option>
                  </select>

                  <button
                    onClick={handleLogSet}
                    disabled={completedSets === targetSets}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm ${
                      completedSets === targetSets
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completedSets === targetSets ? 'All Sets Complete!' : 'Log Completed Set'}
                  </button>
                </div>
              </div>

              {/* REST TIMER COMPONENT */}
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-900 shrink-0 space-y-3 relative overflow-hidden">
                {isResting && (
                  <div className="absolute inset-0 bg-[#06b6d4]/5 pointer-events-none animate-pulse" />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${isResting ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                      {isResting ? 'Resting Break' : 'Rest Timer'}
                    </span>
                  </div>
                  
                  <span className="font-heading text-xl font-black text-white tabular-nums">
                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {isResting && (
                  <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full transition-all duration-1000"
                      style={{ width: `${(timerSeconds / targetRestTime) * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex border border-gray-850 rounded-xl overflow-hidden shrink-0">
                    <button
                      onClick={() => adjustRestTime(-15)}
                      className="px-2.5 py-1.5 bg-gray-900 text-[10px] font-bold text-gray-400 hover:text-white border-r border-gray-850"
                    >
                      -15s
                    </button>
                    <button
                      onClick={() => adjustRestTime(15)}
                      className="px-2.5 py-1.5 bg-gray-900 text-[10px] font-bold text-gray-400 hover:text-white"
                    >
                      +15s
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsTimerRunning(!isTimerRunning);
                      if (!isResting) setIsResting(true);
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      isTimerRunning
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    }`}
                  >
                    {isTimerRunning ? 'Pause Break' : isResting ? 'Resume Break' : 'Start Rest Break'}
                  </button>

                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setIsResting(false);
                      setTimerSeconds(targetRestTime);
                    }}
                    className="p-1.5 rounded-xl bg-gray-900 border border-gray-850 text-gray-400 hover:text-white"
                    title="Skip/Reset break"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable instructions details */}
              <div className="flex-1 min-h-[120px] p-4 rounded-2xl bg-gray-950 border border-gray-900 overflow-y-auto space-y-2.5">
                <div 
                  className={`flex items-center gap-2 text-white border-b border-gray-900 pb-1.5 ${
                    isRtl ? 'flex-row-reverse' : ''
                  }`}
                >
                  <AlignLeft className="h-4 w-4 text-cyan-400" />
                  <h4 className={`font-heading text-xs font-bold flex-1 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                    {isRtl ? 'הוראות ביצוע' : 'Instructions'}
                  </h4>
                </div>
                <ol className="space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
                  {activeInstructions.map((step, idx) => (
                    <li 
                      key={`player_step_${idx}`} 
                      className={`flex gap-2.5 text-gray-300 text-xs leading-relaxed ${
                        isRtl ? 'flex-row-reverse text-right' : 'text-left'
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </div>

          {/* Navigation Footer Bar inside center workspace */}
          <div className="border-t border-gray-900 pt-4 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (currentPlayerIndex > 0) {
                  setCurrentPlayerIndex(currentPlayerIndex - 1);
                }
              }}
              disabled={currentPlayerIndex === 0}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                currentPlayerIndex === 0
                  ? 'border-gray-900 text-gray-700 bg-gray-950 cursor-not-allowed'
                  : 'bg-gray-900 border-gray-800 text-white hover:border-gray-700'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentPlayerIndex < routine.exerciseIds.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentPlayerIndex(currentPlayerIndex + 1);
                }}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-black font-bold text-xs transition-colors"
              >
                Next Exercise
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  alert("Workout Complete! Excellent job training today! 🎉");
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors"
              >
                Finish Workout 🎉
              </button>
            )}
          </div>

        </main>
      </div>

    </div>
  );
};
