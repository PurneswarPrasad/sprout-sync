// Onboarding utility functions for user ID generation and Google Sheets tracking

export interface OnboardingData {
  userId: string;
  plantLocation: string[];
  helpWith: string[];
  interestLevel: string;
  skillLevel: string;
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

// Submit onboarding data to Google Sheets
export const submitOnboardingData = async (data: Partial<OnboardingData>): Promise<void> => {
  const userId = getOrCreateUserId();
  const timestamp = new Date().toISOString();
  
  const payload = {
    userId,
    plantLocation: data.plantLocation || [],
    helpWith: data.helpWith || [],
    interestLevel: data.interestLevel || '',
    skillLevel: data.skillLevel || '',
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

// Clear onboarding user ID (useful for testing or reset)
export const clearOnboardingUserId = (): void => {
  localStorage.removeItem('onboarding-user-id');
};
