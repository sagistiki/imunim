export interface Exercise {
  id: string;
  name: string;
  force: 'pull' | 'push' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: number;
}

export type FocusArea = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'core';
