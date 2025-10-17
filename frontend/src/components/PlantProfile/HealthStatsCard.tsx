import { Leaf } from 'lucide-react';

interface HealthStatsCardProps {
  healthScore: number;
  daysThriving: number;
}

const HealthStatsCard = ({ healthScore, daysThriving }: HealthStatsCardProps) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'border-green-500 text-green-600';
    if (score >= 50) return 'border-yellow-500 text-yellow-600';
    return 'border-red-500 text-red-600';
  };

  return (
    <>
      {/* Health Score Card */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Plant Health</h3>
        
        {/* Circular Health Score */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mb-3 sm:mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke="#e5e7eb"
                strokeWidth="14"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke={healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#eab308' : '#ef4444'}
                strokeWidth="14"
                fill="none"
                strokeDasharray={`${(healthScore / 100) * 452} 452`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold ${getHealthColor(healthScore)}`}>
                  {healthScore}
                  <span className="text-lg sm:text-xl">/100</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm sm:text-base">Health Score</p>
        </div>
      </div>

      {/* Days Thriving Card */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <Leaf className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-green-500 mb-4 sm:mb-6" />
          <div className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2">
            {daysThriving}
          </div>
          <div className="text-sm sm:text-base text-gray-600">
            {daysThriving === 1 ? 'day' : 'days'} thriving
          </div>
        </div>
      </div>
    </>
  );
};

export default HealthStatsCard;

