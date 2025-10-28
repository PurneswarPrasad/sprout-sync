import { Droplet, Sun, Scissors, Sparkles, RefreshCw } from 'lucide-react';

interface PlantCatalogCardProps {
  plant: {
    id: string;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    type: string | null;
    photo: {
      secureUrl: string;
      takenAt: string;
    } | null;
    tasks: Array<{
      id: string;
      taskKey: string;
      frequencyDays: number;
      nextDueOn: string;
      lastCompletedOn: string | null;
    }>;
    healthScore: number;
    careLevel: any;
    sunRequirements: any;
  };
}

const PlantCatalogCard = ({ plant }: PlantCatalogCardProps) => {
  const displayName = plant.petName || plant.commonName || plant.botanicalName || 'Unknown Plant';

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return <Droplet className="w-4 h-4" />;
      case 'fertilizing':
        return <Sun className="w-4 h-4" />;
      case 'pruning':
        return <Scissors className="w-4 h-4" />;
      case 'spraying':
        return <Sparkles className="w-4 h-4" />;
      case 'sunlightRotation':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTaskLabel = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'Watering';
      case 'fertilizing':
        return 'Fertilizing';
      case 'pruning':
        return 'Pruning';
      case 'spraying':
        return 'Spraying';
      case 'sunlightRotation':
        return 'Sunlight Rotation';
      default:
        return taskKey;
    }
  };

  const getTaskColor = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'fertilizing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pruning':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'spraying':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'sunlightRotation':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Plant Photo with Name Overlay */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-b from-green-50 to-white">
        {plant.photo ? (
          <img
            src={plant.photo.secureUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <svg
              className="w-20 h-20 text-green-600 opacity-50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        
        {/* Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="text-white font-semibold text-base sm:text-lg truncate">{displayName}</h3>
          {plant.botanicalName && plant.botanicalName !== displayName && (
            <p className="text-white/80 text-xs sm:text-sm italic truncate">{plant.botanicalName}</p>
          )}
        </div>
      </div>

      {/* Care Details */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Care Schedule</h4>
        {plant.tasks.length > 0 ? (
          <div className="space-y-2">
            {plant.tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${getTaskColor(task.taskKey)}`}
              >
                {getTaskIcon(task.taskKey)}
                <span className="text-xs sm:text-sm font-medium flex-1">
                  {getTaskLabel(task.taskKey)}
                </span>
                <span className="text-xs">Every {task.frequencyDays}d</span>
              </div>
            ))}
            {plant.tasks.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{plant.tasks.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No care tasks set</p>
        )}
      </div>

      {/* Health Score */}
      <div className={`p-4 border-t ${getHealthScoreBgColor(plant.healthScore)}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-700">Health Score</span>
          <div className="flex items-center gap-2">
            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  plant.healthScore >= 80
                    ? 'bg-green-600'
                    : plant.healthScore >= 60
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${plant.healthScore}%` }}
              ></div>
            </div>
            <span className={`text-sm sm:text-base font-bold ${getHealthScoreColor(plant.healthScore)}`}>
              {plant.healthScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantCatalogCard;


