import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { SearchFilter } from '../components/SearchFilter';
import { PlantGrid } from '../components/PlantGrid';
import { ShareGardenLinkDialog } from '../components/ShareGardenLinkDialog';
import { Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

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
  tasks: PlantTask[];
  tags: PlantTag[];
  photos: PlantPhoto[];
  isGifted?: boolean;
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
  petFriendliness?: {
    isFriendly: boolean;
    reason: string;
  };
  commonPestsAndDiseases?: string;
  preventiveMeasures?: string;
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

interface PlantTask {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  lastCompletedOn: string | null;
  active: boolean;
}

interface PlantTag {
  tag: {
    id: string;
    name: string;
    colorHex: string | null;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  username?: string;
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

export function PlantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuthStore();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [giftedPlants, setGiftedPlants] = useState<Plant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'your-plants' | 'gifted-plants'>('all');
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    plantId: string | null;
    plantName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    plantId: null,
    plantName: '',
    isLoading: false,
  });

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.profile();
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Refresh plants when navigating from AddPlantPage
  useEffect(() => {
    if (location.state?.plantCreated) {
      fetchPlants();
      // Clear the state to prevent re-fetching
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const [yourPlantsResponse, giftedPlantsResponse] = await Promise.all([
        plantsAPI.getAll(),
        plantsAPI.getGifted(),
      ]);

      const yourPlants: Plant[] = (yourPlantsResponse.data.data || []).map((plant: Plant) => ({
        ...plant,
        isGifted: false,
      }));

      const gifted: Plant[] = (giftedPlantsResponse.data.data || []).map((plant: Plant) => ({
        ...plant,
        isGifted: true,
      }));

      setPlants(yourPlants);
      setGiftedPlants(gifted);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const combinedPlants = useMemo(() => {
    switch (activeFilter) {
      case 'your-plants':
        return plants;
      case 'gifted-plants':
        return giftedPlants;
      default:
        return [...plants, ...giftedPlants];
    }
  }, [activeFilter, plants, giftedPlants]);

  const filteredPlants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return combinedPlants;

    return combinedPlants.filter((plant) => {
      const nameMatches = getPlantDisplayName(plant).toLowerCase().includes(term);
      const typeMatches = plant.type?.toLowerCase().includes(term);
      return Boolean(nameMatches || typeMatches);
    });
  }, [combinedPlants, searchTerm]);

  const ownedCount = plants.length;
  const giftedCount = giftedPlants.length;

  const greetingMessage = useMemo(() => {
    const name = (user?.name?.split(' ')[0]) || 'there';

    if (activeFilter === 'your-plants') {
      if (ownedCount === 0) {
        return `Hi ${name}, your garden is ready for its first plant!`;
      }
      return `Hi ${name}, your garden has ${ownedCount === 1 ? '1 plant' : `${ownedCount} plants`}`;
    }

    if (activeFilter === 'gifted-plants') {
      if (giftedCount === 0) {
        return `Hi ${name}, you haven't gifted any plants yet!`;
      }
      return `Hi ${name}, you have gifted ${giftedCount === 1 ? '1 plant' : `${giftedCount} plants`}`;
    }

    return `Welcome to your garden, ${name}!`;
  }, [user, activeFilter, ownedCount, giftedCount]);


  // Delete plant functions
  const openDeleteDialog = (plantId: string, plantName: string) => {
    setDeleteDialog({
      isOpen: true,
      plantId,
      plantName,
      isLoading: false,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      plantId: null,
      plantName: '',
      isLoading: false,
    });
  };

  const handleDeletePlant = async () => {
    if (!deleteDialog.plantId) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await plantsAPI.delete(deleteDialog.plantId);

      // Remove the plant from the local state
      setPlants(prev => prev.filter(plant => plant.id !== deleteDialog.plantId));

      setGiftedPlants(prev => prev.filter(plant => plant.id !== deleteDialog.plantId));

      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert('Failed to delete plant. Please try again.');
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your plants...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold text-gray-700">
              {greetingMessage}
            </p>
            {(authUser?.username || user?.username) && (
              <button
                onClick={() => setShowShareDialog(true)}
                className="p-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors"
                title="Share your garden"
              >
                <LinkIcon className="w-4 h-4 text-emerald-600" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">Manage your plant collection</p>
        </div>

        {/* Search and Filter */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={activeFilter}
          onFilterChange={(value) => setActiveFilter(value)}
        />

        {/* Plants Grid */}
        <PlantGrid
          plants={filteredPlants}
          searchTerm={searchTerm}
          onDeletePlant={openDeleteDialog}
          onAddPlant={() => setShowAddPlantModal(true)}
          emptyHeading={activeFilter === 'gifted-plants' ? 'No plants gifted yet' : undefined}
          emptyDescription={activeFilter === 'gifted-plants' ? 'To gift a plant, click on the plant and make someone happy!' : undefined}
        />
      </div>

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={showAddPlantModal}
        onClose={() => setShowAddPlantModal(false)}
        onManualEntry={() => {
          setShowAddPlantModal(false);
          navigate('/add-plant');
        }}
        onCameraID={() => {
          setShowAddPlantModal(false);
          navigate('/ai-identification');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePlant}
        title="Delete Plant"
        message={`Are you sure you want to delete "${deleteDialog.plantName}"? It will be permanently deleted!`}
        confirmText="Delete Plant"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
      />

      {/* Share Garden Link Dialog */}
      {(authUser?.username || user?.username) && (
        <ShareGardenLinkDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          gardenUrl={`${window.location.origin}/${authUser?.username || user?.username}/garden`}
          username={authUser?.username || user?.username || ''}
        />
      )}
    </Layout>
  );
}

