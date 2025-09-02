import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Scissors, Sun, Leaf, Edit, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { plantsAPI } from '../services/api';

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

export function PlantDetailPage() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'care' | 'health' | 'about'>('care');

  useEffect(() => {
    if (plantId) {
      fetchPlant();
    }
  }, [plantId]);

  const fetchPlant = async () => {
    try {
      const response = await plantsAPI.getById(plantId!);
      setPlant(response.data.data);
    } catch (error) {
      console.error('Error fetching plant:', error);
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
    } else if (daysUntilDue === 0) {
      return { status: 'due-today', text: 'Next: Today', color: 'text-blue-600' };
    } else if (daysUntilDue === 1) {
      return { status: 'due-tomorrow', text: 'Next: Tomorrow', color: 'text-yellow-600' };
    } else {
      return { status: 'upcoming', text: `Next: in ${daysUntilDue} days`, color: 'text-gray-600' };
    }
  };

  const getFrequencyText = (frequencyDays: number) => {
    if (frequencyDays === 1) return 'Every day';
    if (frequencyDays === 2) return 'Every 2 days';
    if (frequencyDays === 7) return 'Every week';
    if (frequencyDays === 14) return 'Every 2 weeks';
    if (frequencyDays === 30) return 'Every month';
    if (frequencyDays === 90) return 'Every 3 months';
    if (frequencyDays === 180) return 'Every 6 months';
    if (frequencyDays === 365) return 'Every year';
    if (frequencyDays === 540) return 'Every 18 months';
    return `Every ${frequencyDays} days`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plant details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-gray-600 mb-2">Plant not found</p>
            <button 
              onClick={() => navigate('/plants')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Plants
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{plant.name}</h1>
              <p className="text-emerald-600">{plant.type || 'Unknown type'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('care')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'care'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Care
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'health'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Health
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'care' && (
          <div className="space-y-6">
                         {/* Care Tasks Grid */}
             {/* Care Tasks Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
               {/* Water */}
               <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                     <Droplets className="w-5 h-5 text-blue-600" />
                   </div>
                   <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                     <Edit className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>
                 <h3 className="font-semibold text-gray-800 mb-1">Water</h3>
                 <p className="text-sm text-gray-600 mb-2">
                   {plant.tasks.find(t => t.taskKey === 'watering') ? 
                     getFrequencyText(plant.tasks.find(t => t.taskKey === 'watering')!.frequencyDays) : 
                     'Not configured'
                   }
                 </p>
                 <p className="text-sm text-gray-600">
                   {(() => {
                     const waterTask = plant.tasks.find(t => t.taskKey === 'watering');
                     if (!waterTask) return 'Not configured';
                     if (waterTask.lastCompletedOn !== null) return (
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm text-green-600 font-medium">Done</span>
                         </div>
                       );
                     
                     const now = new Date();
                     const nextDue = new Date(waterTask.nextDueOn);
                     const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (daysUntilDue < 0) return 'Overdue';
                     if (daysUntilDue === 0) return 'Today';
                     if (daysUntilDue === 1) return 'Tomorrow';
                     return `In ${daysUntilDue} days`;
                   })()}
                 </p>
               </div>

               {/* Fertilize */}
               <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                     <Leaf className="w-5 h-5 text-green-600" />
                   </div>
                   <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                     <Edit className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>
                 <h3 className="font-semibold text-gray-800 mb-1">Fertilize</h3>
                 <p className="text-sm text-gray-600 mb-2">
                   {plant.tasks.find(t => t.taskKey === 'fertilizing') ? 
                     getFrequencyText(plant.tasks.find(t => t.taskKey === 'fertilizing')!.frequencyDays) : 
                     'Not configured'
                   }
                 </p>
                 <p className="text-sm text-gray-600">
                   {(() => {
                     const fertilizeTask = plant.tasks.find(t => t.taskKey === 'fertilizing');
                     if (!fertilizeTask) return 'Not configured';
                     if (fertilizeTask.lastCompletedOn !== null) return (
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm text-green-600 font-medium">Done</span>
                         </div>
                       );
                     
                     const now = new Date();
                     const nextDue = new Date(fertilizeTask.nextDueOn);
                     const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (daysUntilDue < 0) return 'Overdue';
                     if (daysUntilDue === 0) return 'Today';
                     if (daysUntilDue === 1) return 'Tomorrow';
                     return `In ${daysUntilDue} days`;
                   })()}
                 </p>
               </div>

               {/* Prune */}
               <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                     <Scissors className="w-5 h-5 text-pink-600" />
                   </div>
                   <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                     <Edit className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>
                 <h3 className="font-semibold text-gray-800 mb-1">Prune</h3>
                 <p className="text-sm text-gray-600 mb-2">
                   {plant.tasks.find(t => t.taskKey === 'pruning') ? 
                     getFrequencyText(plant.tasks.find(t => t.taskKey === 'pruning')!.frequencyDays) : 
                     'Not configured'
                   }
                 </p>
                 <p className="text-sm text-gray-600">
                   {(() => {
                     const pruneTask = plant.tasks.find(t => t.taskKey === 'pruning');
                     if (!pruneTask) return 'Not configured';
                     if (pruneTask.lastCompletedOn !== null) return (
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm text-green-600 font-medium">Done</span>
                         </div>
                       );
                     
                     const now = new Date();
                     const nextDue = new Date(pruneTask.nextDueOn);
                     const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (daysUntilDue < 0) return 'Overdue';
                     if (daysUntilDue === 0) return 'Today';
                     if (daysUntilDue === 1) return 'Tomorrow';
                     return `In ${daysUntilDue} days`;
                   })()}
                 </p>
               </div>

               {/* Spray */}
               <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                     <Droplets className="w-5 h-5 text-orange-600" />
                   </div>
                   <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                     <Edit className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>
                 <h3 className="font-semibold text-gray-800 mb-1">Spray</h3>
                 <p className="text-sm text-gray-600 mb-2">
                   {plant.tasks.find(t => t.taskKey === 'spraying') ? 
                     getFrequencyText(plant.tasks.find(t => t.taskKey === 'spraying')!.frequencyDays) : 
                     'Not configured'
                   }
                 </p>
                 <p className="text-sm text-gray-600">
                   {(() => {
                     const sprayTask = plant.tasks.find(t => t.taskKey === 'spraying');
                     if (!sprayTask) return 'Not configured';
                     if (sprayTask.lastCompletedOn !== null) return (
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm text-green-600 font-medium">Done</span>
                         </div>
                       );
                     
                     const now = new Date();
                     const nextDue = new Date(sprayTask.nextDueOn);
                     const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (daysUntilDue < 0) return 'Overdue';
                     if (daysUntilDue === 0) return 'Today';
                     if (daysUntilDue === 1) return 'Tomorrow';
                     return `In ${daysUntilDue} days`;
                   })()}
                 </p>
               </div>

               {/* Rotate */}
               <div className="bg-white rounded-lg p-4 border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                     <Sun className="w-5 h-5 text-purple-600" />
                   </div>
                   <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                     <Edit className="w-4 h-4 text-gray-600" />
                   </button>
                 </div>
                 <h3 className="font-semibold text-gray-800 mb-1">Rotate</h3>
                 <p className="text-sm text-gray-600 mb-2">
                   {plant.tasks.find(t => t.taskKey === 'sunlightRotation') ? 
                     getFrequencyText(plant.tasks.find(t => t.taskKey === 'sunlightRotation')!.frequencyDays) : 
                     'Not configured'
                   }
                 </p>
                 <p className="text-sm text-gray-600">
                   {(() => {
                     const rotateTask = plant.tasks.find(t => t.taskKey === 'sunlightRotation');
                     if (!rotateTask) return 'Not configured';
                     if (rotateTask.lastCompletedOn !== null) return (
                         <div className="flex items-center gap-2">
                           <CheckCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm text-green-600 font-medium">Done</span>
                         </div>
                       );
                     
                     const now = new Date();
                     const nextDue = new Date(rotateTask.nextDueOn);
                     const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     
                     if (daysUntilDue < 0) return 'Overdue';
                     if (daysUntilDue === 0) return 'Today';
                     if (daysUntilDue === 1) return 'Tomorrow';
                     return `In ${daysUntilDue} days`;
                     
                   })()}
                 </p>
               </div>
             </div>

            {/* Three Sections */}
            <div className="space-y-6">
              {/* Today Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Today</h2>
                  <p className="text-sm text-gray-500">Tap on each task for instructions</p>
                </div>
                {/* Empty for now - will be populated later */}
              </div>

              {/* Upcoming Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Upcoming</h2>
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                    View all
                  </button>
                </div>
                {/* Empty for now - will be populated later */}
              </div>

              {/* History Section */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">History</h2>
                  <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    History
                  </button>
                </div>
                {/* Empty for now - will be populated later */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Health</h2>
            <p className="text-gray-600">Health section content will be implemented later.</p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
            <p className="text-gray-600">About section content will be implemented later.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
