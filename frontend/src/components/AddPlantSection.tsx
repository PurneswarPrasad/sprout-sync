import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Leaf } from 'lucide-react';

export function AddPlantSection() {
  const navigate = useNavigate();

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Plant</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/ai-identification')}
          className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          <Camera className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="font-medium text-gray-800">Camera ID</span>
          <span className="text-sm text-gray-600">AI-powered</span>
        </button>
        <button
          onClick={() => navigate('/add-plant')}
          className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          <Leaf className="w-8 h-8 text-emerald-600 mb-2" />
          <span className="font-medium text-gray-800">Manual Entry</span>
          <span className="text-sm text-gray-600">Custom details</span>
        </button>
      </div>
    </div>
  );
}
