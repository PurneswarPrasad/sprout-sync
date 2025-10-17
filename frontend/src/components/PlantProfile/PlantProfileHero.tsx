interface PlantProfileHeroProps {
  plant: {
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    photo: {
      secureUrl: string;
      takenAt: string;
    } | null;
  };
  badge: {
    name: string;
    quote: string;
    image: string;
  };
  careStreak: number;
}

const PlantProfileHero = ({ plant, badge, careStreak }: PlantProfileHeroProps) => {
  const displayName = plant.petName || plant.commonName || plant.botanicalName || 'Unknown Plant';

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-b from-green-50 to-white rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
      {plant.photo ? (
        <img
          src={plant.photo.secureUrl}
          alt={displayName}
          className="max-h-[350px] sm:max-h-[500px] w-auto object-contain mx-auto"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
          <svg
            className="w-32 h-32 text-green-600 opacity-50"
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
      
      {/* Badge Display - Top Right */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-1 sm:mb-2">
            <img
              src={badge.image}
              alt={badge.name}
              className="w-full h-full object-contain drop-shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/plant.png';
              }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-white text-center italic bg-black/50 px-2 sm:px-3 py-1 rounded-lg max-w-[120px] sm:max-w-[150px] leading-tight">
            {badge.quote}
          </p>
        </div>
      </div>

      {/* Plant Name Overlay - Bottom Left */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 md:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{displayName}</h1>
          {plant.botanicalName && (
            <p className="text-sm sm:text-base md:text-lg text-gray-200 italic">{plant.botanicalName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantProfileHero;

