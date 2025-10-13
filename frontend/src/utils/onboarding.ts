// Onboarding utility functions for user ID generation and Google Sheets tracking

export interface OnboardingData {
  userId: string;
  plantExperience: string;
  plantLocation: string[];
  plantGoals: string[];
  timeCommitment: string;
  lightCondition: string;
  petsOrKids: string;
  avoidPreferences: string[];
  appFeatures: string[];
  timestamp: string;
}

// Generate a UUID v4
export const generateUserId = (): string => {
  return crypto.randomUUID();
};

// Get existing user ID or create a new one
export const getOrCreateUserId = (): string => {
  const storageKey = 'onboarding-user-id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
};

// Check if user has already submitted onboarding
export const hasSubmittedOnboarding = (): boolean => {
  const storageKey = 'onboarding-submitted';
  return localStorage.getItem(storageKey) === 'true';
};

// Mark onboarding as submitted
export const markOnboardingAsSubmitted = (): void => {
  const storageKey = 'onboarding-submitted';
  localStorage.setItem(storageKey, 'true');
};

// Submit onboarding data to Google Sheets
export const submitOnboardingData = async (data: Partial<OnboardingData>): Promise<void> => {
  // Check if user has already submitted
  if (hasSubmittedOnboarding()) {
    console.log('Onboarding already submitted for this user. Skipping duplicate submission.');
    return;
  }

  // Mark as submitted immediately to prevent race conditions
  markOnboardingAsSubmitted();

  // Check if user is already authenticated - if so, use their email instead of random ID
  let userId = getOrCreateUserId();
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      const token = authData?.state?.token;
      
      if (token) {
        // Decode JWT to get user email
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          userId = payload.email;
          console.log('User is authenticated, using email:', userId);
        }
      }
    }
  } catch (error) {
    console.log('Could not get authenticated user, using temporary user ID');
  }

  const timestamp = new Date().toISOString();
  
  const payload = {
    userId,
    plantExperience: data.plantExperience || '',
    plantLocation: data.plantLocation || [],
    plantGoals: data.plantGoals || [],
    timeCommitment: data.timeCommitment || '',
    lightCondition: data.lightCondition || '',
    petsOrKids: data.petsOrKids || '',
    avoidPreferences: data.avoidPreferences || [],
    appFeatures: data.appFeatures || [],
    timestamp
  };

  try {
    await fetch(
      'https://script.google.com/macros/s/AKfycbw0d_fZQSd2PT471-nl92WGgCLrM6Kr2mrXNaZuWRf4CAfemcMUzDxZvTHjsbaVD0_6/exec',
      {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      }
    );

    console.log('Onboarding data submitted successfully:', payload);
  } catch (error) {
    // Silent fail - log error but don't block user flow
    console.error('Failed to submit onboarding data:', error);
  }
};

// Update user ID in Google Sheets after successful authentication
export const updateUserIdInSheet = async (newUserId: string): Promise<void> => {
  const oldUserId = getOrCreateUserId(); // the temp one stored earlier

  const payload = {
    action: 'updateUserId', // this is the action that tells the script what to do with the google sheet
    oldUserId,
    newUserId,
  };

  try {
    await fetch(
      'https://script.google.com/macros/s/AKfycbw0d_fZQSd2PT471-nl92WGgCLrM6Kr2mrXNaZuWRf4CAfemcMUzDxZvTHjsbaVD0_6/exec',
      {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      }
    );
    
    console.log('User ID updated successfully in Google Sheets:', { oldUserId, newUserId });
  } catch (error) {
    // Silent fail - log error but don't block user flow
    console.error('Failed to update user ID in Google Sheets:', error);
  }
};

// Clear onboarding user ID and submission flag (useful for testing or reset)
export const clearOnboardingUserId = (): void => {
  localStorage.removeItem('onboarding-user-id');
  localStorage.removeItem('onboarding-submitted');
};
