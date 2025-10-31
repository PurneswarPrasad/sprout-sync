// Tutorial utility functions for managing user onboarding
import { tutorialAPI } from '../services/api';

export type TutorialStep = 
  | 'tutorial-intro'
  | 'homepage-add-button'
  | 'modal-camera-id'
  | 'ai-camera-area'
  | 'add-plant-basic-info'
  | 'add-plant-care-info'
  | 'add-plant-tasks';

interface TutorialState {
  completedSteps: TutorialStep[];
  skippedSteps: TutorialStep[];
  hasCompletedTutorial: boolean;
}

// Local cache for better performance (in-memory only)
let cachedState: TutorialState | null = null;

// Get tutorial state from cache or API
export const getTutorialState = async (): Promise<TutorialState> => {
  // Return cached state if available
  if (cachedState) {
    return cachedState;
  }

  // Try to get from API
  try {
    const response = await tutorialAPI.getState();
    if (response.data.success) {
      const state: TutorialState = {
        completedSteps: response.data.data.completedSteps || [],
        skippedSteps: response.data.data.skippedSteps || [],
        hasCompletedTutorial: response.data.data.hasCompletedTutorial || false,
      };
      cachedState = state;
      return state;
    }
  } catch (error) {
    console.error('Failed to fetch tutorial state from API:', error);
  }

  // Fallback to default state
  const defaultState: TutorialState = {
    completedSteps: [],
    skippedSteps: [],
    hasCompletedTutorial: false,
  };
  cachedState = defaultState;
  return defaultState;
};

// Get tutorial state synchronously from cache only
export const getTutorialStateSync = (): TutorialState => {
  if (cachedState) {
    return cachedState;
  }
  
  return {
    completedSteps: [],
    skippedSteps: [],
    hasCompletedTutorial: false,
  };
};

// Save tutorial state to API
const saveTutorialState = async (state: TutorialState): Promise<void> => {
  cachedState = state;
  
  try {
    await tutorialAPI.updateState({
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
      hasCompletedTutorial: state.hasCompletedTutorial,
    });
  } catch (error) {
    console.error('Failed to save tutorial state to API:', error);
  }
};

// Initialize tutorial state from API
export const initTutorialState = async (): Promise<void> => {
  await getTutorialState();
};

// Check if a step has been completed or skipped (sync)
export const isStepDismissed = (step: TutorialStep): boolean => {
  const state = getTutorialStateSync();
  return state.completedSteps.includes(step) || state.skippedSteps.includes(step);
};

// Check if the entire tutorial has been completed (sync)
export const hasTutorialCompleted = (): boolean => {
  const state = getTutorialStateSync();
  return state.hasCompletedTutorial;
};

// Mark a step as completed
export const markStepCompleted = async (step: TutorialStep): Promise<void> => {
  const state = getTutorialStateSync();
  
  if (!state.completedSteps.includes(step)) {
    state.completedSteps.push(step);
    await saveTutorialState(state);
  }
};

// Mark a step as skipped
export const markStepSkipped = async (step: TutorialStep): Promise<void> => {
  const state = getTutorialStateSync();
  
  if (!state.skippedSteps.includes(step)) {
    state.skippedSteps.push(step);
    await saveTutorialState(state);
  }
};

// Mark the entire tutorial as completed
export const markTutorialCompleted = async (): Promise<void> => {
  const state = getTutorialStateSync();
  state.hasCompletedTutorial = true;
  await saveTutorialState(state);
  
  // Also call the complete endpoint for backend tracking
  try {
    await tutorialAPI.complete();
  } catch (error) {
    console.error('Failed to mark tutorial as completed on API:', error);
  }
};

// Check if user should see tutorial (first time user)
export const shouldShowTutorial = (): boolean => {
  return !hasTutorialCompleted();
};

// Get the next step in the tutorial sequence
export const getNextTutorialStep = (): TutorialStep | null => {
  const allSteps: TutorialStep[] = [
    'tutorial-intro',
    'homepage-add-button',
    'modal-camera-id',
    'ai-camera-area',
    'add-plant-basic-info',
    'add-plant-care-info',
    'add-plant-tasks',
  ];
  
  const state = getTutorialStateSync();
  
  for (const step of allSteps) {
    if (!state.completedSteps.includes(step) && !state.skippedSteps.includes(step)) {
      return step;
    }
  }
  
  return null;
};

