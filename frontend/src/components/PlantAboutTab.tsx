import React from 'react';

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
}

interface Plant {
  id: string;
  petName: string | null;
  botanicalName: string | null;
  commonName: string | null;
  type: string | null;
  acquisitionDate: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: any[];
  tags: any[];
  photos: PlantPhoto[];
  _count: {
    notes: number;
    photos: number;
  };
}

interface PlantAboutTabProps {
  plant: Plant;
}

// Helper function to get display name for plant
const getPlantDisplayName = (plant: Plant): string => {
  if (plant.petName && plant.commonName) {
    return `${plant.petName} (${plant.commonName})`;
  } else if (plant.petName) {
    return plant.petName;
  } else if (plant.commonName) {
    return plant.commonName;
  } else if (plant.botanicalName) {
    return plant.botanicalName;
  } else {
    return 'Unknown Plant';
  }
};

export function PlantAboutTab({ plant }: PlantAboutTabProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">About {getPlantDisplayName(plant)}</h2>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Pet Name</label>
              <p className="text-gray-800">{plant.petName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Common Name</label>
              <p className="text-gray-800">{plant.commonName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Botanical Name</label>
              <p className="text-gray-800">{plant.botanicalName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Type</label>
              <p className="text-gray-800">{plant.type || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Acquisition Date</label>
              <p className="text-gray-800">
                {plant.acquisitionDate 
                  ? new Date(plant.acquisitionDate).toLocaleDateString()
                  : 'Not set'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p className="text-gray-800">{plant.city || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{plant.tasks.length}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{plant._count.notes}</div>
              <div className="text-sm text-gray-600">Notes</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{plant._count.photos}</div>
              <div className="text-sm text-gray-600">Photos</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {plant.createdAt 
                  ? Math.ceil((new Date().getTime() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                }
              </div>
              <div className="text-sm text-gray-600">Days in Garden</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {plant.tags && plant.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {plant.tags.map((plantTag) => (
                <span
                  key={plantTag.tag.id}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full"
                  style={{
                    backgroundColor: plantTag.tag.colorHex ? `${plantTag.tag.colorHex}20` : undefined,
                    color: plantTag.tag.colorHex || undefined
                  }}
                >
                  {plantTag.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Added to garden</p>
                <p className="text-xs text-gray-600">
                  {new Date(plant.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {plant.acquisitionDate && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Acquired</p>
                  <p className="text-xs text-gray-600">
                    {new Date(plant.acquisitionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Last updated</p>
                <p className="text-xs text-gray-600">
                  {new Date(plant.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
