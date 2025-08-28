import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Plus, Camera, Leaf, Clock, CheckCircle, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';

interface Plant {
  id: string;
  name: string;
  type: string | null;
  acquisitionDate: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: PlantTask[];
  tags: PlantTag[];
  _count: {
    notes: number;
    photos: number;
  };
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

export function PlantsPage() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  
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

  const fetchPlants = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/plants', {
        withCredentials: true,
      });
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: PlantTask) => {
    const now = new Date();
    const nextDue = new Date(task.nextDueOn);
    const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
    } else if (daysUntilDue <= 2) {
      return { status: 'due-soon', text: `Due in ${daysUntilDue} days`, color: 'text-yellow-600' };
    } else {
      return { status: 'upcoming', text: `Due in ${daysUntilDue} days`, color: 'text-gray-600' };
    }
  };

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return '💧';
      case 'fertilizing':
        return '🌱';
      case 'pruning':
        return '✂️';
      case 'spraying':
        return '💨';
      case 'sunlightRotation':
        return '☀️';
      default:
        return '📋';
    }
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      await axios.delete(`http://localhost:3001/api/plants/${deleteDialog.plantId}`, {
        withCredentials: true,
      });

      // Remove the plant from the local state
      setPlants(prev => prev.filter(plant => plant.id !== deleteDialog.plantId));
      
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert('Failed to delete plant. Please try again.');
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getPlantHealth = (plant: Plant) => {
    const overdueTasks = plant.tasks.filter(task => {
      const now = new Date();
      const nextDue = new Date(task.nextDueOn);
      return nextDue < now && task.active;
    });

    if (overdueTasks.length > 0) {
      return { status: 'needs-care', color: 'bg-yellow-500' };
    }
    return { status: 'healthy', color: 'bg-green-500' };
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Plants</h1>
            <p className="text-gray-600">Manage your plant collection</p>
          </div>
          <button 
            onClick={() => navigate('/add-plant')}
            className="plant-button flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plants..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Add Plant Options */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Plant</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setShowAddPlantModal(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
            >
              <Camera className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-medium text-gray-800">Camera ID</span>
              <span className="text-sm text-gray-600">AI-powered</span>
            </button>
            <button 
              onClick={() => navigate('/add-plant')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
            >
              <Leaf className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-medium text-gray-800">Manual Entry</span>
              <span className="text-sm text-gray-600">Custom details</span>
            </button>
          </div>
        </div>

        {/* Plants Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Your Plants ({filteredPlants.length})</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>All Plants</option>
              <option>Healthy</option>
              <option>Needs Care</option>
            </select>
          </div>

          {filteredPlants.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No plants found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first plant!'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => navigate('/add-plant')}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Add Your First Plant
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlants.map((plant) => {
                const health = getPlantHealth(plant);
                const activeTasks = plant.tasks.filter(task => task.active);
                
                return (
                  <div key={plant.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 hover:scale-105 transition-transform duration-200">
                    <div className="relative mb-3">
                      <div className="w-full h-32 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className={`absolute top-2 right-2 w-3 h-3 ${health.color} rounded-full`}></div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(plant.id, plant.name);
                        }}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500"
                        title="Delete plant"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{plant.name}</h3>
                        <p className="text-sm text-gray-600">{plant.type || 'Unknown type'}</p>
                      </div>
                      
                      {/* Tags */}
                      {plant.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plant.tags.map((plantTag) => (
                            <span
                              key={plantTag.tag.id}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                            >
                              {plantTag.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Tasks */}
                      {activeTasks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Active Tasks</h4>
                          {activeTasks.slice(0, 3).map((task) => {
                            const status = getTaskStatus(task);
                            return (
                              <div key={task.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{getTaskIcon(task.taskKey)}</span>
                                  <span className="text-gray-600">{task.taskKey}</span>
                                </div>
                                <span className={status.color}>{status.text}</span>
                              </div>
                            );
                          })}
                          {activeTasks.length > 3 && (
                            <p className="text-xs text-gray-500">+{activeTasks.length - 3} more tasks</p>
                          )}
                        </div>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <span>{plant._count.notes} notes</span>
                          <span>{plant._count.photos} photos</span>
                        </div>
                        <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

