import React from 'react';
import { X } from 'lucide-react';

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
  isSuggested?: boolean;
}

interface CareTasksSectionProps {
  taskTemplatesLoading: boolean;
  taskTemplates: TaskTemplate[];
  selectedTasks: SelectedTask[];
  onToggleTaskSelection: (template: TaskTemplate) => void;
  onUpdateTaskFrequency: (taskKey: string, frequency: number) => void;
  onUpdateTaskLastCompleted: (taskKey: string, lastCompleted: string) => void;
  onRemoveTask: (taskKey: string) => void;
  getTaskIcon: (taskKey: string) => string;
  getTaskFrequencyText: (template: TaskTemplate, selectedTask?: SelectedTask) => string;
  getTodayDateString: () => string;
}

export const CareTasksSection: React.FC<CareTasksSectionProps> = ({
  taskTemplatesLoading,
  taskTemplates,
  selectedTasks,
  onToggleTaskSelection,
  onUpdateTaskFrequency,
  onUpdateTaskLastCompleted,
  onRemoveTask,
  getTaskIcon,
  getTaskFrequencyText,
  getTodayDateString,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Care Tasks</h2>
        {!taskTemplatesLoading && selectedTasks.length === 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            No tasks selected!
          </span>
        )}
      </div>
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
        <div className="space-y-4">
          {taskTemplates.map((template) => {
            const isSelected = selectedTasks.some(task => task.key === template.key);
            const selectedTask = selectedTasks.find(task => task.key === template.key);

            return (
              <div key={template.key} className="space-y-3">
                {/* Task Selection Card with inline configuration */}
                <div className={`rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}>
                  <div className="flex flex-col lg:flex-row gap-4 p-4">
                    {/* Task Selection Area */}
                    <div
                      onClick={() => onToggleTaskSelection(template)}
                      className={`flex items-center gap-3 cursor-pointer transition-all ${
                        isSelected ? 'flex-1 lg:flex-none lg:w-64' : 'flex-1'
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
                        <p className="text-sm text-gray-600 truncate">
                          {getTaskFrequencyText(template, selectedTask)}
                        </p>
                      </div>
                      {!isSelected && (
                        <div className="w-6 h-6 flex items-center justify-center text-lg flex-shrink-0">
                          {getTaskIcon(template.key)}
                        </div>
                      )}
                    </div>

                    {/* Task Configuration - appears beside selected task */}
                    {isSelected && selectedTask && (
                      <div className="flex-1 lg:flex-none lg:w-80 flex items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Frequency (days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selectedTask.frequency}
                            onChange={(e) => onUpdateTaskFrequency(selectedTask.key, parseInt(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Last Completed
                          </label>
                          <input
                            type="date"
                            value={selectedTask.frequency === 1 ? getTodayDateString() : (selectedTask.lastCompleted || '')}
                            onChange={(e) => onUpdateTaskLastCompleted(selectedTask.key, e.target.value)}
                            max={getTodayDateString()}
                            className={`w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 focus:border-transparent ${
                              selectedTask.frequency === 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            disabled={selectedTask.frequency === 1}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveTask(selectedTask.key)}
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
  );
};
