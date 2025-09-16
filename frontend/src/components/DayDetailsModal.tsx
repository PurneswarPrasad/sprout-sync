import React from 'react';
import { X, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { TaskCompletionDialog } from './TaskCompletionDialog';

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
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    type: string | null;
    tasks: PlantTask[];
}

interface CalendarTask {
    id: string;
    plantName: string;
    plantId: string;
    taskKey: string;
    scheduledDate: Date;
    completed: boolean;
    icon: any;
    color: string;
    taskId: string;
}

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    dayTasks: CalendarTask[];
    onTaskComplete: (taskId: string, plantId: string) => void;
}

export function DayDetailsModal({
    isOpen,
    onClose,
    selectedDate,
    dayTasks,
    onTaskComplete
}: DayDetailsModalProps) {
    const [showTaskDialog, setShowTaskDialog] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<CalendarTask | null>(null);

    if (!isOpen || !selectedDate) return null;

    const handleMarkComplete = (task: CalendarTask) => {
        setSelectedTask(task);
        setShowTaskDialog(true);
    };

    const handleTaskComplete = (taskId: string, plantId: string) => {
        onTaskComplete(taskId, plantId);
        setShowTaskDialog(false);
        setSelectedTask(null);
    };

    const closeTaskDialog = () => {
        setShowTaskDialog(false);
        setSelectedTask(null);
    };

    // Group tasks by plant
    const tasksByPlant = dayTasks.reduce((acc, task) => {
        if (!acc[task.plantName]) {
            acc[task.plantName] = [];
        }
        acc[task.plantName].push(task);
        return acc;
    }, {} as Record<string, CalendarTask[]>);

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

    const getTaskTypeLabel = (type: string) => {
        switch (type) {
            case 'watering':
                return 'Water';
            case 'sunlightRotation':
                return 'Rotate';
            case 'pruning':
                return 'Prune';
            case 'fertilizing':
                return 'Fertilize';
            case 'spraying':
                return 'Spray';
            default:
                return type;
        }
    };

    // Check if the selected date is today
    const isToday = new Date().toDateString() === selectedDate.toDateString();

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </h2>
                            <p className="text-gray-600">
                                {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} scheduled
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Tasks by Plant */}
                    {dayTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📅</span>
                            </div>
                            <p className="text-gray-600 mb-2">No tasks scheduled for this day</p>
                            <p className="text-sm text-gray-500">Enjoy your day off from plant care!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(tasksByPlant).map(([plantName, plantTasks]) => (
                                <div key={plantName} className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                                        {plantName}
                                    </h3>

                                    <div className="space-y-3">
                                        {plantTasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{getTaskIcon(task.taskKey)}</span>
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {getTaskTypeLabel(task.taskKey)}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {format(task.scheduledDate, 'h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {task.completed ? (
                                                        <div className="flex items-center space-x-1 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-sm">Done</span>
                                                        </div>
                                                    ) : (isToday || selectedDate < new Date()) ? (
                                                        // Show "Mark Complete" button for today's tasks and overdue tasks
                                                        <button
                                                            onClick={() => handleMarkComplete(task)}
                                                            className={`flex items-center space-x-1 transition-colors ${
                                                                selectedDate < new Date()
                                                                    ? 'text-red-600 hover:text-red-700'
                                                                    : 'text-yellow-600 hover:text-yellow-700'
                                                            }`}
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            <span className="text-sm">Mark Complete</span>
                                                        </button>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Completion Dialog */}
            <TaskCompletionDialog
                isOpen={showTaskDialog}
                task={selectedTask ? {
                    plantName: selectedTask.plantName,
                    taskId: selectedTask.taskId,
                    plantId: selectedTask.plantId
                } : null}
                message="Great job! Mark this task as complete? 🌿"
                onClose={closeTaskDialog}
                onConfirm={handleTaskComplete}
                confirmText="Yes, Complete!"
                cancelText="Not yet"
                icon="🌿"
            />
        </>
    );
}
