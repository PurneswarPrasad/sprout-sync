import React from 'react';

/**
 * A reusable confirmation dialog component for task completion.
 * 
 * @example
 * ```tsx
 * <TaskCompletionDialog
 *   isOpen={showDialog}
 *   task={{ plantName: "Rose", taskId: "123", plantId: "456" }}
 *   message="Great job! Mark this as complete? 🌱"
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={(taskId, plantId) => handleComplete(taskId, plantId)}
 *   icon="🌿"
 *   confirmText="Yes, Done!"
 *   cancelText="Not yet"
 * />
 * ```
 */
interface TaskCompletionDialogProps {
  isOpen: boolean;
  task: {
    plantName: string;
    taskId: string;
    plantId: string;
  } | null;
  message: string;
  onClose: () => void;
  onConfirm: (taskId: string, plantId: string) => void;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

export const TaskCompletionDialog: React.FC<TaskCompletionDialogProps> = ({
  isOpen,
  task,
  message,
  onClose,
  onConfirm,
  confirmText = "Yes, Complete!",
  cancelText = "No, Cancel",
  icon = "🎉",
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{icon}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {task.plantName}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => onConfirm(task.taskId, task.plantId)}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
