import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicGardenProfile, PublicGardenProfile as GardenProfileData } from '../services/publicApi';
import GardenSocialInteractionZone from '../components/GardenProfile/GardenSocialInteractionZone';
import PlantCatalogCard from '../components/GardenProfile/PlantCatalogCard';

const PublicGardenProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<GardenProfileData | null>(null);
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
      if (!username) {
        setError('Invalid garden URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPublicGardenProfile(username);
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching garden profile:', err);
        setError(err.response?.data?.error || 'Failed to load garden profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading garden...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Garden Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This garden profile does not exist.'}</p>
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

  const profileUrl = `${window.location.origin}/${username}/garden`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
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
                {profile.owner.name}'s Garden
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Garden Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {profile.owner.name}'s Garden
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {profile.plants.length} {profile.plants.length === 1 ? 'Plant' : 'Plants'}
            </p>
          </div>

          {/* Plant Catalog */}
          {profile.plants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {profile.plants.map((plant) => (
                <PlantCatalogCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-600 text-lg">No plants in this garden yet</p>
            </div>
          )}

          {/* Social Interaction Zone */}
          <GardenSocialInteractionZone
            gardenOwnerId={profile.owner.id}
            initialAppreciations={profile.appreciations}
            initialComments={profile.comments}
            profileUrl={profileUrl}
            isAuthenticated={isAuthenticated()}
            currentUserId={getCurrentUserId()}
            ownerName={profile.owner.name}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>
            Create your own garden on{' '}
            <a href="/" className="text-green-600 font-semibold hover:text-green-700">
              SproutSync
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicGardenProfile;



