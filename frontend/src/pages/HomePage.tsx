import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

interface PlantTask {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  lastCompletedOn: string | null;
  active: boolean;
}

interface Plant {
  id: string;
  name: string;
  type: string | null;
  acquisitionDate: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: PlantTask[];
  tags: any[];
  _count: {
    notes: number;
    photos: number;
  };
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPlants();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3001/auth/profile', {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Authentication required');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/plants', {
        withCredentials: true,
      });
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
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

  // Calculate dashboard stats
  const totalPlants = plants.length;
  const activeTasks = plants.reduce((total, plant) => total + plant.tasks.filter(task => task.active).length, 0);
  const overdueTasks = plants.reduce((total, plant) => {
    const overdue = plant.tasks.filter(task => {
      const now = new Date();
      const nextDue = new Date(task.nextDueOn);
      return nextDue < now && task.active;
    });
    return total + overdue.length;
  }, 0);
  const completedTasks = plants.reduce((total, plant) => {
    const completed = plant.tasks.filter(task => task.lastCompletedOn !== null);
    return total + completed.length;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Garden Dashboard
          </h2>
          <p className="text-gray-600">
            Track your plants, manage care tasks, and watch your garden flourish
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Plants</p>
                <p className="text-3xl font-bold text-emerald-600">{totalPlants}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-3xl font-bold text-blue-600">{activeTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueTasks}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plants Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Your Plants</h3>
              <button 
                onClick={() => setShowAddPlantModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200"
              >
                Add Plant
              </button>
            </div>
            
            {plants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <p className="text-gray-600 mb-4">No plants yet</p>
                <p className="text-sm text-gray-500">
                  Start by adding your first plant to begin your care journey
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {plants.map((plant) => {
                  const health = getPlantHealth(plant);
                  const activeTasks = plant.tasks.filter(task => task.active);
                  
                  return (
                    <div 
                      key={plant.id} 
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/plants/${plant.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <span className="text-xl">🌿</span>
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 ${health.color} rounded-full`}></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{plant.name}</h4>
                            <p className="text-sm text-gray-600">{plant.type || 'Unknown type'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {activeTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Active Tasks:</p>
                          <div className="flex flex-wrap gap-2">
                            {activeTasks.slice(0, 3).map((task) => {
                              const status = getTaskStatus(task);
                              return (
                                <div key={task.id} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                  <span className="text-xs">{getTaskIcon(task.taskKey)}</span>
                                  <span className={`text-xs ${status.color}`}>{status.text}</span>
                                </div>
                              );
                            })}
                            {activeTasks.length > 3 && (
                              <span className="text-xs text-gray-500">+{activeTasks.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Today's Tasks</h3>
              <button 
                onClick={() => navigate('/calendar')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                View All
              </button>
            </div>
            
            {activeTasks === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-gray-600 mb-4">No tasks for today</p>
                <p className="text-sm text-gray-500">
                  Add plants to start receiving care reminders
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {plants.flatMap(plant => 
                  plant.tasks
                    .filter(task => task.active)
                    .map(task => {
                      const status = getTaskStatus(task);
                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTaskIcon(task.taskKey)}</span>
                            <div>
                              <p className="font-medium text-gray-800">{task.taskKey}</p>
                              <p className="text-sm text-gray-600">{plant.name}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      );
                    })
                ).slice(0, 5)}
              </div>
            )}
          </div>
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
    </Layout>
  );
};

export default HomePage;