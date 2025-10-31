import { Calendar, Droplet, Sprout, Sun, Scissors } from 'lucide-react';

interface Task {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
}

interface CareDetailsPanelProps {
  tasks: Task[];
  sunRequirements?: any;
}

const CareDetailsPanel = ({ tasks, sunRequirements }: CareDetailsPanelProps) => {
  // Filter and sort tasks: only show watering, fertilizing, pruning in that order
  const displayTasks = tasks
    .filter(task => ['watering', 'fertilizing', 'pruning'].includes(task.taskKey))
    .sort((a, b) => {
      const order = { watering: 1, fertilizing: 2, pruning: 3 };
      return (order[a.taskKey as keyof typeof order] || 99) - (order[b.taskKey as keyof typeof order] || 99);
    });

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return <Droplet className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />;
      case 'fertilizing':
        return <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />;
      case 'sunlightRotation':
        return <Sun className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />;
      default:
        return <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />;
    }
  };

  const getTaskLabel = (taskKey: string) => {
    const labels: Record<string, string> = {
      watering: 'Watering',
      fertilizing: 'Fertilizing',
      pruning: 'Pruning',
      spraying: 'Spraying',
      sunlightRotation: 'Sunlight Rotation',
    };
    return labels[taskKey] || taskKey;
  };

  const formatNextDue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-blue-600 font-semibold">Today!</span>;
    } else if (diffDays === 1) {
      return <span className="text-gray-700">Tomorrow</span>;
    } else {
      return <span className="text-gray-700">In {diffDays} days</span>;
    }
  };

  const getSunlightInfo = () => {
    if (!sunRequirements) return 'Not specified';
    if (typeof sunRequirements === 'string') return sunRequirements;
    if (sunRequirements.level) return sunRequirements.level;
    return 'Not specified';
  };

  const getTaskBackgroundColor = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'bg-blue-50 border-blue-200';
      case 'fertilizing':
        return 'bg-purple-50 border-purple-200';
      case 'pruning':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Care Details</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Sunlight */}
        <div className="flex flex-col items-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <Sun className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 mb-1 sm:mb-2" />
          <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1">Sunlight</h3>
          <p className="text-xs sm:text-sm text-gray-600 text-center">{getSunlightInfo()}</p>
        </div>

        {/* Tasks */}
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className={`flex flex-col items-center p-3 sm:p-4 rounded-lg border ${getTaskBackgroundColor(task.taskKey)}`}
          >
            {getTaskIcon(task.taskKey)}
            <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1 mt-1 sm:mt-2">
              {getTaskLabel(task.taskKey)}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">
              Every {task.frequencyDays} {task.frequencyDays === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs sm:text-sm">{formatNextDue(task.nextDueOn)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareDetailsPanel;

