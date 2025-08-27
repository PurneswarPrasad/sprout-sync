import { Search, Filter, Plus, Camera, Leaf } from 'lucide-react';
import { Layout } from '../components/Layout';

export function PlantsPage() {
  const plants = [
    {
      id: 1,
      name: 'Monstera Deliciosa',
      type: 'Tropical',
      health: 'healthy',
      lastWatered: '2 days ago',
      image: '/api/placeholder/150/150',
      tags: ['Indoor', 'Large'],
    },
    {
      id: 2,
      name: 'Snake Plant',
      type: 'Succulent',
      health: 'needs-care',
      lastWatered: '5 days ago',
      image: '/api/placeholder/150/150',
      tags: ['Indoor', 'Low-maintenance'],
    },
    {
      id: 3,
      name: 'Pothos',
      type: 'Vining',
      health: 'healthy',
      lastWatered: '1 day ago',
      image: '/api/placeholder/150/150',
      tags: ['Indoor', 'Hanging'],
    },
    {
      id: 4,
      name: 'Aloe Vera',
      type: 'Succulent',
      health: 'healthy',
      lastWatered: '3 days ago',
      image: '/api/placeholder/150/150',
      tags: ['Indoor', 'Medicinal'],
    },
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'needs-care':
        return 'bg-yellow-500';
      case 'sick':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Plants</h1>
            <p className="text-gray-600">Manage your plant collection</p>
          </div>
          <button className="plant-button flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search plants..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Add Plant Options */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Plant</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
              <Camera className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-medium text-gray-800">Camera ID</span>
              <span className="text-sm text-gray-600">AI-powered</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
              <Leaf className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-medium text-gray-800">Manual Entry</span>
              <span className="text-sm text-gray-600">Custom details</span>
            </button>
          </div>
        </div>

        {/* Plants Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Your Plants ({plants.length})</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>All Plants</option>
              <option>Healthy</option>
              <option>Needs Care</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {plants.map((plant) => (
              <div key={plant.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 hover:scale-105 transition-transform duration-200">
                <div className="relative mb-3">
                  <div className="w-full h-32 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className={`absolute top-2 right-2 w-3 h-3 ${getHealthColor(plant.health)} rounded-full`}></div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">{plant.name}</h3>
                  <p className="text-sm text-gray-600">{plant.type}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {plant.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Last watered: {plant.lastWatered}</span>
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

