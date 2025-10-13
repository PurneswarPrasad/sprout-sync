import React from 'react';
import { CityAutocomplete } from './CityAutocomplete';
import { ImageUploadSection } from './ImageUploadSection';

interface FormData {
  petName: string;
  botanicalName: string;
  commonName: string;
  type: string;
  acquisitionDate: string;
  city: string;
  careLevel: string;
  sunRequirements: string;
  toxicityLevel: string;
}

interface ImageUploadSectionProps {
  imagePreview: string | null;
  isUploadingImage: boolean;
  isAutoPopulatingImage: boolean;
  isImageFromAI: boolean;
  aiTagMessage: string;
  onImageUpload: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapturePhoto: () => void;
  showCamera: boolean;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface BasicInfoSectionProps {
  formData: FormData;
  onFormDataChange: (updates: Partial<FormData>) => void;
  imageUploadProps: ImageUploadSectionProps;
}

export const BasicInfoSection = React.forwardRef<HTMLDivElement, BasicInfoSectionProps>(({
  formData,
  onFormDataChange,
  imageUploadProps,
}, ref) => {
  return (
    <div ref={ref} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>

      <div className="space-y-6">
        {/* Row 1: Pet Name + Botanical Name + Plant Image */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side: Pet Name and Botanical Name */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your plant's pet name
              </label>
              <input
                type="text"
                value={formData.petName}
                onChange={(e) => onFormDataChange({ petName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g., My Little Green Friend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Botanical name *
              </label>
              <input
                type="text"
                value={formData.botanicalName}
                onChange={(e) => onFormDataChange({ botanicalName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g., Sansevieria trifasciata"
                required
              />
            </div>
          </div>

          {/* Right side: Plant Image Upload */}
          <ImageUploadSection {...imageUploadProps} />
        </div>

        {/* Row 2: Common Name + Plant Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Common name *
            </label>
            <input
              type="text"
              value={formData.commonName}
              onChange={(e) => onFormDataChange({ commonName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Snake Plant"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Type
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => onFormDataChange({ type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Succulent, Tropical"
            />
          </div>
        </div>

        {/* Row 3: Acquisition Date + City/Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acquisition Date
            </label>
            <input
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => onFormDataChange({ acquisitionDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City/Location
            </label>
            <CityAutocomplete
              value={formData.city}
              onChange={(city) => onFormDataChange({ city })}
              placeholder="e.g., New York"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';
