import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { plantsAPI } from '../services/api';
import { CloudinaryService } from '../services/cloudinaryService';

interface PlantTask {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  active: boolean;
}

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
  taskId?: string; // For existing tasks
  isSuggested?: boolean;
  suggestedFrequency?: number;
  frequencyInput?: string;
}

interface EditPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  currentNickname: string | null;
  currentPhoto: {
    id: string;
    secureUrl: string;
    cloudinaryPublicId: string;
  } | null;
  plantSuggestedTasks: { taskKey: string; frequencyDays: number }[];
  plantCommonName: string | null;
  plantTasks: PlantTask[];
  onUpdate: () => void;
}

export function EditPlantModal({
  isOpen,
  onClose,
  plantId,
  currentNickname,
  currentPhoto,
  plantSuggestedTasks,
  plantCommonName,
  plantTasks,
  onUpdate,
}: EditPlantModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task management state
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [taskTemplatesLoading, setTaskTemplatesLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [showNoTasksModal, setShowNoTasksModal] = useState(false);

  const suggestedFrequencyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(plantSuggestedTasks)) {
      plantSuggestedTasks.forEach(task => {
        if (task?.taskKey && typeof task.frequencyDays === 'number') {
          map.set(task.taskKey, task.frequencyDays);
        }
      });
    }
    return map;
  }, [plantSuggestedTasks]);

  // Fetch task templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTaskTemplates();
    }
  }, [isOpen]);

  // Initialize selected tasks from plant tasks when templates are loaded
  useEffect(() => {
    if (taskTemplates.length > 0 && plantTasks.length > 0) {
      const initialSelectedTasks: SelectedTask[] = plantTasks
        .filter(task => task.active)
        .map(task => {
          const template = taskTemplates.find(t => t.key === task.taskKey);
          const suggestedFrequency = suggestedFrequencyMap.get(task.taskKey) ?? template?.defaultFrequencyDays;
          return {
            key: task.taskKey,
            label: template?.label || task.taskKey,
            colorHex: template?.colorHex || '#3B82F6',
            frequency: task.frequencyDays,
            taskId: task.id,
            suggestedFrequency,
            frequencyInput: String(task.frequencyDays),
          };
        });
      setSelectedTasks(initialSelectedTasks);
    } else if (taskTemplates.length > 0 && plantTasks.length === 0) {
      setSelectedTasks([]);
    }
  }, [taskTemplates, plantTasks, suggestedFrequencyMap]);

  React.useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsPhotoRemoved(false);
      setError('');
      setShowNoTasksModal(false);
    }
  }, [isOpen, currentNickname, currentPhoto]);

  const fetchTaskTemplates = async () => {
    setTaskTemplatesLoading(true);
    try {
      const response = await plantsAPI.getTaskTemplates();
      setTaskTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching task templates:', error);
    } finally {
      setTaskTemplatesLoading(false);
    }
  };

  const getTaskIcon = (taskKey: string): string => {
    const icons: { [key: string]: string } = {
      watering: '💧',
      fertilizing: '⚡',
      pruning: '✂️',
      spraying: '🌿',
      sunlightRotation: '☀️',
    };
    return icons[taskKey] || '🌱';
  };

  const getTaskFrequencyText = (template: TaskTemplate, selectedTask?: SelectedTask): string => {
    const suggestedFrequency = selectedTask?.suggestedFrequency
      ?? suggestedFrequencyMap.get(template.key)
      ?? template.defaultFrequencyDays;

    return suggestedFrequency === 1
      ? 'Suggested: everyday'
      : `Suggested: every ${suggestedFrequency} days`;
  };

  const handleToggleTaskSelection = (template: TaskTemplate) => {
    const existingTask = selectedTasks.find(t => t.key === template.key);
    
    if (existingTask) {
      // Deselect task
      setSelectedTasks(selectedTasks.filter(t => t.key !== template.key));
    } else {
      // Select task with default frequency
      const suggestedFrequency = suggestedFrequencyMap.get(template.key) ?? template.defaultFrequencyDays;
      setSelectedTasks([
        ...selectedTasks,
        {
          key: template.key,
          label: template.label,
          colorHex: template.colorHex,
          frequency: suggestedFrequency,
          suggestedFrequency,
          frequencyInput: String(suggestedFrequency),
        },
      ]);
    }
  };

  const handleUpdateTaskFrequency = (taskKey: string, rawValue: string) => {
    const sanitized = rawValue.replace(/[^0-9]/g, '');

    setSelectedTasks(
      selectedTasks.map(task => {
        if (task.key !== taskKey) return task;

        if (sanitized === '') {
          return {
            ...task,
            frequencyInput: '',
            isSuggested: true,
          };
        }

        const parsed = Math.max(1, parseInt(sanitized, 10));
        return {
          ...task,
          frequency: parsed,
          frequencyInput: String(parsed),
          isSuggested: true,
        };
      })
    );
  };

  const handleRemoveTask = (taskKey: string) => {
    setSelectedTasks(selectedTasks.filter(t => t.key !== taskKey));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = CloudinaryService.getPreviewUrl(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhoto) return;

    try {
      setIsUploading(true);
      setError('');
      
      // Immediately hide the photo from UI
      setIsPhotoRemoved(true);
      
      await plantsAPI.deletePhoto(plantId, currentPhoto.id);
      
      // Clean up local state
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh plant data and close modal
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error removing photo:', error);
      setError(error.response?.data?.error || 'Failed to remove photo');
      // Revert removal state on error
      setIsPhotoRemoved(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      // Validate that at least one task is selected
      if (selectedTasks.length === 0) {
        setShowNoTasksModal(true);
        setIsSaving(false);
        return;
      }

      const frequencyMap = new Map<string, number>();
      for (const task of selectedTasks) {
        const inputValue = (task.frequencyInput ?? String(task.frequency)).trim();
        const parsed = parseInt(inputValue, 10);
        if (!inputValue || isNaN(parsed) || parsed < 1) {
          setError('Please enter a frequency of at least 1 day for every selected task.');
          setIsSaving(false);
          return;
        }
        frequencyMap.set(task.key, Math.max(1, parsed));
      }

      // Update nickname
      await plantsAPI.update(plantId, { petName: nickname.trim() || null });

      // Handle photo updates
      if (selectedFile) {
        // Upload new photo
        setIsUploading(true);
        const uploadResult = await CloudinaryService.uploadImage(selectedFile);
        
        // Delete old photo if exists
        if (currentPhoto) {
          try {
            await plantsAPI.deletePhoto(plantId, currentPhoto.id);
          } catch (error) {
            console.error('Error deleting old photo:', error);
            // Continue even if deletion fails
          }
        }

        // Create new photo record
        await plantsAPI.createPhoto(plantId, {
          cloudinaryPublicId: uploadResult.public_id,
          secureUrl: uploadResult.optimized_url,
          takenAt: new Date().toISOString(),
        });

        // Clean up preview URL
        if (previewUrl) {
          CloudinaryService.revokePreviewUrl(previewUrl);
        }
      }

      // Handle task updates
      // Find tasks to delete (exist in plantTasks but not in selectedTasks)
      const tasksToDelete = plantTasks.filter(
        task => task.active && !selectedTasks.find(st => st.taskId === task.id)
      );
      
      // Delete removed tasks
      for (const task of tasksToDelete) {
        try {
          await plantsAPI.deleteTask(plantId, task.id);
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      }

      // Find tasks to create or update
      for (const selectedTask of selectedTasks) {
        const existingTask = plantTasks.find(task => task.id === selectedTask.taskId);
        const resolvedFrequency = frequencyMap.get(selectedTask.key)!;
        
        if (existingTask) {
          // Update existing task if frequency changed
          if (existingTask.frequencyDays !== resolvedFrequency) {
            try {
              await plantsAPI.updateTask(plantId, existingTask.id, {
                frequencyDays: resolvedFrequency,
              });
            } catch (error) {
              console.error('Error updating task:', error);
            }
          }
        } else {
          // Create new task
          try {
            await plantsAPI.createTask(plantId, {
              taskKey: selectedTask.key,
              frequencyDays: resolvedFrequency,
            });
          } catch (error) {
            console.error('Error creating task:', error);
          }
        }
      }

      // Refresh plant data
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating plant:', error);
      setError(error.response?.data?.error || 'Failed to update plant. Please try again.');
      
      // Clean up preview URL on error
      if (previewUrl) {
        CloudinaryService.revokePreviewUrl(previewUrl);
      }
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      CloudinaryService.revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    setShowNoTasksModal(false);
    onClose();
  };

  if (!isOpen) return null;

  const displayPhoto = previewUrl || (currentPhoto && !selectedFile && !isPhotoRemoved ? currentPhoto.secureUrl : null);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">Edit Plant</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isSaving || isUploading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nickname */}
            <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                Plant Nickname
              </label>
              <span className="text-xs text-gray-500">Optional</span>
            </div>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              placeholder={plantCommonName || 'Enter plant nickname'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSaving || isUploading}
              />
            <p className="mt-1 text-xs text-gray-500">
              Display name: {nickname.trim() || plantCommonName || 'Unnamed plant'}
            </p>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Photo
              </label>
              <div className="space-y-4">
                {displayPhoto ? (
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={displayPhoto}
                        alt="Plant photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving || isUploading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Change Photo
                      </button>
                      {currentPhoto && !selectedFile && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isSaving || isUploading}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          disabled={isSaving || isUploading}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving || isUploading}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Upload Photo</span>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSaving || isUploading}
                />
              </div>
            </div>

            {/* Care Tasks Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Tasks
              </label>
              {taskTemplatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading care tasks...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {taskTemplates.map((template) => {
                    const isSelected = selectedTasks.some(task => task.key === template.key);
                    const selectedTask = selectedTasks.find(task => task.key === template.key);

                    return (
                      <div key={template.key} className="space-y-3">
                        <div className={`rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                          <div className="flex flex-col gap-3 p-3">
                            {/* Task Selection Area */}
                            <div
                              onClick={() => handleToggleTaskSelection(template)}
                              className={`flex items-center gap-3 cursor-pointer transition-all ${
                                isSelected ? 'flex-1' : 'flex-1'
                              }`}
                            >
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
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800 truncate">{template.label}</h3>
                                <p className="text-xs text-gray-600 truncate">
                                  {getTaskFrequencyText(template, selectedTask)}
                                </p>
                              </div>
                              {!isSelected && (
                                <div className="w-6 h-6 flex items-center justify-center text-lg flex-shrink-0">
                                  {getTaskIcon(template.key)}
                                </div>
                              )}
                            </div>

                            {/* Task Configuration - appears below selected task */}
                            {isSelected && selectedTask && (
                              <div className="flex items-center gap-2 pl-7">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Frequency (days)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedTask.frequencyInput ?? String(selectedTask.frequency)}
                                    onChange={(e) => handleUpdateTaskFrequency(selectedTask.key, e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTask(selectedTask.key)}
                                  className="p-2 rounded-full hover:bg-gray-100 transition-colors self-end flex-shrink-0"
                                >
                                  <X className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={handleClose}
              disabled={isSaving || isUploading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving || isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* No Tasks Selected Modal */}
      {showNoTasksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your plant needs care!
              </h3>
              <p className="text-gray-600 mb-6">
                Your plant needs some care to thrive! Please choose at least one of the tasks, or choose watering.
                <br /><br />
                <span className="italic">
                  Fun fact: Watering keeps most plants alive even if you forget the rest!
                </span>
              </p>
              <button
                onClick={() => setShowNoTasksModal(false)}
                className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
