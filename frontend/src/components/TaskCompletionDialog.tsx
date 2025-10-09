import React, { useState } from 'react';
import WateringAnimation from './animations/WateringAnimation';
import FertilizingAnimation from './animations/FertilizingAnimation';
import SprayingAnimation from './animations/SprayingAnimation';
import PruningAnimation from './animations/PruningAnimation';
import SunlightAnimation from './animations/SunlightAnimation';

/**
 * A reusable confirmation dialog component for task completion.
 * 
 * @example
 * ```tsx
 * <TaskCompletionDialog
 *   isOpen={showDialog}
 *   task={{ plantName: "Rose", taskId: "123", plantId: "456", taskType: "watering" }}
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
    taskType: 'watering' | 'fertilizing' | 'pruning' | 'spraying' | 'sunlightRotation';
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
  const [showAnimation, setShowAnimation] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(true);
  // Keep this component mounted during the animation even if parent closes it
  const [forceMount, setForceMount] = useState(false);

  const handleConfirm = () => {
    if (!task) return;
    
    // Ensure component stays mounted even if parent toggles isOpen off
    setForceMount(true);

    // Step 1: Call completion logic immediately
    onConfirm(task.taskId, task.plantId);
    
    // Step 2: Hide dialog immediately (no fade)
    setIsDialogVisible(false);

    // Step 3: Show animation immediately on clean screen
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsDialogVisible(true); // Reset for next time
    setForceMount(false); // Allow unmounting again
    // Close the dialog after animation completes
    onClose();
  };

  // If parent closed the dialog but we're animating, keep rendering to show overlay
  if (!isOpen && !forceMount) return null;

  return (
    <>
      {isDialogVisible && !!task && (
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
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task-specific animations - appear after dialog fades out */}
      {task?.taskType === 'watering' && (
        <WateringAnimation
          show={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
      {task?.taskType === 'fertilizing' && (
        <FertilizingAnimation
          show={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
      {task?.taskType === 'spraying' && (
        <SprayingAnimation
          show={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
      {task?.taskType === 'pruning' && (
        <PruningAnimation
          show={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
      {task?.taskType === 'sunlightRotation' && (
        <SunlightAnimation
          show={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
    </>
  );
};
