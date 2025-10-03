import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Copy } from 'lucide-react';
import { plantsAPI } from '../services/api';

interface Plant {
  id: string;
  petName: string | null;
  botanicalName: string | null;
  commonName: string | null;
  type: string | null;
  acquisitionDate: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  isGifted: boolean;
  tasks: any[];
  tags: any[];
  photos: PlantPhoto[];
  gift?: {
    id: string;
    giftToken: string;
    status: string;
    receiver?: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  _count: {
    notes: number;
    photos: number;
  };
}

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
}

interface GiftedPlantsSectionProps {
  onDeletePlant: (plantId: string, plantName: string) => void;
  userName?: string;
}

export interface GiftedPlantsSectionRef {
  removePlant: (plantId: string) => void;
}

// Helper function to get display name for plant
const getPlantDisplayName = (plant: Plant): string => {
  if (plant.petName && plant.commonName) {
    return `${plant.petName} (${plant.commonName})`;
  } else if (plant.petName) {
    return plant.petName;
  } else if (plant.commonName) {
    return plant.commonName;
  } else if (plant.botanicalName) {
    return plant.botanicalName;
  } else {
    return 'Unknown Plant';
  }
};

export const GiftedPlantsSection = forwardRef<GiftedPlantsSectionRef, GiftedPlantsSectionProps>(({ onDeletePlant, userName }, ref) => {
  const [giftedPlants, setGiftedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchGiftedPlants = async () => {
    setLoading(true);
    try {
      const response = await plantsAPI.getGifted();
      setGiftedPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching gifted plants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftedPlants();
  }, []);

  useImperativeHandle(ref, () => ({
    removePlant: (plantId: string) => {
      setGiftedPlants(prev => prev.filter(plant => plant.id !== plantId));
    }
  }));

  const handleCopyGiftLink = async (plant: Plant) => {
    if (!plant.gift?.giftToken) return;

    // Use environment variable for base URL, fallback to window.location.origin for development
    const baseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin;
    const giftUrl = `${baseUrl}/accept-gift/${plant.gift.giftToken}`;
    const shareText = `Here is my ${getPlantDisplayName(plant)} for you to care for in the SproutSync app. Follow the link to accept this gift: ${giftUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedToken(plant.gift.giftToken);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy gift link: ', err);
    }
  };

  const handleDeletePlant = (plantId: string, plantName: string) => {
    // Just call the parent's delete handler - don't remove from state yet
    onDeletePlant(plantId, plantName);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading gifted plants...</p>
      </div>
    );
  }

  // Dynamic greeting message
  const getGreetingMessage = () => {
    if (!userName) return "Your gifted plants";
    
    if (giftedPlants.length === 0) {
      return `Hi ${userName}, you haven't gifted any plants yet!`;
    } else if (giftedPlants.length === 1) {
      return `Hi ${userName}, you have gifted 1 plant`;
    } else {
      return `Hi ${userName}, you have gifted ${giftedPlants.length} plants`;
    }
  };

  if (giftedPlants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {getGreetingMessage()}
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No gifted plants yet</h3>
          <p className="text-gray-500">Plants you gift to others will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {getGreetingMessage()}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {giftedPlants.map((plant) => (
        <div key={plant.id} className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            {plant.photos && plant.photos.length > 0 ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={plant.photos[0].secureUrl}
                  alt={getPlantDisplayName(plant)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {getPlantDisplayName(plant)}
                </h3>
                {plant.gift?.status === 'PENDING' && plant.gift?.giftToken && (
                  <button
                    onClick={() => handleCopyGiftLink(plant)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors group relative"
                    title="Copy gift link"
                  >
                    <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    {copiedToken === plant.gift?.giftToken && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Gifted to {plant.gift?.receiver?.name || plant.gift?.receiver?.email || 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>Status: {plant.gift?.status || 'Unknown'}</span>
            <span>{new Date(plant.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDeletePlant(plant.id, getPlantDisplayName(plant))}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Delete Permanently
            </button>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
});
