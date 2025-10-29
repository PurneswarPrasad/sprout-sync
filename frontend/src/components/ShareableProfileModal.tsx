import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PlantSlugEditor } from './PlantSlugEditor';

interface ShareableProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  slug: string | null;
  onSlugUpdated: (newSlug: string) => void;
  plantName: string;
}

export function ShareableProfileModal({
  isOpen,
  onClose,
  plantId,
  slug,
  onSlugUpdated,
  plantName,
}: ShareableProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share {plantName} with your friends/family!</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <PlantSlugEditor
            plantId={plantId}
            slug={slug}
            onSlugUpdated={onSlugUpdated}
          />
        </div>
      </div>
    </div>
  );
}

