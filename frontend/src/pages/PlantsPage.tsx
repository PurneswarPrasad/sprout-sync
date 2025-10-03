import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { SearchFilter } from '../components/SearchFilter';
import { AddPlantSection } from '../components/AddPlantSection';
import { PlantStats } from '../components/PlantStats';
import { PlantGrid } from '../components/PlantGrid';
import { GiftedPlantsSection, GiftedPlantsSectionRef } from '../components/GiftedPlantsSection';
import { authAPI } from '../services/api';

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
  const [plants, setPlants] = useState<Plant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'your-plants' | 'gifted-plants'>('your-plants');
  const giftedPlantsRef = useRef<GiftedPlantsSectionRef>(null);

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
    try {
      const response = await plantsAPI.getAll();
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };



  const filteredPlants = plants.filter(plant =>
    getPlantDisplayName(plant).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plant.type && plant.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );


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

      // Remove from gifted plants if it was there
      if (giftedPlantsRef.current) {
        giftedPlantsRef.current.removePlant(deleteDialog.plantId);
      }

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Plants</h1>
          <p className="text-gray-600">Manage your plant collection</p>
        </div>

        {/* Search and Filter */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Add Plant Options */}
        <AddPlantSection />

        {/* Plants Grid */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('your-plants')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'your-plants'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Your Plants
            </button>
            <button
              onClick={() => setActiveTab('gifted-plants')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'gifted-plants'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gifted Plants
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'your-plants' ? (
            <>
              <PlantStats
                user={user}
                plantCount={filteredPlants.length}
              />
              <PlantGrid
                plants={filteredPlants}
                searchTerm={searchTerm}
                onDeletePlant={openDeleteDialog}
              />
            </>
          ) : (
            <GiftedPlantsSection 
              ref={giftedPlantsRef}
              onDeletePlant={openDeleteDialog} 
              userName={user?.name || undefined}
            />
          )}
        </div>
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
    </Layout>
  );
}

