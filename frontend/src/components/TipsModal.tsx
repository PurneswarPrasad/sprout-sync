import React from 'react';
import { X, Check } from 'lucide-react';

interface Tip {
  title: string;
  subtitle: string;
  goodExample: string;
  badExample: string;
  goodImage: string;
  badImage: string;
}

interface TipsModalProps {
  isOpen: boolean;
  currentTipIndex: number;
  onNext: () => void;
  onClose: () => void;
}

const tips: Tip[] = [
  {
    title: "Make sure your plant is in focus and well-lit",
    subtitle: "Avoid using LED grow lights",
    goodExample: "✓ Good: Sharp, well-lit plant",
    badExample: "✗ Bad: Blurry, poorly lit plant",
    goodImage: "/clear photo.jpg",
    badImage: "/blur photo.png"
  },
  {
    title: "Keep containers and other objects out of the frame",
    subtitle: "If the plant is too big, take a photo of its leaf or a flower",
    goodExample: "✓ Good: Clean plant focus",
    badExample: "✗ Bad: Container visible",
    goodImage: "/cosed up plant.jpg",
    badImage: "/container plant.jpg"
  },
  {
    title: "If your plant has flowers, focus on them",
    subtitle: "Flowers help with better identification",
    goodExample: "✓ Good: Flower focus",
    badExample: "✗ Bad: Whole plant view",
    goodImage: "/focused flower.jpg",
    badImage: "/flowering plant.jpg"
  }
];

export const TipsModal: React.FC<TipsModalProps> = ({
  isOpen,
  currentTipIndex,
  onNext,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex space-x-1">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentTipIndex ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {tips[currentTipIndex].title}
            </h3>
            <p className="text-sm text-gray-600">
              {tips[currentTipIndex].subtitle}
            </p>
          </div>

          {/* Example Images */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative rounded-lg overflow-hidden border-2 border-red-200">
                <img
                  src={tips[currentTipIndex].badImage}
                  alt="Bad example"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-2 left-2">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-red-600 font-medium bg-white/90 px-2 py-1 rounded">
                    {tips[currentTipIndex].badExample}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                <img
                  src={tips[currentTipIndex].goodImage}
                  alt="Good example"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-2 left-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-green-600 font-medium bg-white/90 px-2 py-1 rounded">
                    {tips[currentTipIndex].goodExample}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="w-full py-3 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            {currentTipIndex === tips.length - 1 ? 'Start Camera' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
