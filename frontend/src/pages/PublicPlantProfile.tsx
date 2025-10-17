import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPlantProfile, PublicPlantProfile as ProfileData } from '../services/publicApi';
import PlantProfileHero from '../components/PlantProfile/PlantProfileHero';
import CareDetailsPanel from '../components/PlantProfile/CareDetailsPanel';
import HealthStatsCard from '../components/PlantProfile/HealthStatsCard';
import SocialInteractionZone from '../components/PlantProfile/SocialInteractionZone';

const PublicPlantProfile = () => {
  const { username, plantSlug } = useParams<{ username: string; plantSlug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user from auth storage
  const getCurrentUserId = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        return state?.user?.id;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  };

  const isAuthenticated = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        return !!state?.token;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
    return false;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || !plantSlug) {
        setError('Invalid profile URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPublicPlantProfile(username, plantSlug);
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching plant profile:', err);
        setError(err.response?.data?.error || 'Failed to load plant profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, plantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Plant Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This plant profile does not exist.'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/u/${username}/${plantSlug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-1.5 sm:gap-2">
              <img src="/SproutSync_logo.png" alt="SproutSync" className="h-6 sm:h-8" />
              <span className="text-base sm:text-xl font-bold text-green-700">SproutSync</span>
            </a>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
              <img
                src={profile.owner.avatarUrl || '/plant.png'}
                alt={profile.owner.name || 'User'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
              />
              <span className="text-xs sm:text-sm md:text-base font-medium truncate max-w-[120px] sm:max-w-none">
                {profile.owner.name}'s Plant
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Hero and Details Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Hero Section */}
            <PlantProfileHero
              plant={profile.plant}
              badge={profile.badge}
              careStreak={profile.careStreak}
            />

            {/* Right: Care Details and Health Stats Stacked */}
            <div className="space-y-4 sm:space-y-6">
              <CareDetailsPanel
                tasks={profile.tasks}
                sunRequirements={profile.plant.sunRequirements}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <HealthStatsCard
                  healthScore={profile.healthScore}
                  daysThriving={profile.daysThriving}
                />
              </div>
            </div>
          </div>

          {/* Social Interaction Zone */}
          <SocialInteractionZone
            plantId={profile.plant.id}
            initialAppreciations={profile.appreciations}
            initialComments={profile.comments}
            profileUrl={profileUrl}
            isAuthenticated={isAuthenticated()}
            currentUserId={getCurrentUserId()}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>
            Create your own plant profile on{' '}
            <a href="/" className="text-green-600 font-semibold hover:text-green-700">
              SproutSync
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicPlantProfile;

