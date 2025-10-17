interface BadgeDisplayProps {
  badge: {
    name: string;
    quote: string;
    image: string;
  };
  careStreak: number;
}

const BadgeDisplay = ({ badge, careStreak }: BadgeDisplayProps) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <div className="relative w-32 h-32 mb-4">
        <img
          src={badge.image}
          alt={badge.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to a placeholder if image doesn't exist
            (e.target as HTMLImageElement).src = '/plant.png';
          }}
        />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{badge.name}</h3>
      <p className="text-center text-gray-600 italic mb-2">{badge.quote}</p>
      <div className="text-sm text-gray-500">
        {careStreak} {careStreak === 1 ? 'day' : 'days'} streak
      </div>
    </div>
  );
};

export default BadgeDisplay;

