import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { ArrowLeft, Plus, Check, X } from 'lucide-react';
import { ConfidenceNotification } from '../components/ConfidenceNotification';
import { CityAutocomplete } from '../components/CityAutocomplete';

interface TaskTemplate {
  id: string;
  key: string;
  label: string;
  colorHex: string;
  defaultFrequencyDays: number;
}

interface SelectedTask {
  key: string;
  label: string;
  colorHex: string;
  frequency: number;
  lastCompleted?: string;
}

export const AddPlantPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [taskTemplatesLoading, setTaskTemplatesLoading] = useState(true);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    acquisitionDate: '',
    city: '',
  });

  // AI identification state
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [showConfidenceNotification, setShowConfidenceNotification] = useState(false);

  // Fetch task templates on component mount
  useEffect(() => {
    fetchTaskTemplates();
  }, []);

  // Handle AI data from navigation state
  useEffect(() => {
    if (location.state?.aiData && location.state?.fromAI) {
      handleAIIdentification(location.state.aiData);
      // Clear the state to prevent re-processing
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const fetchTaskTemplates = async () => {
    setTaskTemplatesLoading(true);
    try {
      const response = await plantsAPI.getTaskTemplates();
      setTaskTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching task templates:', error);
      // Fallback to default task templates if API fails
      const defaultTemplates: TaskTemplate[] = [
        {
          id: '1',
          key: 'watering',
          label: 'Watering',
          colorHex: '#3B82F6',
          defaultFrequencyDays: 3,
        },
        {
          id: '2',
          key: 'fertilizing',
          label: 'Fertilizing',
          colorHex: '#10B981',
          defaultFrequencyDays: 14,
        },
        {
          id: '3',
          key: 'pruning',
          label: 'Pruning',
          colorHex: '#F59E0B',
          defaultFrequencyDays: 30,
        },
        {
          id: '4',
          key: 'spraying',
          label: 'Spraying',
          colorHex: '#8B5CF6',
          defaultFrequencyDays: 7,
        },
        {
          id: '5',
          key: 'sunlightRotation',
          label: 'Sunlight Rotation',
          colorHex: '#F97316',
          defaultFrequencyDays: 14,
        },
      ];
      setTaskTemplates(defaultTemplates);
    } finally {
      setTaskTemplatesLoading(false);
    }
  };

  const toggleTaskSelection = (template: TaskTemplate) => {
    const isSelected = selectedTasks.some(task => task.key === template.key);
    
    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(task => task.key !== template.key));
    } else {
      setSelectedTasks([
        ...selectedTasks,
        {
          key: template.key,
          label: template.label,
          colorHex: template.colorHex,
          frequency: template.defaultFrequencyDays,
        }
      ]);
    }
  };

  const updateTaskFrequency = (taskKey: string, frequency: number) => {
    setSelectedTasks(selectedTasks.map(task => 
      task.key === taskKey ? { ...task, frequency } : task
    ));
  };

  const updateTaskLastCompleted = (taskKey: string, lastCompleted: string) => {
    setSelectedTasks(selectedTasks.map(task => 
      task.key === taskKey ? { ...task, lastCompleted } : task
    ));
  };

  const removeTask = (taskKey: string) => {
    setSelectedTasks(selectedTasks.filter(task => task.key !== taskKey));
  };

  // Function to handle AI identification data
  const handleAIIdentification = (aiData: any) => {
    // Set plant name and type from AI identification
    setFormData(prev => ({
      ...prev,
      name: aiData.speciesGuess || '',
      type: aiData.plantType || '',
    }));

    // Convert AI suggested tasks to selected tasks
    const aiTasks: SelectedTask[] = aiData.suggestedTasks.map((task: any) => {
      const template = taskTemplates.find(t => t.key === task.name);
      return {
        key: task.name,
        label: template?.label || task.name,
        colorHex: template?.colorHex || '#3B82F6',
        frequency: task.frequencyDays,
      };
    });

    setSelectedTasks(aiTasks);

    // Show confidence notification
    setAiConfidence(aiData.confidence);
    setShowConfidenceNotification(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Plant name is required');
      return;
    }

    setLoading(true);

    try {
      // Prepare care tasks object
      const careTasks: any = {};
      selectedTasks.forEach(task => {
        const taskData: any = { frequency: task.frequency };
        
        // Add last completed date if provided
        if (task.lastCompleted) {
          const lastCompletedKey = `last${task.key.charAt(0).toUpperCase() + task.key.slice(1)}`;
          taskData[lastCompletedKey] = task.lastCompleted;
        }
        
        careTasks[task.key] = taskData;
      });

      const plantData = {
        ...formData,
        careTasks: Object.keys(careTasks).length > 0 ? careTasks : undefined,
      };

      const response = await plantsAPI.create(plantData);

      console.log('Plant created successfully:', response.data);
      navigate('/plants');
    } catch (error) {
      console.error('Error creating plant:', error);
      alert('Failed to create plant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/plants')}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Add New Plant</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="e.g., Snake Plant, Monstera"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plant Type
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="e.g., Succulent, Tropical"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acquisition Date
                    </label>
                    <input
                      type="date"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       City/Location
                     </label>
                     <CityAutocomplete
                       value={formData.city}
                       onChange={(city) => setFormData({ ...formData, city })}
                       placeholder="e.g., New York"
                     />
                   </div>
                </div>
              </div>
            </div>

            {/* Care Tasks */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Care Tasks</h2>
              <p className="text-gray-600 mb-6">Select which care tasks you'd like to set up for this plant:</p>

              {/* Available Task Templates */}
              {taskTemplatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading care tasks...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {taskTemplates.map((template) => {
                    const isSelected = selectedTasks.some(task => task.key === template.key);
                    
                    return (
                      <div
                        key={template.key}
                        onClick={() => toggleTaskSelection(template)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'scale-110' : ''
                            }`}
                            style={{ borderColor: template.colorHex }}
                          >
                            {isSelected && (
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: template.colorHex }}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{template.label}</h3>
                            <p className="text-sm text-gray-600">
                              Default: every {template.defaultFrequencyDays} days
                            </p>
                          </div>
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: template.colorHex }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Tasks Configuration */}
              {selectedTasks.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800">Configure Selected Tasks</h3>
                  
                  {selectedTasks.map((task) => (
                    <div key={task.key} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: task.colorHex }}
                          />
                          <h4 className="font-medium text-gray-800">{task.label}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(task.key)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequency (days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={task.frequency}
                            onChange={(e) => updateTaskFrequency(task.key, parseInt(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Completed
                          </label>
                          <input
                            type="date"
                            value={task.lastCompleted || ''}
                            onChange={(e) => updateTaskLastCompleted(task.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">No tasks selected</p>
                  <p className="text-gray-500 text-xs mt-1">Select care tasks above to configure them</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/plants')}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Plant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confidence Notification */}
      <ConfidenceNotification
        confidence={aiConfidence || 0}
        isVisible={showConfidenceNotification}
        onClose={() => setShowConfidenceNotification(false)}
      />
    </Layout>
  );
};
